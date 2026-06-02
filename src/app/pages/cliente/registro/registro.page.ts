import { Component } from '@angular/core';
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
  IonIcon
} from '@ionic/angular/standalone';
import { SupabaseService } from '../../../core/services/supabase';
import { cameraOutline, personCircleOutline } from 'ionicons/icons';
import { BarcodeScanner, BarcodeFormat } from '@capacitor-mlkit/barcode-scanning';
import { addIcons } from 'ionicons';
import { CamaraService } from 'src/app/core/services/camara.service';


@Component({
  selector: 'app-registro',
  templateUrl: './registro.page.html',
  styleUrls: ['./registro.page.scss'],
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
    IonIcon
  ],
})
export class RegistroPage {
  form = {
    nombre: '',
    apellido: '',
    dni: '',
    email: '',
    password: '',
    confirmarPassword: '',
    foto: '',
  };

  errores: any = {};
  errorGeneral = '';
  exitoso = false;
  cargando = false;


  constructor(
    private supabase: SupabaseService,
    private camaraService: CamaraService,
  ) {
    addIcons({ personCircleOutline, cameraOutline });
  }

  async tomarFoto() {
    try {
      this.form.foto = await this.camaraService.tomarFoto();
    } catch (error) {
      console.error('Error al tomar foto:', error);
    }
  }

  async escanearDni() {
    try {
      const { supported } = await BarcodeScanner.isSupported();
      if (!supported) {
        console.warn('El escáner no está soportado en este dispositivo.');
        return;
      }

      await BarcodeScanner.requestPermissions();

      const { barcodes } = await BarcodeScanner.scan({
        formats: [BarcodeFormat.Pdf417],
      });

      if (barcodes.length === 0) return;

      const raw = barcodes[0].rawValue ?? '';
      const partes = raw.split('@');

      if (raw && partes.length >= 5) {
        this.form.apellido = partes[1]?.trim() ?? '';
        this.form.nombre   = partes[2]?.trim() ?? '';
        this.form.dni      = partes[4]?.trim() ?? '';
      }
    } catch (error: any) {
      if (error?.isAcquireTimeout) {
        console.warn('Tiempo de espera agotado. Intentá de nuevo.');
      } else if (error?.message === 'scan canceled.' || error?.errorMessage === 'scan canceled.') {
        // usuario canceló, no es un error
      } else {
        console.error('Error al escanear DNI:', error);
      }
    }
  }


  validar(): boolean {
    this.errores = {};

    if (!this.form.foto)
      this.errores.foto = 'La foto es obligatoria.';

    if (!this.form.nombre.trim())
      this.errores.nombre = 'El nombre es obligatorio.';

    if (!this.form.apellido.trim())
      this.errores.apellido = 'El apellido es obligatorio.';

    if (!this.form.dni.trim()) this.errores.dni = 'El DNI es obligatorio.';
    else if (!/^\d{7,8}$/.test(this.form.dni))
      this.errores.dni = 'El DNI debe tener 7 u 8 dígitos numéricos.';

    if (!this.form.email.trim())
      this.errores.email = 'El correo electrónico es obligatorio.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.form.email))
      this.errores.email = 'El formato del correo no es válido.';

    if (!this.form.password.trim())
      this.errores.password = 'La contraseña es obligatoria.';
    else if (this.form.password.length < 6)
      this.errores.password = 'La contraseña debe tener al menos 6 caracteres.';

    if (!this.form.confirmarPassword.trim())
      this.errores.confirmarPassword = 'Debe confirmar la contraseña.';
    else if (this.form.password !== this.form.confirmarPassword)
      this.errores.confirmarPassword = 'Las contraseñas no coinciden.';

    return Object.keys(this.errores).length === 0;
  }

  async registrar() {
    this.errorGeneral = '';
    this.exitoso = false;

    if (!this.validar()) return;

    try {
      this.cargando = true;

      // Crear usuario en Supabase Auth
      const { data, error } = await this.supabase.client.auth.signUp({
        email: this.form.email,
        password: this.form.password,
      });

      if (error) throw error;

      // Insertar en tabla usuarios con estado pendiente
      const { error: errorInsert } = await this.supabase.client
        .from('usuarios')
        .insert({
          auth_id: data.user?.id,
          nombre: this.form.nombre.trim(),
          apellido: this.form.apellido.trim(),
          dni: this.form.dni.trim(),
          email: this.form.email.trim(),
          perfil: 'cliente',
          foto: this.form.foto || null,
          estado: 'pendiente',
        });

      if (errorInsert) throw errorInsert;

      this.exitoso = true;
    } catch (error: any) {
      this.errorGeneral = error.message || 'Ocurrió un error al registrarse.';
    } finally {
      this.cargando = false;
    }
  }
}
