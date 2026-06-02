import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
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
  IonSelect,
  IonSelectOption,
  IonSpinner,
  IonButtons,
  IonBackButton,
  IonIcon,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { personCircleOutline, cameraOutline, scanOutline } from 'ionicons/icons';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { BarcodeScanner, BarcodeFormat } from '@capacitor-mlkit/barcode-scanning';
import { SupabaseService } from '../../../core/services/supabase';
import { AuthService } from '../../../core/services/auth';
import { HapticsService } from '../../../core/services/haptics.service';

@Component({
  selector: 'app-agregar-empleado',
  templateUrl: './agregar-empleado.page.html',
  styleUrls: ['./agregar-empleado.page.scss'],
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
    IonSelect,
    IonSelectOption,
    IonSpinner,
    IonButtons,
    IonBackButton,
    IonIcon
  ],
})
export class AgregarEmpleadoPage {
  form = {
    nombre: '',
    apellido: '',
    dni: '',
    cuil: '',
    email: '',
    password: '',
    confirmarPassword: '',
    perfil: '',
    foto: '',
  };

  errores: any = {};
  errorGeneral = '';
  errorEscaneo = '';
  exitoso = false;
  cargando = false;
  backHref = '/dueno';

  constructor(
    private supabase: SupabaseService,
    private authService: AuthService,
    private haptics: HapticsService,
  ) {
    addIcons({ personCircleOutline, cameraOutline, scanOutline });

    const usuario = this.authService.getUsuarioActual();
    if (usuario?.perfil === 'supervisor') {
      this.backHref = '/supervisor';
    }
  }

   async tomarFoto() {
    try {
      const foto = await Camera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Camera,
      });
      this.form.foto = foto.dataUrl ?? '';
    } catch (error) {
    }
  }

   async escanearDni() {
      this.errorEscaneo = '';
      try {
        const { supported } = await BarcodeScanner.isSupported();
        if (!supported) {
          this.errorEscaneo = 'El escáner no está soportado en este dispositivo.';
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
        } else {
          this.errorEscaneo = 'No se pudo leer el DNI. Asegurate de enfocar el código del dorso.';
        }
       } catch (error: any) {
        if (error?.message === 'scan canceled.' || error?.errorMessage === 'scan canceled.') {
          // el usuario canceló, no mostrar nada
        } else if (error?.isAcquireTimeout) {
          this.errorEscaneo = 'Tiempo de espera agotado. Intentá de nuevo.';
        } else {
          this.errorEscaneo = 'Ocurrió un error al leer el DNI. Intentá de nuevo.';
        }
      }
    }

  async validar(): Promise<boolean> {
    this.errores = {};

    if (!this.form.nombre.trim())
      this.errores.nombre = 'El nombre es obligatorio.';

    if (!this.form.apellido.trim())
      this.errores.apellido = 'El apellido es obligatorio.';

    if (!this.form.dni.trim()) this.errores.dni = 'El DNI es obligatorio.';
    else if (!/^\d{7,8}$/.test(this.form.dni))
      this.errores.dni = 'El DNI debe tener 7 u 8 dígitos numéricos.';

    if (!this.form.cuil.trim()) this.errores.cuil = 'El CUIL es obligatorio.';
    else if (!/^\d{11}$/.test(this.form.cuil))
      this.errores.cuil = 'El CUIL debe tener 11 dígitos numéricos.';

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

    if (!this.form.perfil) this.errores.perfil = 'Debe seleccionar un perfil.';

    if (!this.form.foto) this.errores.foto = 'La foto es obligatoria.';


    if (Object.keys(this.errores).length > 0) {
      await this.haptics.error();
      return false;
    }
    return true;
  }

  async guardar() {
    this.errorGeneral = '';
    this.exitoso = false;

    if (!await this.validar()) return;

    try {
      this.cargando = true;
      

      // 1 - Crear usuario en Supabase Auth
      const { data, error } = await this.supabase.client.auth.signUp({
        email: this.form.email,
        password: this.form.password,
      });

      if (error) throw error;

      // 2 - Insertar en tabla usuarios
      const { error: errorInsert } = await this.supabase.client
        .from('usuarios')
        .insert({
          auth_id: data.user?.id,
          nombre: this.form.nombre,
          apellido: this.form.apellido,
          dni: this.form.dni,
          cuil: this.form.cuil,
          email: this.form.email,
          perfil: this.form.perfil,
          foto: this.form.foto || null,
          estado: 'aprobado',
        });

      if (errorInsert) throw errorInsert;

      this.exitoso = true;
      this.form = {
        nombre: '',
        apellido: '',
        dni: '',
        cuil: '',
        email: '',
        password: '',
        confirmarPassword: '',
        perfil: '',
        foto: '',
      };
    } catch (error: any) {
      await this.haptics.error();
      this.errorGeneral =
        error.message || 'Ocurrió un error al guardar el empleado.';
    } finally {
      this.cargando = false;
    }
  }
}