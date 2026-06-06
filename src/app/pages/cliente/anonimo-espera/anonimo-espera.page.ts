import { ChangeDetectionStrategy, Component, DestroyRef, inject, NgZone, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonButton, IonIcon, IonButtons,
  IonText, IonSpinner,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { hourglassOutline, checkmarkCircleOutline, logOutOutline, barChartOutline, scanOutline, qrCodeOutline } from 'ionicons/icons';
import { BarcodeScanner, BarcodeFormat } from '@capacitor-mlkit/barcode-scanning';
import { AuthService } from '../../../core/services/auth';
import { SupabaseService } from '../../../core/services/supabase';
import { HapticsService } from '../../../core/services/haptics.service';
import { Mesa } from '../../../core/models';
import { RealtimeChannel } from '@supabase/supabase-js';

@Component({
  selector: 'app-anonimo-espera',
  templateUrl: './anonimo-espera.page.html',
  styleUrls: ['./anonimo-espera.page.scss'],
  imports: [IonHeader, IonToolbar, IonTitle, IonContent, IonButton, IonIcon, IonButtons, IonText, IonSpinner],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AnonimoEsperaPage implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly supabase = inject(SupabaseService);
  private readonly haptics = inject(HapticsService);
  private readonly router = inject(Router);
  private readonly ngZone = inject(NgZone);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly usuario = this.authService.usuario;
  mesaAsignada = signal<Mesa | null>(null);
  escaneandoMesa = signal(false);
  errorQRMesa = signal('');

  private canal?: RealtimeChannel;

  constructor() {
    addIcons({ hourglassOutline, checkmarkCircleOutline, logOutOutline, barChartOutline, scanOutline, qrCodeOutline });
    this.destroyRef.onDestroy(() => {
      if (this.canal) this.supabase.client.removeChannel(this.canal);
    });
  }

  async ngOnInit() {
    await this.verificarEstado();
    this.suscribirCambios();
  }

  async verificarEstado() {
    const u = this.authService.getUsuarioActual();
    if (!u) return;
    const { data } = await this.supabase.client
      .from('lista_espera').select('*, mesas(*)')
      .eq('nombre', u.nombre).eq('tipo_cliente', 'anonimo')
      .in('estado', ['esperando', 'asignado'])
      .order('fecha_ingreso', { ascending: false }).limit(1).single();
    if (!data) return;
    if (data.estado === 'asignado' && data.mesas) {
      this.mesaAsignada.set(data.mesas as Mesa);
      this.authService.setUsuarioAnonimo({ ...u, mesa_id: data.mesa_id, lista_espera_id: data.id });
    }
  }

  suscribirCambios() {
    this.canal = this.supabase.client
      .channel('anonimo_espera')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'lista_espera' },
        () => this.ngZone.run(() => this.verificarEstado()))
      .subscribe();
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

      this.router.navigate(['/cliente/anonimo-mesa'], { state: { qrValidado: true } });
    } catch (error: unknown) {
      const e = error as any;
      if (e?.message === 'scan canceled.' || e?.errorMessage === 'scan canceled.') return;
      this.errorQRMesa.set('Ocurrió un error al leer el QR. Intentá de nuevo.');
      await this.haptics.error();
    } finally {
      this.escaneandoMesa.set(false);
    }
  }

  verEncuestas() { this.router.navigate(['/cliente/encuesta-resultados']); }
  salir() { this.authService.setUsuarioAnonimo(null); this.router.navigate(['/login']); }
}
