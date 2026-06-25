import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  NgZone,
  OnInit,
  signal,
} from '@angular/core';
import { DatePipe } from '@angular/common';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardSubtitle,
  IonCardContent,
  IonButton,
  IonIcon,
  IonText,
  IonItem,
  IonLabel,
  IonNote,
  IonBadge,
  IonRow,
  IonCol,
  IonButtons,
  IonBackButton,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  checkmarkOutline,
  closeOutline,
  receiptOutline,
  checkmarkDoneOutline,
  cashOutline,
} from 'ionicons/icons';
import { SupabaseService } from '../../../core/services/supabase';
import { LoadingComponent } from '../../../shared/components/loading/loading.component';
import { HapticsService } from '../../../core/services/haptics.service';
import { Pedido } from '../../../core/models';
import { RealtimeChannel } from '@supabase/supabase-js';
import jsPDF from 'jspdf';
interface PedidoUI extends Pedido {
  _exito: string;
  _error: string;
}

@Component({
  selector: 'app-pedidos',
  templateUrl: './pedidos.page.html',
  styleUrls: ['./pedidos.page.scss'],
  imports: [
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardSubtitle,
    IonCardContent,
    IonButton,
    IonIcon,
    IonText,
    IonItem,
    IonLabel,
    IonNote,
    IonBadge,
    IonRow,
    IonCol,
    IonButtons,
    IonBackButton,
    LoadingComponent,
    DatePipe,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PedidosPage implements OnInit {
  private readonly supabase = inject(SupabaseService);
  private readonly haptics = inject(HapticsService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly ngZone = inject(NgZone);

  pedidos = signal<PedidoUI[]>([]);
  cargando = signal(false);
  private canal?: RealtimeChannel;

  constructor() {
    addIcons({
      checkmarkOutline,
      closeOutline,
      receiptOutline,
      checkmarkDoneOutline,
      cashOutline,
    });
    this.destroyRef.onDestroy(() => {
      if (this.canal) this.supabase.client.removeChannel(this.canal);
    });
  }

  async ngOnInit() {
    await this.cargarPedidos();
    this.suscribirCambios();
  }

  async cargarPedidos() {
    this.cargando.set(true);
    const { data } = await this.supabase.client
      .from('pedidos')
      .select('*, mesas(numero), pedido_items(*)')
      .in('estado', ['esperando_mozo', 'en_cocina', 'listo', 'pago_solicitado'])
      .order('fecha_creacion', { ascending: true });
    this.pedidos.set(
      (data || []).map((p) => ({ ...p, _exito: '', _error: '' } as PedidoUI))
    );
    this.cargando.set(false);
  }

  suscribirCambios() {
    this.canal = this.supabase.client
      .channel('pedidos_mozo')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'pedidos' },
        () => this.ngZone.run(() => this.cargarPedidos())
      )
      .subscribe();
  }

  getBadgeColor(estado: string): string {
    const colores: Record<string, string> = {
      esperando_mozo: 'warning',
      en_cocina: 'primary',
      listo: 'success',
      pago_solicitado: 'tertiary',
    };
    return colores[estado] || 'medium';
  }

  private setExito(id: string, msg: string) {
    this.pedidos.update((ps) =>
      ps.map((p) => (p.id === id ? { ...p, _exito: msg, _error: '' } : p))
    );
    setTimeout(() => this.ngZone.run(() => this.cargarPedidos()), 1500);
  }

  private setError(id: string, e: unknown) {
    this.haptics.error();
    this.pedidos.update((ps) =>
      ps.map((p) =>
        p.id === id ? { ...p, _error: (e as Error).message, _exito: '' } : p
      )
    );
  }

  async confirmar(pedido: PedidoUI) {
    try {
      const { error } = await this.supabase.client
        .from('pedidos')
        .update({ estado: 'en_cocina' })
        .eq('id', pedido.id);
      if (error) throw error;
      this.setExito(pedido.id, 'Pedido confirmado y enviado a cocina/bar.');
    } catch (e: unknown) {
      this.setError(pedido.id, e);
    }
  }

  async rechazar(pedido: PedidoUI) {
    try {
      const { error } = await this.supabase.client
        .from('pedidos')
        .update({ estado: 'rechazado_mozo' })
        .eq('id', pedido.id);
      if (error) throw error;
      this.setExito(
        pedido.id,
        'Pedido rechazado. El cliente deberá modificarlo.'
      );
    } catch (e: unknown) {
      this.setError(pedido.id, e);
    }
  }

  async entregar(pedido: PedidoUI) {
    try {
      const { error } = await this.supabase.client
        .from('pedidos')
        .update({ estado: 'entregado' })
        .eq('id', pedido.id);
      if (error) throw error;
      this.setExito(pedido.id, 'Pedido entregado al cliente.');
    } catch (e: unknown) {
      this.setError(pedido.id, e);
    }
  }

  async confirmarPago(pedido: PedidoUI) {
    try {
      // =========================
      // 1. ACTUALIZAR ESTADOS BASE
      // =========================
      const { error: e1 } = await this.supabase.client
        .from('pedidos')
        .update({ estado: 'pagado' })
        .eq('mesa_id', pedido.mesa_id)
        .not('estado', 'in', '("pagado","cancelado")');

      if (e1) throw e1;

      const { error: e2 } = await this.supabase.client
        .from('mesas')
        .update({ estado: 'disponible' })
        .eq('id', pedido.mesa_id);

      if (e2) throw e2;

      const { error: e3 } = await this.supabase.client
        .from('lista_espera')
        .update({ estado: 'finalizado' })
        .eq('mesa_id', pedido.mesa_id)
        .eq('estado', 'asignado');

      if (e3) throw e3;

      // =========================
      // 2. OBTENER USUARIO
      // =========================
      const { data: pedidoUsuario, error: e4 } = await this.supabase.client
        .from('pedidos')
        .select('usuario_id')
        .eq('mesa_id', pedido.mesa_id)
        .limit(1)
        .single();

      if (e4) throw e4;

      const esAnonimo = !pedidoUsuario?.usuario_id;

      let usuario = null;

      if (!esAnonimo) {
        const { data: u, error: e5 } = await this.supabase.client
          .from('usuarios')
          .select('*')
          .eq('id', pedidoUsuario.usuario_id)
          .single();

        if (e5) throw e5;
        usuario = u;
      }

      //OBTENER MESA
      const { data: mesa, error: mesaError } = await this.supabase.client
        .from('mesas')
        .select('numero')
        .eq('id', pedido.mesa_id)
        .single();

      if (mesaError) throw mesaError;

      const numeroMesa = mesa.numero;

      // =========================
      // 3. GENERAR PDF
      // =========================

      const logoBase64 = await this.obtenerLogoBase64();

      const pdf = new jsPDF();

      // Logo
      pdf.addImage(logoBase64, 'PNG', 80, 10, 50, 50);

      // Nombre restaurante
      pdf.setFontSize(18);
      pdf.text('RESTAURANTE BITRO', 105, 70, {
        align: 'center',
      });

      // Dirección
      pdf.setFontSize(11);
      pdf.text('Av. Siempre Viva 123 - Buenos Aires', 105, 78, {
        align: 'center',
      });

      // Datos factura
      pdf.setFontSize(14);
      pdf.text(`Factura N° ${pedido.id}`, 20, 100);
      pdf.text(`Fecha: ${new Date().toLocaleString()}`, 20, 110);

      // Datos cliente
      pdf.text('Datos del cliente', 20, 130);

      if (esAnonimo) {
        pdf.setFontSize(12);
        pdf.text('Cliente: Anónimo', 20, 140);
      } else {
        pdf.text(`Nombre: ${usuario?.nombre ?? '-'}`, 20, 140);
        pdf.text(`Apellido: ${usuario?.apellido ?? '-'}`, 20, 150);
        pdf.text(`DNI: ${usuario?.dni ?? '-'}`, 20, 150);
        pdf.text(`Cuil: ${usuario?.cuil ?? '-'}`, 20, 150);
        pdf.text(`Email: ${usuario?.email ?? '-'}`, 20, 150);

      }

      // Pedido
      pdf.setFontSize(14);
      pdf.text(`Pedido N° ${pedido.id}`, 20, 175);

      pdf.setFontSize(12);
      pdf.text(`Mesa: ${numeroMesa}`, 20, 185);

      pdf.line(20, 195, 190, 195);

      pdf.text('Detalle de lo facturado', 20, 205);

      //items de la compra
      pdf.text(
        pedido.pedido_items
          ?.map(
            (i) =>
              `${i.cantidad} x ${i.nombre} - $${i.precio} = $${
                i.cantidad * i.precio
              }`
          )
          .join('\n') || '',
        20,
        215
      );
      // total
      const total =
        pedido.pedido_items?.reduce(
          (acc, i) => acc + i.cantidad * i.precio,
          0
        ) ?? 0;

      pdf.setFontSize(14);
      pdf.text(`TOTAL: $${total}`, 20, 250);

      const pdfDataUri = pdf.output('datauristring');
      const pdfBase64 = pdfDataUri.split(',')[1];
      const pdfNombre = `comprobante-${pedido.id}.pdf`;

      // =========================
      // 4. USUARIO REGISTRADO → EMAIL
      // =========================
      if (!esAnonimo && usuario?.email) {
        const { error: e6 } = await this.supabase.client.functions.invoke(
          'enviar-correo',
          {
            body: {
              email: usuario.email,
              nombre: usuario.nombre,
              accion: 'factura',
              auth_id: usuario.auth_id,
              pdfBase64,
              pdfNombre,
            },
            headers: {
              Authorization: `Bearer ${
                (
                  await this.supabase.client.auth.getSession()
                ).data.session?.access_token
              }`,
            },
          }
        );

        if (e6) console.error('Error enviando correo:', e6);
      }

      // =========================
      // 5. CLIENTE ANÓNIMO → STORAGE + DB + LINK
      // =========================
      if (esAnonimo) {
        const filePath = `factura-${pedido.id}.pdf`;

        // 🔥 FIX: convertir base64 → FILE (NO BLOBB)
        const byteCharacters = atob(pdfBase64);
        const byteNumbers = new Array(byteCharacters.length);

        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }

        const byteArray = new Uint8Array(byteNumbers);

        const pdfFile = new File([byteArray], `factura-${pedido.id}.pdf`, {
          type: 'application/pdf',
        });

        // subir a storage
        console.log('Llegué al upload');
        const { error: uploadError } = await this.supabase.client.storage
          .from('facturas')
          .upload(filePath, pdfFile, {
            contentType: 'application/pdf',
            upsert: true,
          });

        if (uploadError) {
          console.error('UPLOAD ERROR:', uploadError);
          throw uploadError;
        }
        console.log('Voy a subir:', filePath);

        // generar link firmado
        const { data: signed, error: signError } =
          await this.supabase.client.storage
            .from('facturas')
            .createSignedUrl(filePath, 60 * 60, {
              download: `factura-${pedido.id}.pdf`,
            });

        if (signError) throw signError;

        const pdfUrl = signed.signedUrl;

        // guardar en tabla facturas
        const { error: dbError } = await this.supabase.client
          .from('facturas')
          .insert({
            pedido_id: pedido.id,
            mesa_id: pedido.mesa_id,
            tipo: 'anonimo',
            nombre_cliente: 'Anonimo',
            email: null,
            pdf_url: pdfUrl,
            estado: 'generado',
          });

        if (dbError) throw dbError;
      }

      // =========================
      // 6. SUCCESS UI
      // =========================
      this.setExito(
        pedido.id,
        'Pago confirmado. Factura generada correctamente.'
      );
    } catch (e: unknown) {
      console.error('ERROR confirmarPago:', e);
      this.setError(pedido.id, e);
    }
  }

  async obtenerLogoBase64(): Promise<string> {
    const response = await fetch('/assets/img/logo.png');
    console.log('Logo status:', response.status);
    const blob = await response.blob();

    return await new Promise((resolve) => {
      const reader = new FileReader();

      reader.onloadend = () => {
        resolve(reader.result as string);
      };

      reader.readAsDataURL(blob);
    });
  }
}

