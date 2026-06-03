import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import {
  IonContent, IonItem, IonLabel, IonInput, IonButton, IonIcon,
} from '@ionic/angular/standalone';
import { personCircleOutline } from 'ionicons/icons';
import { addIcons } from 'ionicons';
import { AuthService } from '../../core/services/auth';
import { HapticsService } from '../../core/services/haptics.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  imports: [
    FormsModule,
    IonContent, IonItem, IonLabel, IonInput, IonButton, IonIcon,
    RouterLink,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginPage {
  private readonly authService = inject(AuthService);
  private readonly haptics = inject(HapticsService);

  email = signal('');
  password = signal('');
  errores = signal<Record<string, string>>({});
  errorGeneral = signal('');
  cargando = signal(false);

  private readonly usuariosRapidos: Record<string, { email: string; password: string }> = {
    dueño:      { email: 'dueno@resto.com',      password: '123456' },
    supervisor: { email: 'supervisor@resto.com', password: '123456' },
    metre:      { email: 'metre@resto.com',       password: '123456' },
    mozo:       { email: 'mozo@resto.com',        password: '123456' },
    cocinero:   { email: 'cocinero@resto.com',    password: '123456' },
    cantinero:  { email: 'bartender@resto.com',   password: '123456' },
    cliente:    { email: 'cliente@resto.com',     password: '123456' },
  };

  constructor() {
    addIcons({ personCircleOutline });
  }

  async validar(): Promise<boolean> {
    const errs: Record<string, string> = {};
    if (!this.email()) {
      errs['email'] = 'El correo electrónico es obligatorio.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.email())) {
      errs['email'] = 'El formato del correo no es válido.';
    }
    if (!this.password()) {
      errs['password'] = 'La contraseña es obligatoria.';
    } else if (this.password().length < 6) {
      errs['password'] = 'La contraseña debe tener al menos 6 caracteres.';
    }
    this.errores.set(errs);
    if (Object.keys(errs).length > 0) {
      await this.haptics.error();
      return false;
    }
    return true;
  }

  async login() {
    this.errorGeneral.set('');
    if (!await this.validar()) return;
    try {
      this.cargando.set(true);
      const usuario = await this.authService.login(this.email(), this.password());
      this.authService.redirigirSegunPerfil(usuario.perfil);
    } catch (error: unknown) {
      await this.haptics.error();
      this.errorGeneral.set((error as Error).message || 'Error al iniciar sesión. Verificá tus credenciales.');
    } finally {
      this.cargando.set(false);
    }
  }

  async loginRapido(perfil: string) {
    const credenciales = this.usuariosRapidos[perfil];
    if (!credenciales) return;
    this.email.set(credenciales.email);
    this.password.set(credenciales.password);
    await this.login();
  }
}
