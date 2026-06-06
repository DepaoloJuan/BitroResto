import { ChangeDetectionStrategy, Component, DestroyRef, inject, NgZone, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonButton, IonIcon,
  IonSpinner, IonText, IonButtons, IonBackButton,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { timeOutline, hourglassOutline, checkmarkCircleOutline, barChartOutline, scanOutline, qrCodeOutline, closeCircleOutline } from 'ionicons/icons';
import { BarcodeScanner, BarcodeFormat } from '@capacitor-mlkit/barcode-scanning';
import { AuthService } from '../../../core/services/auth';
import { SupabaseService } from '../../../core/services/supabase';
import { NotificacionesService } from '../../../core/services/notificaciones';
import { HapticsService } from '../../../core/services/haptics.service';
import { Mesa } from '../../../core/models';
import { RealtimeChannel } from '@supabase/supabase-js';

@Component({
  selector: 'app-lista-espera',
  templateUrl: './lista-espera.page.html',
  styleUrls: ['./lista-espera.page.scss'],
  imports: [
    IonHeader, IonToolbar, IonTitle, IonContent, IonButton, IonIcon,
    IonSpinner, IonText, IonButtons, IonBackButton,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ListaEsperaPage implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly supabase = inject(SupabaseService);
  private readonly notificaciones = inject(NotificacionesService);
  private readonly haptics = inject(HapticsService);
  readonly router = inject(Router);
  private readonly ngZone = inject(NgZone);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly usuario = this.authService.usuario;
  qrEscaneado = signal(false);
  escaneando = signal(false);
  errorQR = signal('');
  yaEnEspera = signal(false);
  rechazado = signal(false);
  mesaAsignada = signal<Mesa | null>(null);
  escaneandoMesa = signal(false);
  errorQRMesa = signal('');
  cargando = signal(false);
  errorGeneral = signal('');

  private canal?: RealtimeChannel;

  constructor() {
    addIcons({ timeOutline, hourglassOutline, checkmarkCircleOutline, barChartOutline, scanOutline, qrCodeOutline, closeCircleOutline });
    this.destroyRef.onDestroy(() => {
      if (this.canal) this.supabase.client.removeChannel(this.canal);
    });
  }

  async ngOnInit() {
    await this.verificarEstado();
    this.suscribirCambios();
  }

  async escanearQrEntrada() {
    this.errorQR.set('');
    this.escaneando.set(true);
    try {
      const { supported } = await BarcodeScanner.isSupported();
      if (!supported) {
        this.errorQR.set('Este dispositivo no soporta la lectura de códigos QR.');
        await this.haptics.error();
        return;
      }
      await BarcodeScanner.requestPermissions();
      const { barcodes } = await BarcodeScanner.scan({ formats: [BarcodeFormat.QrCode] });
      if (barcodes.length === 0) return;
      const valor = barcodes[0].rawValue ?? '';
      if (valor !== 'com.bitroresto.app://entrada') {
        this.errorQR.set('Este QR no es el de entrada al local. Escaneá el código QR de la puerta.');
        await this.haptics.error();
        return;
      }
      this.qrEscaneado.set(true);
    } catch (error: unknown) {
      const e = error as any;
      if (e?.message === 'scan canceled.' || e?.errorMessage === 'scan canceled.') return;
      this.errorQR.set('Ocurrió un error al leer el QR. Intentá de nuevo.');
      await this.haptics.error();
    } finally {
      this.escaneando.set(false);
    }
  }

  async verificarEstado() {
    const usuario = this.authService.getUsuarioActual();
    if (!usuario) return;
    const { data } = await this.supabase.client
      .from('lista_espera').select('*, mesas(*)')
      .eq('usuario_id', usuario.id).order('fecha_ingreso', { ascending: false }).limit(1).single();
    if (!data) return;
    if (data.estado === 'esperando') {
      this.qrEscaneado.set(true);
      this.yaEnEspera.set(true);
    } else if (data.estado === 'asignado' && data.mesas) {
      this.qrEscaneado.set(true);
      this.mesaAsignada.set(data.mesas as Mesa);
    } else if (data.estado === 'rechazado') {
      this.yaEnEspera.set(false);
      this.rechazado.set(true);
    }
  }

  suscribirCambios() {
    const usuario = this.authService.getUsuarioActual();
    if (!usuario) return;
    this.canal = this.supabase.client
      .channel('espera_cliente')
      .on('postgres_changes', {
        event: 'UPDATE', schema: 'public', table: 'lista_espera',
        filter: `usuario_id=eq.${usuario.id}`,
      }, async (payload) => this.ngZone.run(async () => {
        const estado = (payload.new as any)?.estado;
        if (estado === 'asignado') {
          await this.notificaciones.enviar('¡Tu mesa está lista!', 'Se te asignó la mesa. Ya podés dirigirte a ella.');
        } else if (estado === 'rechazado') {
          await this.notificaciones.enviar('Lista de espera', 'El metre rechazó tu solicitud.');
        }
        await this.verificarEstado();
      }))
      .subscribe();
  }

  async anotarse() {
    this.errorGeneral.set('');
    const usuario = this.authService.getUsuarioActual();
    if (!usuario) return;
    try {
      this.cargando.set(true);
      const { error } = await this.supabase.client.from('lista_espera').insert({
        nombre: `${usuario.nombre} ${usuario.apellido}`,
        foto: usuario.foto || null, tipo_cliente: 'registrado',
        usuario_id: usuario.id, estado: 'esperando',
      });
      if (error) throw error;
      this.yaEnEspera.set(true);
    } catch (e: unknown) {
      this.errorGeneral.set((e as Error).message || 'Error al anotarse en la lista de espera.');
      await this.haptics.error();
    } finally {
      this.cargando.set(false);
    }
  }

  async escanearQrMesa() {
    this.errorQRMesa.set('');
    this.escaneandoMesa.set(true);
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
      const mesa = this.mesaAsignada();

      if (!mesaIdEscaneado || mesaIdEscaneado !== mesa?.id) {
        await this.haptics.error();
        this.errorQRMesa.set(`Esta no es tu mesa. Tu mesa es la número ${mesa?.numero}.`);
        return;
      }

      this.router.navigate(['/cliente/mesa'], { state: { qrValidado: true } });
    } catch (error: unknown) {
      const e = error as any;
      if (e?.message === 'scan canceled.' || e?.errorMessage === 'scan canceled.') return;
      this.errorQRMesa.set('Ocurrió un error al leer el QR. Intentá de nuevo.');
      await this.haptics.error();
    } finally {
      this.escaneandoMesa.set(false);
    }
  }

  ir(ruta: string) { this.router.navigate([ruta]); }
}
