/* import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonItem, IonLabel, IonInput,
  IonButton, IonText, IonButtons, IonBackButton, IonIcon,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  personCircleOutline, cameraOutline, scanOutline,
  starOutline, restaurantOutline, flameOutline, wineOutline, eyeOutline,
} from 'ionicons/icons';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { BarcodeScanner, BarcodeFormat } from '@capacitor-mlkit/barcode-scanning';
import { SupabaseService } from '../../../core/services/supabase';
import { AuthService } from '../../../core/services/auth';
import { HapticsService } from '../../../core/services/haptics.service';
import { FormEmpleado } from '../../../core/models';
import { LoadingComponent } from '../../../shared/components/loading/loading.component';

@Component({
  selector: 'app-agregar-empleado',
  templateUrl: './agregar-empleado.page.html',
  styleUrls: ['./agregar-empleado.page.scss'],
  imports: [
    FormsModule, IonHeader, IonToolbar, IonTitle, IonContent, IonItem, IonLabel,
    IonInput, IonButton, IonText,
    IonButtons, IonBackButton, IonIcon, LoadingComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AgregarEmpleadoPage {
  private readonly supabase = inject(SupabaseService);
  private readonly authService = inject(AuthService);
  private readonly haptics = inject(HapticsService);
  private readonly router = inject(Router);

  private formVacio: FormEmpleado = {
    nombre: '', apellido: '', dni: '', cuil: '', email: '',
    password: '', confirmarPassword: '', foto: '', perfil: '',
  };

  form: FormEmpleado = { ...this.formVacio };
  errores = signal<Record<string, string>>({});
  errorGeneral = signal('');
  errorEscaneo = signal('');
  exitoso = signal(false);
  cargando = signal(false);
  backHref = '/dueno';

  constructor() {
    addIcons({ personCircleOutline, cameraOutline, scanOutline, starOutline, restaurantOutline, flameOutline, wineOutline, eyeOutline });
    const usuario = this.authService.getUsuarioActual();
    if (usuario?.perfil === 'supervisor') this.backHref = '/supervisor';
  }

  async tomarFoto() {
    try {
      const foto = await Camera.getPhoto({
        quality: 90, allowEditing: false,
        resultType: CameraResultType.DataUrl, source: CameraSource.Camera,
      });
      this.form.foto = foto.dataUrl ?? '';
    } catch {}
  }

  async escanearDni() {
    this.errorEscaneo.set('');
    try {
      const { supported } = await BarcodeScanner.isSupported();
      if (!supported) { this.errorEscaneo.set('El escáner no está soportado en este dispositivo.'); return; }
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

  async validar(): Promise<boolean> {
    const f = this.form;
    const errs: Record<string, string> = {};
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
    if (!f.perfil) errs['perfil'] = 'Debe seleccionar un perfil.';
    if (!f.foto) errs['foto'] = 'La foto es obligatoria.';
    this.errores.set(errs);
    if (Object.keys(errs).length > 0) { await this.haptics.error(); return false; }
    return true;
  }

  async guardar() {
    this.errorGeneral.set('');
    this.exitoso.set(false);
    if (!await this.validar()) return;
    try {
      this.cargando.set(true);
      const f = this.form;
      const { data, error } = await this.supabase.client.auth.signUp({ email: f.email, password: f.password });
      if (error) throw error;
      const { error: errorInsert } = await this.supabase.client.from('usuarios').insert({
        auth_id: data.user?.id, nombre: f.nombre, apellido: f.apellido,
        dni: f.dni, cuil: f.cuil, email: f.email, perfil: f.perfil,
        foto: f.foto || null, estado: 'aprobado',
      });
      if (errorInsert) throw errorInsert;
      this.exitoso.set(true);
      this.form = { ...this.formVacio };
      setTimeout(() => this.router.navigate([this.backHref], { replaceUrl: true }), 1500);
    } catch (e: unknown) {
      await this.haptics.error();
      this.errorGeneral.set((e as Error).message || 'Ocurrió un error al guardar el empleado.');
    } finally {
      this.cargando.set(false);
    }
  }
}
 */

import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonItem, IonLabel, IonInput,
  IonButton, IonText, IonButtons, IonBackButton, IonIcon,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  personCircleOutline, cameraOutline, scanOutline,
  starOutline, restaurantOutline, flameOutline, wineOutline, eyeOutline,
} from 'ionicons/icons';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { BarcodeScanner, BarcodeFormat } from '@capacitor-mlkit/barcode-scanning';
import { SupabaseService } from '../../../core/services/supabase';
import { AuthService } from '../../../core/services/auth';
import { HapticsService } from '../../../core/services/haptics.service';
import { FormEmpleado } from '../../../core/models';
import { LoadingComponent } from '../../../shared/components/loading/loading.component';

@Component({
  selector: 'app-agregar-empleado',
  templateUrl: './agregar-empleado.page.html',
  styleUrls: ['./agregar-empleado.page.scss'],
  imports: [
    FormsModule, IonHeader, IonToolbar, IonTitle, IonContent, IonItem, IonLabel,
    IonInput, IonButton, IonText,
    IonButtons, IonBackButton, IonIcon, LoadingComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AgregarEmpleadoPage {
  private readonly supabase = inject(SupabaseService);
  private readonly authService = inject(AuthService);
  private readonly haptics = inject(HapticsService);
  private readonly router = inject(Router);
  private readonly cdr = inject(ChangeDetectorRef);

  private formVacio: FormEmpleado = {
    nombre: '', apellido: '', dni: '', cuil: '', email: '',
    password: '', confirmarPassword: '', foto: '', perfil: '',
  };

  form: FormEmpleado = { ...this.formVacio };
  errores = signal<Record<string, string>>({});
  errorGeneral = signal('');
  errorEscaneo = signal('');
  exitoso = signal(false);
  cargando = signal(false);
  backHref = '/dueno';

  constructor() {
    addIcons({ personCircleOutline, cameraOutline, scanOutline, starOutline, restaurantOutline, flameOutline, wineOutline, eyeOutline });
    const usuario = this.authService.getUsuarioActual();
    if (usuario?.perfil === 'supervisor') this.backHref = '/supervisor';
  }

  async tomarFoto() {
    try {
      const foto = await Camera.getPhoto({
        quality: 90, allowEditing: false,
        resultType: CameraResultType.DataUrl, source: CameraSource.Camera,
      });
      this.form = { ...this.form, foto: foto.dataUrl ?? '' };
      this.cdr.markForCheck();
    } catch {}
  }

  async escanearDni() {
    this.errorEscaneo.set('');
    try {
      const { supported } = await BarcodeScanner.isSupported();
      if (!supported) { this.errorEscaneo.set('El escáner no está soportado en este dispositivo.'); return; }
      const { camera } = await BarcodeScanner.requestPermissions();
      if (camera !== 'granted' && camera !== 'limited') {
        this.errorEscaneo.set('Se necesitan permisos de cámara para escanear el DNI.');
        return;
      }
      await BarcodeScanner.stopScan().catch(() => {});
      const { barcodes } = await BarcodeScanner.scan({ formats: [BarcodeFormat.Pdf417] });
      if (barcodes.length === 0) return;
      const raw = barcodes[0].rawValue ?? '';
      const partes = raw.split('@');
      if (raw && partes.length >= 5) {
        this.form = { ...this.form, apellido: partes[1]?.trim() ?? '', nombre: partes[2]?.trim() ?? '', dni: partes[4]?.trim() ?? '' };
        this.cdr.markForCheck();
      } else {
        this.errorEscaneo.set('No se pudo leer el DNI. Asegurate de enfocar el código del dorso.');
      }
    } catch (error: unknown) {
      const e = error as any;
      if (e?.message === 'scan canceled.' || e?.errorMessage === 'scan canceled.') return;
      if (e?.isAcquireTimeout) { this.errorEscaneo.set('Tiempo de espera agotado. Intentá de nuevo.'); }
      else { this.errorEscaneo.set('Ocurrió un error al leer el DNI. Intentá de nuevo.'); }
    } finally {
      await BarcodeScanner.stopScan().catch(() => {});
    }
  }

  async validar(): Promise<boolean> {
    const f = this.form;
    const errs: Record<string, string> = {};
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
    if (!f.perfil) errs['perfil'] = 'Debe seleccionar un perfil.';
    if (!f.foto) errs['foto'] = 'La foto es obligatoria.';
    this.errores.set(errs);
    if (Object.keys(errs).length > 0) { await this.haptics.error(); return false; }
    return true;
  }

  async guardar() {
    this.errorGeneral.set('');
    this.exitoso.set(false);
    if (!await this.validar()) return;
    try {
      this.cargando.set(true);
      this.cdr.markForCheck();
      const f = this.form;
      const { data, error } = await this.supabase.client.auth.signUp({ email: f.email, password: f.password });
      if (error) throw error;
      const { error: errorInsert } = await this.supabase.client.from('usuarios').insert({
        auth_id: data.user?.id, nombre: f.nombre, apellido: f.apellido,
        dni: f.dni, cuil: f.cuil, email: f.email, perfil: f.perfil,
        foto: f.foto || null, estado: 'aprobado',
      });
      if (errorInsert) throw errorInsert;
      this.exitoso.set(true);
      this.form = { ...this.formVacio };
      setTimeout(() => this.router.navigate([this.backHref], { replaceUrl: true }), 1500);
    } catch (e: unknown) {
      await this.haptics.error();
      this.errorGeneral.set((e as Error).message || 'Ocurrió un error al guardar el empleado.');
    } finally {
      this.cargando.set(false);
      this.cdr.markForCheck();
    }
  }
}