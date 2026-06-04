import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonCard, IonCardHeader, IonCardTitle,
  IonCardSubtitle, IonCardContent, IonButton, IonIcon, IonSpinner, IonText, IonItem,
  IonLabel, IonButtons, IonBackButton, IonRange, IonRadioGroup, IonRadio,
  IonSelect, IonSelectOption,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { star, starOutline, checkmarkCircleOutline, barChartOutline } from 'ionicons/icons';
import { AuthService } from '../../../core/services/auth';
import { SupabaseService } from '../../../core/services/supabase';
import { HapticsService } from '../../../core/services/haptics.service';

@Component({
  selector: 'app-encuesta',
  templateUrl: './encuesta.page.html',
  styleUrls: ['./encuesta.page.scss'],
  imports: [
    FormsModule, IonHeader, IonToolbar, IonTitle, IonContent, IonCard, IonCardHeader,
    IonCardTitle, IonCardSubtitle, IonCardContent, IonButton, IonIcon, IonSpinner, IonText,
    IonItem, IonLabel, IonButtons, IonBackButton, IonRange, IonRadioGroup, IonRadio,
    IonSelect, IonSelectOption,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EncuestaPage implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly supabase = inject(SupabaseService);
  private readonly router = inject(Router);
  private readonly haptics = inject(HapticsService);

  private mesaId = '';
  yaRespondio = signal(false);
  cargando = signal(false);
  errorGeneral = signal('');
  errores = signal<Record<string, string>>({});

  form = { atencion_puntaje: 0, comida_puntaje: 3, ambiente_puntaje: 0, volveria: '' };

  constructor() { addIcons({ star, starOutline, checkmarkCircleOutline, barChartOutline }); }

  async ngOnInit() {
    await this.obtenerMesa();
    await this.verificarEncuesta();
  }

  async obtenerMesa() {
    const usuario = this.authService.getUsuarioActual();
    if (!usuario) return;
    const { data } = await this.supabase.client
      .from('lista_espera').select('mesa_id').eq('usuario_id', usuario.id).eq('estado', 'asignado').single();
    this.mesaId = data?.mesa_id || '';
  }

  async verificarEncuesta() {
    const usuario = this.authService.getUsuarioActual();
    if (!usuario) return;
    const { data } = await this.supabase.client
      .from('encuestas').select('encuesta_id').eq('usuario_id', usuario.id).eq('mesa_id', this.mesaId).single();
    this.yaRespondio.set(!!data);
  }

  async validar(): Promise<boolean> {
    const f = this.form;
    const errs: Record<string, string> = {};
    if (!f.atencion_puntaje) errs['atencion'] = 'Seleccioná un puntaje de atención.';
    if (!f.ambiente_puntaje) errs['ambiente'] = 'Seleccioná un puntaje de ambiente.';
    if (!f.volveria) errs['volveria'] = 'Seleccioná una opción.';
    this.errores.set(errs);
    if (Object.keys(errs).length > 0) { await this.haptics.error(); return false; }
    return true;
  }

  async enviar() {
    this.errorGeneral.set('');
    if (!await this.validar()) return;
    const usuario = this.authService.getUsuarioActual();
    if (!usuario) return;
    try {
      this.cargando.set(true);
      const f = this.form;
      const { error } = await this.supabase.client.from('encuestas').insert({
        atencion_puntaje: f.atencion_puntaje,
        comida_puntaje: f.comida_puntaje, ambiente_puntaje: f.ambiente_puntaje,
        mesa_id: this.mesaId, usuario_id: usuario.id,
        volveria: f.volveria, fecha: new Date().toISOString(),
      });
      if (error) throw error;
      this.yaRespondio.set(true);
    } catch (e: unknown) {
      await this.haptics.error();
      this.errorGeneral.set((e as Error).message || 'Error al enviar la encuesta.');
    } finally {
      this.cargando.set(false);
    }
  }

  verResultados() { this.router.navigate(['/cliente/encuesta-resultados']); }
}
