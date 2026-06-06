import { ChangeDetectionStrategy, Component, computed, DestroyRef, inject, NgZone, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonButton, IonIcon,
  IonGrid, IonRow, IonCol, IonCard, IonCardContent, IonItem, IonLabel,
  IonText, IonSpinner,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  checkmarkCircleOutline, restaurantOutline, chatbubblesOutline,
  barChartOutline, logOutOutline, scanOutline, qrCodeOutline, receiptOutline,
  sendOutline, checkmarkDoneOutline, bicycleOutline, hourglassOutline,
  closeCircleOutline, checkmarkOutline, chevronForwardOutline,
} from 'ionicons/icons';
import { BarcodeScanner, BarcodeFormat } from '@capacitor-mlkit/barcode-scanning';
import { AuthService } from '../../../core/services/auth';
import { SupabaseService } from '../../../core/services/supabase';
import { NotificacionesService } from '../../../core/services/notificaciones';
import { HapticsService } from '../../../core/services/haptics.service';
import { Mesa, Pedido } from '../../../core/models';
import { RealtimeChannel } from '@supabase/supabase-js';

@Component({
  selector: 'app-anonimo-mesa',
  templateUrl: './anonimo-mesa.page.html',
  styleUrls: ['./anonimo-mesa.page.scss'],
  imports: [
    IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonButton, IonIcon,
    IonGrid, IonRow, IonCol, IonCard, IonCardContent, IonItem, IonLabel,
    IonText, IonSpinner,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AnonimoMesaPage implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly supabase = inject(SupabaseService);
  private readonly notificaciones = inject(NotificacionesService);
  private readonly haptics = inject(HapticsService);
  private readonly router = inject(Router);
  private readonly ngZone = inject(NgZone);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly usuario = this.authService.usuario;
  mesa = signal<Mesa | null>(null);
  pedido = signal<Pick<Pedido, 'id' | 'estado'> | null>(null);
  qrEscaneado = signal(false);
  escaneandoQR = signal(false);
  errorQRMesa = signal('');

  readonly estadoPedido = computed(() => this.pedido()?.estado ?? '');
  readonly puedeCuenta = computed(() => this.estadoPedido() === 'recibido');
  readonly puedeConfirmar = computed(() => this.estadoPedido() === 'entregado');

  readonly estadoTexto = computed(() => {
    const map: Record<string, string> = {
      esperando_mozo: '⏳ Pedido enviado, esperando al mozo',
      rechazado_mozo: '❌ El mozo rechazó tu pedido, podés modificarlo',
      en_cocina: '🍳 Tu pedido está siendo preparado',
      listo: '🔔 Tu pedido está listo para ser entregado',
      entregado: '🎉 Pedido entregado, ¡buen provecho!',
      recibido: '🎉 Pedido entregado, ¡buen provecho!',
      pago_solicitado: '💳 Cuenta solicitada, esperando al mozo',
    };
    return map[this.estadoPedido()] ?? '';
  });

  readonly estadoColor = computed(() => {
    const map: Record<string, string> = {
      esperando_mozo: 'warning', rechazado_mozo: 'danger',
      listo: 'success', entregado: 'success', recibido: 'success',
      pago_solicitado: 'warning',
    };
    return map[this.estadoPedido()] ?? 'light';
  });

  readonly estadoIcono = computed(() => {
    const map: Record<string, string> = {
      esperando_mozo: 'hourglass-outline', rechazado_mozo: 'close-circle-outline',
      listo: 'checkmark-done-outline', entregado: 'checkmark-done-outline',
      recibido: 'checkmark-done-outline', pago_solicitado: 'hourglass-outline',
    };
    return map[this.estadoPedido()] ?? 'information-circle-outline';
  });

  readonly pasos = [
    { label: 'Enviado', icono: 'send-outline' },
    { label: 'En cocina', icono: 'restaurant-outline' },
    { label: 'Listo', icono: 'checkmark-done-outline' },
    { label: 'Entregado', icono: 'bicycle-outline' },
  ];

  readonly pasoActual = computed(() => {
    const map: Record<string, number> = {
      esperando_mozo: 0, en_cocina: 1, listo: 2, entregado: 3, recibido: 4,
    };
    return map[this.estadoPedido()] ?? -1;
  });

  readonly mostrarTracker = computed(() => this.pasoActual() >= 0);
  readonly mostrarBanner = computed(() =>
    ['rechazado_mozo', 'pago_solicitado'].includes(this.estadoPedido())
  );

  private mesaId = '';
  private mesaNumero = 0;
  private canal?: RealtimeChannel;

  constructor() {
    addIcons({
      checkmarkCircleOutline, restaurantOutline, chatbubblesOutline, barChartOutline,
      logOutOutline, scanOutline, qrCodeOutline, receiptOutline, sendOutline,
      checkmarkDoneOutline, bicycleOutline, hourglassOutline, closeCircleOutline,
      checkmarkOutline, chevronForwardOutline,
    });
    this.destroyRef.onDestroy(() => {
      if (this.canal) this.supabase.client.removeChannel(this.canal);
    });
  }

  ionViewWillEnter() {
    if (this.mesaId) return; // ya validado, no resetear al volver de otra pantalla
    this.qrEscaneado.set(false);
    if (this.canal) {
      this.supabase.client.removeChannel(this.canal);
      this.canal = undefined;
    }
  }

  async ngOnInit() {
    const u = this.authService.getUsuarioActual();
    this.mesaId = u?.mesa_id || '';
    if (!this.mesaId) return;

    const { data: mesaData } = await this.supabase.client
      .from('mesas').select('*').eq('id', this.mesaId).single();
    if (!mesaData) return;

    this.mesaNumero = mesaData.numero ?? 0;

    // Si la mesa sigue ocupada, restauramos el hub directamente (QR ya fue validado antes)
    if (mesaData.estado === 'ocupada' || history.state?.qrValidado === true) {
      this.mesa.set(mesaData);
      this.qrEscaneado.set(true);
      await this.cargarPedido();
      this.suscribirCambios();
    }
  }

  async cargarPedido() {
    if (!this.mesaId) return;
    const { data: mesaData } = await this.supabase.client
      .from('mesas').select('estado').eq('id', this.mesaId).single();
    if (mesaData?.estado === 'disponible') {
      this.authService.setUsuarioAnonimo(null);
      this.router.navigate(['/login'], { replaceUrl: true });
      return;
    }
    const { data } = await this.supabase.client
      .from('pedidos').select('id, estado').eq('mesa_id', this.mesaId)
      .not('estado', 'in', '("pagado","cancelado")')
      .order('fecha_creacion', { ascending: false }).limit(1).maybeSingle();
    this.pedido.set(data);
  }

  suscribirCambios() {
    if (!this.mesaId) return;
    this.canal = this.supabase.client
      .channel('anonimo_mesa_hub_' + this.mesaId)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'pedidos', filter: `mesa_id=eq.${this.mesaId}` },
        (payload) => this.ngZone.run(async () => {
          const estado = (payload.new as any)?.estado;
          if (estado === 'rechazado_mozo') {
            await this.notificaciones.enviar('Pedido rechazado', 'El mozo rechazó tu pedido. Podés modificarlo y reenviarlo.');
          } else if (estado === 'listo') {
            await this.notificaciones.enviar('¡Tu pedido está listo!', 'Ya llega el mozo con tu pedido.');
          }
          await this.cargarPedido();
        }))
      .subscribe();
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
        this.errorQRMesa.set(`Esta no es tu mesa. Tu mesa es la número ${this.mesaNumero}.`);
        return;
      }

      const { data } = await this.supabase.client.from('mesas').select('*').eq('id', this.mesaId).single();
      this.mesa.set(data);
      this.qrEscaneado.set(true);
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
  verEncuestas() { this.router.navigate(['/cliente/encuesta-resultados']); }
  salir() { this.authService.setUsuarioAnonimo(null); this.router.navigate(['/login']); }
}
