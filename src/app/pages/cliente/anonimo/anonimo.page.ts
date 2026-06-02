import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonItem,
  IonLabel,
  IonInput,
  IonButton,
  IonText,
  IonSpinner,
  IonButtons,
  IonBackButton,
  IonIcon,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { personCircleOutline, cameraOutline, scanOutline, qrCodeOutline } from 'ionicons/icons';
import { BarcodeScanner, BarcodeFormat } from '@capacitor-mlkit/barcode-scanning';
import { SupabaseService } from '../../../core/services/supabase';
import { AuthService } from '../../../core/services/auth';
import { CamaraService } from 'src/app/core/services/camara.service';
import { NotificacionesService } from '../../../core/services/notificaciones';

@Component({
  selector: 'app-anonimo',
  templateUrl: './anonimo.page.html',
  styleUrls: ['./anonimo.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonItem,
    IonLabel,
    IonInput,
    IonButton,
    IonText,
    IonSpinner,
    IonButtons,
    IonBackButton,
    IonIcon,
  ],
})
export class AnonimoPage {
  nombre = '';
  foto = '';
  errorNombre = '';
  errorFoto = '';
  errorGeneral = '';
  errorQR = '';
  cargando = false;
  qrEscaneado = false;
  escaneando = false;

  constructor(
    private supabase: SupabaseService,
    private authService: AuthService,
    private router: Router,
    private camaraService: CamaraService,
    private notificaciones: NotificacionesService,
  ) {
    addIcons({ personCircleOutline, cameraOutline, scanOutline, qrCodeOutline });
  }

  async escanearQrEntrada() {
    this.errorQR = '';
    this.escaneando = true;
    try {
      const { supported } = await BarcodeScanner.isSupported();
      if (!supported) {
        this.errorQR = 'Este dispositivo no soporta la lectura de códigos QR.';
        return;
      }

      await BarcodeScanner.requestPermissions();

      const { barcodes } = await BarcodeScanner.scan({
        formats: [BarcodeFormat.QrCode],
      });

      if (barcodes.length === 0) return;

      const valor = barcodes[0].rawValue ?? '';

      const { data } = await this.supabase.client
        .from('mesas')
        .select('id')
        .eq('tipo', 'entrada')
        .single();

      if (!data || !valor.includes(data.id)) {
        this.errorQR = 'Este QR no es el de entrada al local. Escaneá el código QR de la puerta.';
        return;
      }

      this.qrEscaneado = true;

    } catch (error: any) {
      if (error?.message === 'scan canceled.' || error?.errorMessage === 'scan canceled.') {
        // el usuario canceló
      } else {
        this.errorQR = 'Ocurrió un error al leer el QR. Intentá de nuevo.';
      }
    } finally {
      this.escaneando = false;
    }
  }

  async tomarFoto() {
    try {
      this.foto = await this.camaraService.tomarFoto();
    } catch (error) {
      console.error('Error al tomar foto:', error);
    }
  }

  async ingresar() {
    this.errorNombre = '';
    this.errorGeneral = '';

    if (!this.nombre.trim()) {
      this.errorNombre = 'El nombre es obligatorio.';
      return;
    }

    if (!this.foto) {
      this.errorFoto = 'La foto es obligatoria.';
      return;
    }

    try {
      this.cargando = true;

      // Insertar en lista de espera directamente
      const { error } = await this.supabase.client.from('lista_espera').insert({
        nombre: this.nombre.trim(),
        foto: this.foto || null,
        tipo_cliente: 'anonimo',
        estado: 'esperando',
      });

      if (error) throw error;

      await this.notificaciones.enviar('Nueva solicitud de mesa', `${this.nombre.trim()} está esperando una mesa.`);

      // Guardar datos del anónimo en el authService para usarlos en la sesión
      this.authService.setUsuarioAnonimo({
        nombre: this.nombre.trim(),
        foto: this.foto || null,
        perfil: 'anonimo',
      });

      this.router.navigate(['/cliente/anonimo-espera']);
    } catch (error: any) {
      this.errorGeneral = error.message || 'Error al ingresar.';
    } finally {
      this.cargando = false;
    }
  }
}
