import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonItem, IonLabel, IonInput, IonButton,
  IonText, IonSpinner, IonButtons, IonBackButton, IonIcon,
} from '@ionic/angular/standalone';
import { Router } from '@angular/router';
import { SupabaseService } from '../../../core/services/supabase';
import { AuthService } from '../../../core/services/auth';
import { cameraOutline, personCircleOutline } from 'ionicons/icons';
import { BarcodeScanner, BarcodeFormat } from '@capacitor-mlkit/barcode-scanning';
import { addIcons } from 'ionicons';
import { CamaraService } from '../../../core/services/camara.service';
import { HapticsService } from '../../../core/services/haptics.service';
/* import { NotificacionesService } from '../../../core/services/notificaciones'; */
import { FormRegistro } from '../../../core/models';
import { RealtimeChannel } from '@supabase/supabase-js';

type EstadoRegistro = 'pendiente' | 'aprobado' | 'rechazado';

@Component({
  selector: 'app-registro',
  templateUrl: './registro.page.html',
  styleUrls: ['./registro.page.scss'],
  imports: [
    FormsModule, IonHeader, IonToolbar, IonTitle, IonContent, IonItem, IonLabel, IonInput,
    IonButton, IonText, IonSpinner, IonButtons, IonBackButton, IonIcon,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RegistroPage {
  private readonly supabase = inject(SupabaseService);
  private readonly camaraService = inject(CamaraService);
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  private readonly haptics = inject(HapticsService);
/*   private readonly notificaciones = inject(NotificacionesService); */
  private readonly destroyRef = inject(DestroyRef);

  private readonly formVacio: FormRegistro = {
    nombre: '', apellido: '', dni: '', cuil: '', email: '', password: '', confirmarPassword: '', foto: '',
  };

  form: FormRegistro = { ...this.formVacio };
  errores = signal<Record<string, string>>({});
  errorGeneral = signal('');
  errorEscaneo = signal('');
  esperandoAprobacion = signal(false);
  estadoRegistro = signal<EstadoRegistro>('pendiente');
  cargando = signal(false);

  private canal?: RealtimeChannel;

  constructor() {
    addIcons({ personCircleOutline, cameraOutline });
    this.destroyRef.onDestroy(() => {
      if (this.canal) this.supabase.client.removeChannel(this.canal);
    });
  }

  async tomarFoto() {
    try {
      this.form.foto = '';
      const foto = await this.camaraService.tomarFoto();
      this.form.foto = foto;
    } catch { /* usuario canceló */ }
  }

  async escanearDni() {
    this.errorEscaneo.set('');
    try {
      const { supported } = await BarcodeScanner.isSupported();
      if (!supported) { this.errorEscaneo.set('Este dispositivo no soporta la lectura de códigos QR.'); return; }
      await BarcodeScanner.requestPermissions();
      const { barcodes } = await BarcodeScanner.scan({ formats: [BarcodeFormat.Pdf417] });
      if (barcodes.length === 0) return;
      const raw = barcodes[0].rawValue ?? '';
      const partes = raw.split('@');
      if (raw && partes.length >= 5) {
        this.form.apellido = partes[1]?.trim() ?? '';
        this.form.nombre = partes[2]?.trim() ?? '';
        this.form.dni = partes[4]?.trim() ?? '';
      } else {
        this.errorEscaneo.set('No se pudo leer el DNI. Asegurate de enfocar el código del dorso.');
      }
    } catch (error: unknown) {
      const e = error as any;
      if (e?.message === 'scan canceled.' || e?.errorMessage === 'scan canceled.') return;
      if (e?.isAcquireTimeout) { this.errorEscaneo.set('Tiempo de espera agotado. Intentá de nuevo.'); }
      else { this.errorEscaneo.set('Ocurrió un error al leer el DNI. Intentá de nuevo.'); }
    }
  }

  escucharEstado(usuarioId: string) {
    this.canal = this.supabase.client
      .channel('estado_registro_' + usuarioId)
      .on('postgres_changes', {
        event: 'UPDATE', schema: 'public', table: 'usuarios', filter: `id=eq.${usuarioId}`,
      }, async (payload: any) => {
        const nuevoEstado = payload.new.estado;
        if (nuevoEstado === 'aprobado') {
          this.estadoRegistro.set('aprobado');
          try {
            const f = this.form;
            const usuario = await this.authService.login(f.email, f.password);
            this.authService.redirigirSegunPerfil(usuario.perfil);
          } catch { this.router.navigate(['/login']); }
        } else if (nuevoEstado === 'rechazado') {
          this.estadoRegistro.set('rechazado');
          this.esperandoAprobacion.set(false);
          setTimeout(() => this.router.navigate(['/login']), 3000);
        }
      })
      .subscribe();
  }

  async validar(): Promise<boolean> {
    const f = this.form;
    const errs: Record<string, string> = {};
    if (!f.foto) errs['foto'] = 'La foto es obligatoria.';
    if (!f.nombre.trim()) errs['nombre'] = 'El nombre es obligatorio.';
    if (!f.apellido.trim()) errs['apellido'] = 'El apellido es obligatorio.';
    if (!f.dni.trim()) errs['dni'] = 'El DNI es obligatorio.';
    else if (!/^\d{7,8}$/.test(f.dni)) errs['dni'] = 'El DNI debe tener 7 u 8 dígitos numéricos.';
    if (!f.cuil.trim()) errs['cuil'] = 'El CUIL es obligatorio.';
    else if (!/^\d{11}$/.test(f.cuil)) errs['cuil'] = 'El CUIL debe tener 11 dígitos numéricos.';
    if (!f.email.trim()) errs['email'] = 'El correo electrónico es obligatorio.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email)) errs['email'] = 'El formato del correo no es válido.';
    if (!f.password.trim()) errs['password'] = 'La contraseña es obligatoria.';
    else if (f.password.length < 6) errs['password'] = 'La contraseña debe tener al menos 6 caracteres.';
    if (!f.confirmarPassword.trim()) errs['confirmarPassword'] = 'Debe confirmar la contraseña.';
    else if (f.password !== f.confirmarPassword) errs['confirmarPassword'] = 'Las contraseñas no coinciden.';
    this.errores.set(errs);
    if (Object.keys(errs).length > 0) { await this.haptics.error(); return false; }
    return true;
  }

  async registrar() {
    this.errorGeneral.set('');
    if (!await this.validar()) return;
    const f = this.form;
    try {
      this.cargando.set(true);
      const { data, error } = await this.supabase.client.auth.signUp({ email: f.email, password: f.password });
      if (error) throw error;
      const { error: errorInsert } = await this.supabase.client.from('usuarios').insert({
        auth_id: data.user?.id, nombre: f.nombre.trim(), apellido: f.apellido.trim(),
        dni: f.dni.trim(), cuil: f.cuil.trim(), email: f.email.trim(),
        perfil: 'cliente', foto: f.foto || null, estado: 'pendiente',
      });
      if (errorInsert) throw errorInsert;
/*       await this.notificaciones.enviar('Nuevo cliente pendiente', 'Hay un cliente esperando aprobación.'); */
      this.esperandoAprobacion.set(true);
      const { data: usuarioTabla } = await this.supabase.client
        .from('usuarios').select('id').eq('auth_id', data.user?.id).single();
      if (usuarioTabla) this.escucharEstado(usuarioTabla.id);
    } catch (e: unknown) {
      await this.haptics.error();
      this.errorGeneral.set((e as Error).message || 'Ocurrió un error al registrarse.');
    } finally {
      this.cargando.set(false);
    }
  }
}
