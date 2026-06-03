import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonItem, IonLabel, IonInput,
  IonButton, IonText, IonSpinner, IonButtons, IonBackButton, IonIcon,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { personCircleOutline, cameraOutline, scanOutline, qrCodeOutline } from 'ionicons/icons';
import { BarcodeScanner, BarcodeFormat } from '@capacitor-mlkit/barcode-scanning';
import { SupabaseService } from '../../../core/services/supabase';
import { AuthService } from '../../../core/services/auth';
import { CamaraService } from '../../../core/services/camara.service';
import { NotificacionesService } from '../../../core/services/notificaciones';

@Component({
  selector: 'app-anonimo',
  templateUrl: './anonimo.page.html',
  styleUrls: ['./anonimo.page.scss'],
  imports: [
    FormsModule, IonHeader, IonToolbar, IonTitle, IonContent, IonItem, IonLabel, IonInput,
    IonButton, IonText, IonSpinner, IonButtons, IonBackButton, IonIcon,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AnonimoPage {
  private readonly supabase = inject(SupabaseService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly camaraService = inject(CamaraService);
  private readonly notificaciones = inject(NotificacionesService);

  nombre = signal('');
  foto = signal('');
  errorNombre = signal('');
  errorFoto = signal('');
  errorGeneral = signal('');
  errorQR = signal('');
  cargando = signal(false);
  qrEscaneado = signal(false);
  escaneando = signal(false);

  constructor() { addIcons({ personCircleOutline, cameraOutline, scanOutline, qrCodeOutline }); }

  async escanearQrEntrada() {
    this.errorQR.set('');
    this.escaneando.set(true);
    try {
      const { supported } = await BarcodeScanner.isSupported();
      if (!supported) { this.errorQR.set('Este dispositivo no soporta la lectura de códigos QR.'); return; }
      await BarcodeScanner.requestPermissions();
      const { barcodes } = await BarcodeScanner.scan({ formats: [BarcodeFormat.QrCode] });
      if (barcodes.length === 0) return;
      const valor = barcodes[0].rawValue ?? '';
      const { data } = await this.supabase.client.from('mesas').select('id').eq('tipo', 'entrada').single();
      if (!data || !valor.includes(data.id)) {
        this.errorQR.set('Este QR no es el de entrada al local. Escaneá el código QR de la puerta.');
        return;
      }
      this.qrEscaneado.set(true);
    } catch (error: unknown) {
      const e = error as any;
      if (e?.message === 'scan canceled.' || e?.errorMessage === 'scan canceled.') return;
      this.errorQR.set('Ocurrió un error al leer el QR. Intentá de nuevo.');
    } finally {
      this.escaneando.set(false);
    }
  }

  async tomarFoto() {
    try { this.foto.set(await this.camaraService.tomarFoto()); }
    catch { /* usuario canceló */ }
  }

  async ingresar() {
    this.errorNombre.set('');
    this.errorGeneral.set('');
    if (!this.nombre().trim()) { this.errorNombre.set('El nombre es obligatorio.'); return; }
    if (!this.foto()) { this.errorFoto.set('La foto es obligatoria.'); return; }
    try {
      this.cargando.set(true);
      const { error } = await this.supabase.client.from('lista_espera').insert({
        nombre: this.nombre().trim(), foto: this.foto() || null,
        tipo_cliente: 'anonimo', estado: 'esperando',
      });
      if (error) throw error;
      await this.notificaciones.enviar('Nueva solicitud de mesa', `${this.nombre().trim()} está esperando una mesa.`);
      this.authService.setUsuarioAnonimo({
        id: '', auth_id: '', nombre: this.nombre().trim(), apellido: '',
        dni: '', email: '', foto: this.foto() || null, perfil: 'anonimo', estado: 'aprobado',
      });
      this.router.navigate(['/cliente/anonimo-espera']);
    } catch (e: unknown) {
      this.errorGeneral.set((e as Error).message || 'Error al ingresar.');
    } finally {
      this.cargando.set(false);
    }
  }
}
