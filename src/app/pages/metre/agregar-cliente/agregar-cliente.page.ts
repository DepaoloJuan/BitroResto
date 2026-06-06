import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonItem, IonLabel, IonInput,
  IonButton, IonText, IonSpinner, IonButtons, IonBackButton,
} from '@ionic/angular/standalone';
import { SupabaseService } from '../../../core/services/supabase';
import { HapticsService } from '../../../core/services/haptics.service';

@Component({
  selector: 'app-agregar-cliente',
  templateUrl: './agregar-cliente.page.html',
  styleUrls: ['./agregar-cliente.page.scss'],
  imports: [
    FormsModule, IonHeader, IonToolbar, IonTitle, IonContent, IonItem,
    IonLabel, IonInput, IonButton, IonText, IonSpinner, IonButtons, IonBackButton,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AgregarClientePage {
  private readonly supabase = inject(SupabaseService);
  private readonly router = inject(Router);
  private readonly haptics = inject(HapticsService);

  form = { nombre: '', apellido: '', dni: '', email: '', password: '', confirmarPassword: '', foto: '' };
  errores = signal<Record<string, string>>({});
  errorGeneral = signal('');
  exitoso = signal(false);
  cargando = signal(false);

  validar(): boolean {
    const f = this.form;
    const errs: Record<string, string> = {};
    if (!f.nombre.trim()) errs['nombre'] = 'El nombre es obligatorio.';
    if (!f.apellido.trim()) errs['apellido'] = 'El apellido es obligatorio.';
    if (!f.dni.trim()) errs['dni'] = 'El DNI es obligatorio.';
    else if (!/^\d{7,8}$/.test(f.dni)) errs['dni'] = 'El DNI debe tener 7 u 8 dígitos numéricos.';
    if (!f.email.trim()) errs['email'] = 'El correo electrónico es obligatorio.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email)) errs['email'] = 'El formato del correo no es válido.';
    if (!f.password.trim()) errs['password'] = 'La contraseña es obligatoria.';
    else if (f.password.length < 6) errs['password'] = 'La contraseña debe tener al menos 6 caracteres.';
    if (!f.confirmarPassword.trim()) errs['confirmarPassword'] = 'Debe confirmar la contraseña.';
    else if (f.password !== f.confirmarPassword) errs['confirmarPassword'] = 'Las contraseñas no coinciden.';
    this.errores.set(errs);
    return Object.keys(errs).length === 0;
  }

  async registrar() {
    this.errorGeneral.set('');
    this.exitoso.set(false);
    if (!this.validar()) { await this.haptics.error(); return; }
    try {
      this.cargando.set(true);
      const f = this.form;
      const { data, error } = await this.supabase.client.auth.signUp({ email: f.email, password: f.password });
      if (error) throw error;
      const { error: errorInsert } = await this.supabase.client.from('usuarios').insert({
        auth_id: data.user?.id, nombre: f.nombre.trim(), apellido: f.apellido.trim(),
        dni: f.dni.trim(), email: f.email.trim(), perfil: 'cliente',
        foto: f.foto || null, estado: 'aprobado',
      });
      if (errorInsert) throw errorInsert;
      this.exitoso.set(true);
      setTimeout(() => this.router.navigate(['/metre']), 1500);
    } catch (e: unknown) {
      this.errorGeneral.set((e as Error).message || 'Ocurrió un error al registrar el cliente.');
      await this.haptics.error();
    } finally {
      this.cargando.set(false);
    }
  }
}
