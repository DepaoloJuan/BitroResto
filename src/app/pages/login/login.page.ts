import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import {
  IonContent,
  IonItem,
  IonLabel,
  IonInput,
  IonButton,
  IonIcon
} from '@ionic/angular/standalone';
import { personCircleOutline } from 'ionicons/icons'; 
import { AuthService } from '../../core/services/auth';
import { SupabaseService } from '../../core/services/supabase';
import { HapticsService } from '../../core/services/haptics.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonContent,
    IonItem,
    IonLabel,
    IonIcon,
    IonInput,
    IonButton,
    RouterLink,
  ],
})
export class LoginPage {
  email = '';
  password = '';
  errores: any = {};
  errorGeneral = '';
  cargando = false;

  // Usuarios de ingreso rápido — reemplazá con los emails/passwords reales de tu Supabase
  private usuariosRapidos: Record<string, { email: string; password: string }> =
    {
      dueño:      { email: 'dueno@resto.com',      password: '123456' },
      supervisor: { email: 'supervisor@resto.com', password: '123456' },
      metre:      { email: 'metre@resto.com',       password: '123456' },
      mozo:       { email: 'mozo@resto.com',        password: '123456' },
      cocinero:   { email: 'cocinero@resto.com',    password: '123456' },
      cantinero:  { email: 'bartender@resto.com',   password: '123456' },
      cliente:    { email: 'cliente@resto.com',     password: '123456' },
    };

  constructor(
    private authService: AuthService,
    private router: Router,
    private haptics: HapticsService,
  ) {}

  async validar(): Promise<boolean> {
    this.errores = {};
    if (!this.email) {
      this.errores.email = 'El correo electrónico es obligatorio.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.email)) {
      this.errores.email = 'El formato del correo no es válido.';
    }
    if (!this.password) {
      this.errores.password = 'La contraseña es obligatoria.';
    } else if (this.password.length < 6) {
      this.errores.password = 'La contraseña debe tener al menos 6 caracteres.';
    }
    if (Object.keys(this.errores).length > 0) {
      await this.haptics.error();
      return false;
    }
    return true;
  }

  async login() {
    this.errorGeneral = '';
    if (!await this.validar()) return;

    try {
      this.cargando = true;
      const usuario = await this.authService.login(this.email, this.password);
      this.authService.redirigirSegunPerfil(usuario.perfil);
    } catch (error: any) {
      await this.haptics.error();
      this.errorGeneral =
        error.message || 'Error al iniciar sesión. Verificá tus credenciales.';
    } finally {
      this.cargando = false;
    }
  }

  async loginRapido(perfil: string) {
    const credenciales = this.usuariosRapidos[perfil];
    if (!credenciales) return;
    this.email = credenciales.email;
    this.password = credenciales.password;
    await this.login();
  }
}
