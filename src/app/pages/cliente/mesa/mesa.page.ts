import { ChangeDetectionStrategy, Component, computed, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { TitleCasePipe } from '@angular/common';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonButton, IonIcon,
  IonGrid, IonRow, IonCol, IonCard, IonCardHeader, IonCardTitle, IonCardSubtitle,
  IonCardContent, IonItem, IonLabel, IonText, IonSpinner,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  checkmarkCircleOutline, restaurantOutline, cartOutline, chatbubblesOutline,
  gameControllerOutline, starOutline, receiptOutline, barChartOutline, logOutOutline,
  hourglassOutline, closeCircleOutline, checkmarkDoneOutline, bicycleOutline,
  timeOutline, peopleOutline, ellipse, scanOutline, qrCodeOutline, chevronForwardOutline,
} from 'ionicons/icons';
import { BarcodeScanner, BarcodeFormat } from '@capacitor-mlkit/barcode-scanning';
import { AuthService } from '../../../core/services/auth';
import { SupabaseService } from '../../../core/services/supabase';
import { NotificacionesService } from '../../../core/services/notificaciones';
import { HapticsService } from '../../../core/services/haptics.service';
import { LoadingComponent } from '../../../shared/components/loading/loading.component';
import { Mesa, Pedido } from '../../../core/models';
import { RealtimeChannel } from '@supabase/supabase-js';

@Component({
  selector: 'app-mesa',
  templateUrl: './mesa.page.html',
  styleUrls: ['./mesa.page.scss'],
  imports: [
    TitleCasePipe, IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonButton, IonIcon,
    IonGrid, IonRow, IonCol, IonCard, IonCardHeader, IonCardTitle, IonCardSubtitle,
    IonCardContent, IonItem, IonLabel, IonText, IonSpinner, LoadingComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MesaPage implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly supabase = inject(SupabaseService);
  private readonly notificaciones = inject(NotificacionesService);
  private readonly haptics = inject(HapticsService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);

  cargando = signal(true);
  mesa = signal<Mesa | null>(null);
  pedido = signal<Pick<Pedido, 'id' | 'estado'> | null>(null);
  esAnonimo = signal(false);
  esEmpleado = signal(false);
  qrEscaneado = signal(false);
  escaneandoQR = signal(false);
  errorQRMesa = signal('');

  private mesaId = '';
  private canal?: RealtimeChannel;
  private primeraVez = true;
  mesaAsignada = signal<{ numero: number; tipo: string } | null>(null);

  readonly estado = computed(() => this.pedido()?.estado ?? '');
  readonly puedePedir = computed(() => !this.estado() || this.estado() === 'rechazado_mozo');
  readonly puedeJugar = computed(() =>
    !this.esAnonimo() && ['en_cocina', 'confirmado', 'pendiente', 'completado', 'listo', 'entregado', 'recibido'].includes(this.estado())
  );
  readonly puedeEncuesta = computed(() => this.estado() === 'recibido');
  readonly puedeCuenta = computed(() => this.estado() === 'recibido');

  readonly estadoTexto = computed(() => {
    const map: Record<string, string> = {
      esperando_mozo: '⏳ Pedido enviado, esperando al mozo',
      rechazado_mozo: '❌ El mozo rechazó tu pedido, podés modificarlo',
      confirmado: '✅ Pedido confirmado, en preparación',
      pendiente: '🍳 Tu pedido está siendo preparado',
      completado: '🔔 Tu pedido está listo para ser entregado',
      listo: '🔔 Tu pedido está listo para ser entregado',
      entregado: '🎉 Pedido entregado, ¡buen provecho!',
      recibido: '🎉 Pedido entregado, ¡buen provecho!',
      pago_solicitado: '💳 Cuenta solicitada, esperando al mozo',
    };
    return map[this.estado()] ?? '';
  });

  readonly estadoColor = computed(() => {
    const map: Record<string, string> = {
      esperando_mozo: 'warning', rechazado_mozo: 'danger', confirmado: 'primary',
      pendiente: 'primary', completado: 'success', listo: 'success',
      entregado: 'success', recibido: 'success', pago_solicitado: 'warning',
    };
    return map[this.estado()] ?? 'light';
  });

  readonly estadoIcono = computed(() => {
    const map: Record<string, string> = {
      esperando_mozo: 'hourglass-outline', rechazado_mozo: 'close-circle-outline',
      confirmado: 'checkmark-circle-outline', pendiente: 'time-outline',
      completado: 'checkmark-done-outline', listo: 'checkmark-done-outline',
      entregado: 'checkmark-done-outline', recibido: 'checkmark-done-outline',
      pago_solicitado: 'hourglass-outline',
    };
    return map[this.estado()] ?? 'information-circle-outline';
  });

  constructor() {
    addIcons({
      checkmarkCircleOutline, restaurantOutline, cartOutline, chatbubblesOutline,
      gameControllerOutline, starOutline, receiptOutline, barChartOutline, logOutOutline,
      hourglassOutline, closeCircleOutline, checkmarkDoneOutline, bicycleOutline,
      timeOutline, peopleOutline, ellipse, scanOutline, qrCodeOutline, chevronForwardOutline,
    });
    this.destroyRef.onDestroy(() => {
      if (this.canal) this.supabase.client.removeChannel(this.canal);
    });
  }

  ionViewWillEnter() {
    if (this.primeraVez) { this.primeraVez = false; return; }
    if (this.esEmpleado()) return;
    // Cada vez que el cliente vuelve a esta pantalla, requiere escanear QR de nuevo
    this.qrEscaneado.set(false);
    this.cargando.set(false);
    if (this.canal) {
      this.supabase.client.removeChannel(this.canal);
      this.canal = undefined;
    }
  }

  async ngOnInit() {
    const usuario = this.authService.getUsuarioActual();
    const perfilesEmpleado = ['metre', 'mozo', 'dueño', 'supervisor'];

    if (perfilesEmpleado.includes(usuario?.perfil ?? '')) {
      this.esEmpleado.set(true);
      const idQR = this.route.snapshot.queryParamMap.get('id');
      if (idQR) this.mesaId = idQR;
      await this.cargarMesa();
      this.cargando.set(false);
      return;
    }

    this.esAnonimo.set(!usuario?.perfil);
    await this.obtenerMesaAsignada();

    if (history.state?.qrValidado === true && this.mesaId) {
      this.qrEscaneado.set(true);
      await this.cargarMesa();
      await this.cargarPedido();
      this.suscribirCambios();
      return;
    }

    this.cargando.set(false);
  }

  private async obtenerMesaAsignada() {
    const usuario = this.authService.getUsuarioActual();
    if (this.esAnonimo()) {
      this.mesaId = usuario?.mesa_id || '';
      if (this.mesaId) {
        const { data } = await this.supabase.client
          .from('mesas').select('numero, tipo').eq('id', this.mesaId).single();
        if (data) this.mesaAsignada.set({ numero: data.numero, tipo: data.tipo });
      }
      return;
    }
    const { data } = await this.supabase.client
      .from('lista_espera').select('mesa_id, mesas(numero, tipo)')
      .eq('usuario_id', usuario!.id).eq('estado', 'asignado').single();
    this.mesaId = data?.mesa_id || '';
    const m = data?.mesas as any;
    if (m?.numero) this.mesaAsignada.set({ numero: m.numero, tipo: m.tipo ?? '' });
  }

  async escanearQrMesa() {
    this.errorQRMesa.set('');
    this.escaneandoQR.set(true);
    try {
      const { supported } = await BarcodeScanner.isSupported();
      if (!supported) {
        this.errorQRMesa.set('Este dispositivo no soporta la lectura de códigos QR.');
        await this.haptics.error();
        return;
      }
      await BarcodeScanner.requestPermissions();
      const { barcodes } = await BarcodeScanner.scan({ formats: [BarcodeFormat.QrCode] });
      if (barcodes.length === 0) return;

      const valor = barcodes[0].rawValue ?? '';
      const match = valor.match(/[?&]id=([^&]+)/);
      const mesaIdEscaneado = match?.[1];

      if (!mesaIdEscaneado || mesaIdEscaneado !== this.mesaId) {
        await this.haptics.error();
        this.errorQRMesa.set(`Esta no es tu mesa. Tu mesa es la número ${this.mesaAsignada()?.numero}.`);
        return;
      }

      this.qrEscaneado.set(true);
      this.cargando.set(true);
      await this.cargarMesa();
      await this.cargarPedido();
      this.suscribirCambios();
    } catch (error: unknown) {
      const e = error as any;
      if (e?.message === 'scan canceled.' || e?.errorMessage === 'scan canceled.') return;
      this.errorQRMesa.set('Ocurrió un error al leer el QR. Intentá de nuevo.');
      await this.haptics.error();
    } finally {
      this.escaneandoQR.set(false);
    }
  }

  async cargarMesa() {
    if (!this.mesaId) return;
    const { data } = await this.supabase.client.from('mesas').select('*').eq('id', this.mesaId).single();
    this.mesa.set(data);
  }

  async cargarPedido() {
    if (!this.mesaId) { this.cargando.set(false); return; }
    const { data: mesaData } = await this.supabase.client
      .from('mesas').select('estado').eq('id', this.mesaId).single();
    if (mesaData?.estado === 'disponible') {
      if (this.esAnonimo()) {
        this.authService.setUsuarioAnonimo(null);
        this.router.navigate(['/login'], { replaceUrl: true });
      } else {
        this.router.navigate(['/cliente/home'], { replaceUrl: true });
      }
      return;
    }
    const { data } = await this.supabase.client
      .from('pedidos').select('id, estado').eq('mesa_id', this.mesaId)
      .not('estado', 'in', '("pagado","cancelado")')
      .order('fecha_creacion', { ascending: false }).limit(1).maybeSingle();
    this.pedido.set(data);
    this.cargando.set(false);
  }

  suscribirCambios() {
    if (!this.mesaId) return;
    this.canal = this.supabase.client
      .channel('mesa_hub_' + this.mesaId)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'pedidos', filter: `mesa_id=eq.${this.mesaId}` },
        async (payload) => {
          const estado = (payload.new as any)?.estado;
          if (estado === 'rechazado_mozo') {
            await this.notificaciones.enviar('Pedido rechazado', 'El mozo rechazó tu pedido. Podés modificarlo y reenviarlo.');
          } else if (estado === 'listo') {
            await this.notificaciones.enviar('¡Tu pedido está listo!', 'Ya llega el mozo con tu pedido.');
          }
          await this.cargarPedido();
        })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'mesas', filter: `id=eq.${this.mesaId}` },
        () => this.cargarPedido())
      .subscribe();
  }

  async confirmarRecepcion() {
    const p = this.pedido();
    if (!p?.id) return;
    const { error } = await this.supabase.client.from('pedidos').update({ estado: 'recibido' }).eq('id', p.id);
    if (!error) {
      await this.cargarPedido();
      this.qrEscaneado.set(false);
    }
  }

  ir(ruta: string) { this.router.navigate([ruta]); }
  salir() { this.authService.logout(); }
}
