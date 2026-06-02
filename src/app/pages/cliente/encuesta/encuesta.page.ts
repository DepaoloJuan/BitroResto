import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardSubtitle,
  IonCardContent,
  IonButton,
  IonIcon,
  IonSpinner,
  IonText,
  IonItem,
  IonLabel,
  IonButtons,
  IonBackButton,
  IonRange,
  IonRadioGroup,
  IonRadio,
  IonSelect,
  IonSelectOption,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  star,
  starOutline,
  checkmarkCircleOutline,
  barChartOutline,
} from 'ionicons/icons';
import { AuthService } from '../../../core/services/auth';
import { SupabaseService } from '../../../core/services/supabase';
import { HapticsService } from '../../../core/services/haptics.service';

@Component({
  selector: 'app-encuesta',
  templateUrl: './encuesta.page.html',
  styleUrls: ['./encuesta.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardSubtitle,
    IonCardContent,
    IonButton,
    IonIcon,
    IonSpinner,
    IonText,
    IonItem,
    IonLabel,
    IonButtons,
    IonBackButton,
    IonRange,
    IonRadioGroup,
    IonRadio,
    IonSelect,
    IonSelectOption,
  ],
})
export class EncuestaPage implements OnInit {
  usuario: any;
  mesaId = '';
  yaRespondio = false;
  cargando = false;
  errorGeneral = '';
  errores: any = {};

  form = {
    atencion_puntaje: 0,
    comida_puntaje: 3,
    ambiente_puntaje: 0,
    volveria: '',
  };

  constructor(
    private authService: AuthService,
    private supabase: SupabaseService,
    private router: Router,
    private haptics: HapticsService,
  ) {
    addIcons({ star, starOutline, checkmarkCircleOutline, barChartOutline });
  }

  async ngOnInit() {
    this.usuario = this.authService.getUsuarioActual();
    await this.obtenerMesa();
    await this.verificarEncuesta();
  }

  async obtenerMesa() {
    const { data } = await this.supabase.client
      .from('lista_espera')
      .select('mesa_id')
      .eq('usuario_id', this.usuario.id)
      .eq('estado', 'asignado')
      .single();
    this.mesaId = data?.mesa_id || '';
  }

  async verificarEncuesta() {
    const { data } = await this.supabase.client
      .from('encuestas')
      .select('encuesta_id')
      .eq('usuario_id', this.usuario.id)
      .eq('mesa_id', this.mesaId)
      .single();
    this.yaRespondio = !!data;
  }

  async validar(): Promise<boolean> {
    this.errores = {};
    if (!this.form.atencion_puntaje)
      this.errores.atencion = 'Seleccioná un puntaje de atención.';
    if (!this.form.ambiente_puntaje)
      this.errores.ambiente = 'Seleccioná un puntaje de ambiente.';
    if (!this.form.volveria) this.errores.volveria = 'Seleccioná una opción.';
    if (Object.keys(this.errores).length > 0) {
      await this.haptics.error();
      return false;
    }
    return true;
  }

  async enviar() {
    this.errorGeneral = '';
    if (!await this.validar()) return;

    try {
      this.cargando = true;

      const { error } = await this.supabase.client.from('encuestas').insert({
        encuesta_id: Date.now(),
        atencion_puntaje: this.form.atencion_puntaje,
        comida_puntaje: this.form.comida_puntaje,
        ambiente_puntaje: this.form.ambiente_puntaje,
        mesa_id: this.mesaId,
        usuario_id: this.usuario.id,
        volveria: this.form.volveria,
        fecha: new Date().toISOString(),
      });

      if (error) throw error;
      this.yaRespondio = true;
    } catch (error: any) {
      await this.haptics.error();
      this.errorGeneral = error.message || 'Error al enviar la encuesta.';
    } finally {
      this.cargando = false;
    }
  }

  verResultados() {
    this.router.navigate(['/cliente/encuesta-resultados']);
  }
}
