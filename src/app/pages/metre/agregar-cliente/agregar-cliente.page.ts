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
} from '@ionic/angular/standalone';
import { SupabaseService } from '../../../core/services/supabase';

@Component({
  selector: 'app-agregar-cliente',
  templateUrl: './agregar-cliente.page.html',
  styleUrls: ['./agregar-cliente.page.scss'],
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
  ],
})
export class AgregarClientePage {
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
    private router: Router,
  ) {}

  validar(): boolean {
    this.errores = {};

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

      const { data, error } = await this.supabase.client.auth.signUp({
        email: this.form.email,
        password: this.form.password,
      });

      if (error) throw error;

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
          estado: 'aprobado',
        });

      if (errorInsert) throw errorInsert;

      this.exitoso = true;
      setTimeout(() => this.router.navigate(['/metre']), 1500);
    } catch (error: any) {
      this.errorGeneral = error.message || 'Ocurrió un error al registrar el cliente.';
    } finally {
      this.cargando = false;
    }
  }
}
