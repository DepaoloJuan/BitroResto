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
import { Router } from '@angular/router';
import { SupabaseService } from '../../../core/services/supabase';
import { AuthService } from '../../../core/services/auth';
import { cameraOutline, personCircleOutline } from 'ionicons/icons';
import { BarcodeScanner, BarcodeFormat } from '@capacitor-mlkit/barcode-scanning';
import { addIcons } from 'ionicons';
import { CamaraService } from 'src/app/core/services/camara.service';
import { HapticsService } from '../../../core/services/haptics.service';
import { NotificacionesService } from '../../../core/services/notificaciones';


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
    cuil: '',
    email: '',
    password: '',
    confirmarPassword: '',
    foto: '',
  };

  errores: any = {};
  errorGeneral = '';
  errorEscaneo = '';
  esperandoAprobacion = false;
  estadoRegistro: 'pendiente' | 'aprobado' | 'rechazado' = 'pendiente';
  usuarioRegistradoId = '';
  cargando = false;

  constructor(
    private supabase: SupabaseService,
    private camaraService: CamaraService,
    private router: Router,
    private authService: AuthService,
    private haptics: HapticsService,
    private notificaciones: NotificacionesService,
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
    this.errorEscaneo = '';
    try {
      const { supported } = await BarcodeScanner.isSupported();
      if (!supported) {
        this.errorEscaneo = 'Este dispositivo no soporta la lectura de códigos QR.';
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


  escucharEstado(usuarioId: string) {
    this.supabase.client
      .channel('estado_registro_' + usuarioId)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'usuarios',
        filter: `id=eq.${usuarioId}`,
      }, async (payload: any) => {
        const nuevoEstado = payload.new.estado;

        if (nuevoEstado === 'aprobado') {
          this.estadoRegistro = 'aprobado';
          try {
            const usuario = await this.authService.login(
              this.form.email,
              this.form.password,
            );
            this.authService.redirigirSegunPerfil(usuario.perfil);
          } catch (e) {
            this.router.navigate(['/login']);
          }
        } else if (nuevoEstado === 'rechazado') {
          this.estadoRegistro = 'rechazado';
          this.esperandoAprobacion = false;
          setTimeout(() => {
            this.router.navigate(['/login']);
          }, 3000);
        }
      })
      .subscribe();
  }

  async validar(): Promise<boolean> {
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

    if (!this.form.cuil.trim())
      this.errores.cuil = 'El CUIL es obligatorio.';
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

    if (Object.keys(this.errores).length > 0) {
      await this.haptics.error();
      return false;
    }
    return true;
  }

  async registrar() {
    this.errorGeneral = '';

    if (!await this.validar()) return;

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
          cuil: this.form.cuil.trim(),
          email: this.form.email.trim(),
          perfil: 'cliente',
          foto: this.form.foto || null,
          estado: 'pendiente',
        });

      if (errorInsert) throw errorInsert;

      await this.notificaciones.enviar('Nuevo cliente pendiente', 'Hay un cliente esperando aprobación.');

      this.esperandoAprobacion = true;
      this.usuarioRegistradoId = data.user?.id ?? '';
      const { data: usuarioTabla } = await this.supabase.client
        .from('usuarios')
        .select('id')
        .eq('auth_id', data.user?.id)
        .single();

      if (usuarioTabla) {
        this.escucharEstado(usuarioTabla.id);
      }
    } catch (error: any) {
      await this.haptics.error();
      this.errorGeneral = error.message || 'Ocurrió un error al registrarse.';
    } finally {
      this.cargando = false;
    }
  }
}
