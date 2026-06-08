import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { Router } from '@angular/router';
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
  IonSegment,
  IonSegmentButton,
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
  imports: [
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
    IonSegment,
    IonSegmentButton,
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
  desdePago = signal(false);
  cargando = signal(false);
  errorGeneral = signal('');
  errores = signal<Record<string, string>>({});
  facturaAnonima = signal<string | null>(null);

  form = {
    atencion_puntaje: 0,
    comida_puntaje: 3,
    ambiente_puntaje: 0,
    volveria: '',
  };

  constructor() {
    addIcons({ star, starOutline, checkmarkCircleOutline, barChartOutline });
  }

  async ngOnInit() {
    if (history.state?.desdePago) this.desdePago.set(true);

    await this.obtenerMesa();
    await this.verificarEncuesta();

    await this.cargarFacturaExistente();
    this.iniciarRealtimeFactura();
  }

  async obtenerMesa() {
    const usuario = this.authService.getUsuarioActual();
    if (!usuario) return;
    if (usuario.perfil === 'anonimo') {
      this.mesaId = usuario.mesa_id || history.state?.mesaId || '';
      return;
    }
    const { data } = await this.supabase.client
      .from('lista_espera')
      .select('mesa_id')
      .eq('usuario_id', usuario.id)
      .in('estado', ['asignado', 'finalizado'])
      .order('fecha_ingreso', { ascending: false })
      .limit(1)
      .maybeSingle();
    this.mesaId = data?.mesa_id || history.state?.mesaId || '';
  }

  async verificarEncuesta() {
    const usuario = this.authService.getUsuarioActual();
    if (!usuario || usuario.perfil === 'anonimo') return;
    const { data } = await this.supabase.client
      .from('encuestas')
      .select('encuesta_id')
      .eq('usuario_id', usuario.id)
      .eq('mesa_id', this.mesaId)
      .single();
    this.yaRespondio.set(!!data);
  }

  async validar(): Promise<boolean> {
    const f = this.form;
    const errs: Record<string, string> = {};
    if (!f.atencion_puntaje)
      errs['atencion'] = 'Seleccioná un puntaje de atención.';
    if (!f.ambiente_puntaje)
      errs['ambiente'] = 'Seleccioná un puntaje de ambiente.';
    if (!f.volveria) errs['volveria'] = 'Seleccioná una opción.';
    this.errores.set(errs);
    if (Object.keys(errs).length > 0) {
      await this.haptics.error();
      return false;
    }
    return true;
  }

  async enviar() {
    this.errorGeneral.set('');
    if (!(await this.validar())) return;
    const usuario = this.authService.getUsuarioActual();
    if (!usuario) return;
    try {
      this.cargando.set(true);
      const f = this.form;
      const { error } = await this.supabase.client.from('encuestas').insert({
        atencion_puntaje: f.atencion_puntaje,
        comida_puntaje: f.comida_puntaje,
        ambiente_puntaje: f.ambiente_puntaje,
        mesa_id: this.mesaId,
        usuario_id: usuario.id || null,
        volveria: f.volveria,
        fecha: new Date().toISOString(),
      });
      if (error) throw error;
      this.yaRespondio.set(true);
      if (this.desdePago()) setTimeout(() => this.finalizarSesion(), 10000);
    } catch (e: unknown) {
      await this.haptics.error();
      this.errorGeneral.set(
        (e as Error).message || 'Error al enviar la encuesta.'
      );
    } finally {
      this.cargando.set(false);
    }
  }

  finalizarSesion() {
    const usuario = this.authService.getUsuarioActual();
    if (usuario?.perfil === 'anonimo') {
      this.authService.setUsuarioAnonimo(null);
    } else {
      this.authService.logout();
    }
    this.router.navigate(['/login'], { replaceUrl: true });
  }

  abrirFactura(url: string) {
    window.open(url, '_blank');
  }

  iniciarRealtimeFactura() {
    if (!this.mesaId) return;

    this.supabase.client
      .channel('facturas_anonimas_channel')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'facturas',
          filter: `mesa_id=eq.${this.mesaId}`,
        },
        (payload) => {
          const url = (payload.new as any)?.pdf_url;
          if (url) this.facturaAnonima.set(url);
        }
      )
      .subscribe();
  }

  async cargarFacturaExistente() {
    if (!this.mesaId) return;

    const { data } = await this.supabase.client
      .from('facturas')
      .select('pdf_url')
      .eq('mesa_id', this.mesaId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (data?.pdf_url) {
      this.facturaAnonima.set(data.pdf_url);
    }
  }

  verResultados() {
    this.router.navigate(['/cliente/encuesta-resultados']);
  }
}
