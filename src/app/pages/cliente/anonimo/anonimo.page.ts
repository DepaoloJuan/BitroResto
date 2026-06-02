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
import { personCircleOutline, cameraOutline } from 'ionicons/icons';
import { SupabaseService } from '../../../core/services/supabase';
import { AuthService } from '../../../core/services/auth';
import { CamaraService } from 'src/app/core/services/camara.service';

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
  cargando = false;

  constructor(
    private supabase: SupabaseService,
    private authService: AuthService,
    private router: Router,
    private camaraService: CamaraService,
  ) {
    addIcons({ personCircleOutline, cameraOutline });
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
