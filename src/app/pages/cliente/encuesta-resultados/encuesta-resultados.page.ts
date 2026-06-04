import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonBackButton, IonButton, IonIcon,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { barChartOutline, chevronBackOutline, chevronForwardOutline } from 'ionicons/icons';
import { SupabaseService } from '../../../core/services/supabase';
import { LoadingComponent } from '../../../shared/components/loading/loading.component';
import { Encuesta } from '../../../core/models';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);
Chart.defaults.color = 'rgba(255,220,163,0.75)';
Chart.defaults.borderColor = 'rgba(255,255,255,0.1)';

const COLORES_RATING = ['#e53935', '#fb8c00', '#fdd835', '#43a047', '#1e88e5'];

@Component({
  selector: 'app-encuesta-resultados',
  templateUrl: './encuesta-resultados.page.html',
  styleUrls: ['./encuesta-resultados.page.scss'],
  imports: [
    IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonBackButton, IonButton, IonIcon,
    LoadingComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EncuestaResultadosPage implements OnInit {
  private readonly supabase = inject(SupabaseService);

  cargando = signal(true);
  encuestas = signal<Encuesta[]>([]);
  graficosActivo = signal(0);

  private chartActual: Chart | null = null;

  readonly graficos = [
    { canvasId: 'graficoAtencion', titulo: 'Atención del personal', subtitulo: 'Distribución de puntajes (1 a 5 estrellas)' },
    { canvasId: 'graficoComida',   titulo: 'Calidad de la comida',  subtitulo: 'Cantidad de respuestas por puntaje' },
    { canvasId: 'graficoAmbiente', titulo: 'Ambiente del local',    subtitulo: 'Tendencia de valoración por puntaje' },
    { canvasId: 'graficoVolveria', titulo: '¿Volvería al restaurante?', subtitulo: 'Distribución de respuestas' },
  ];

  constructor() { addIcons({ barChartOutline, chevronBackOutline, chevronForwardOutline }); }

  async ngOnInit() {
    const { data } = await this.supabase.client.from('encuestas').select('*');
    this.encuestas.set((data || []) as Encuesta[]);
    this.cargando.set(false);
    setTimeout(() => this.renderizarGraficoActivo(), 150);
  }

  anterior() {
    if (this.graficosActivo() > 0) {
      this.graficosActivo.update(v => v - 1);
      setTimeout(() => this.renderizarGraficoActivo(), 50);
    }
  }

  siguiente() {
    if (this.graficosActivo() < this.graficos.length - 1) {
      this.graficosActivo.update(v => v + 1);
      setTimeout(() => this.renderizarGraficoActivo(), 50);
    }
  }

  irA(index: number) {
    this.graficosActivo.set(index);
    setTimeout(() => this.renderizarGraficoActivo(), 50);
  }

  private renderizarGraficoActivo() {
    if (!this.encuestas().length) return;
    if (this.chartActual) { this.chartActual.destroy(); this.chartActual = null; }
    switch (this.graficosActivo()) {
      case 0: this.chartActual = this.graficoTorta(); break;
      case 1: this.chartActual = this.graficoBarrasComida(); break;
      case 2: this.chartActual = this.graficoLinealAmbiente(); break;
      case 3: this.chartActual = this.graficoBarrasVolveria(); break;
    }
  }

  private contarPuntajes(campo: keyof Pick<Encuesta, 'atencion_puntaje' | 'comida_puntaje' | 'ambiente_puntaje'>) {
    const conteo = [0, 0, 0, 0, 0];
    this.encuestas().forEach(e => {
      const v = e[campo];
      if (v >= 1 && v <= 5) conteo[v - 1]++;
    });
    return conteo;
  }

  private escalaOpciones() {
    return {
      scales: {
        x: { ticks: { color: 'rgba(255,220,163,0.75)' }, grid: { color: 'rgba(255,255,255,0.08)' } },
        y: { beginAtZero: true, ticks: { stepSize: 1, color: 'rgba(255,220,163,0.75)' }, grid: { color: 'rgba(255,255,255,0.08)' } },
      },
      plugins: { legend: { labels: { color: 'rgba(255,220,163,0.85)' } } },
    };
  }

  private graficoTorta(): Chart {
    const conteo = this.contarPuntajes('atencion_puntaje');
    return new Chart('graficoAtencion', {
      type: 'pie',
      data: {
        labels: ['1 ⭐', '2 ⭐', '3 ⭐', '4 ⭐', '5 ⭐'],
        datasets: [{ data: conteo, backgroundColor: COLORES_RATING, borderColor: 'rgba(255,255,255,0.15)', borderWidth: 2 }],
      },
      options: { plugins: { legend: { labels: { color: 'rgba(255,220,163,0.85)', padding: 16 } } } },
    });
  }

  private graficoBarrasComida(): Chart {
    return new Chart('graficoComida', {
      type: 'bar',
      data: {
        labels: ['1 ⭐', '2 ⭐', '3 ⭐', '4 ⭐', '5 ⭐'],
        datasets: [{ label: 'Respuestas', data: this.contarPuntajes('comida_puntaje'), backgroundColor: COLORES_RATING, borderRadius: 6 }],
      },
      options: this.escalaOpciones() as any,
    });
  }

  private graficoLinealAmbiente(): Chart {
    return new Chart('graficoAmbiente', {
      type: 'line',
      data: {
        labels: ['1 ⭐', '2 ⭐', '3 ⭐', '4 ⭐', '5 ⭐'],
        datasets: [{
          label: 'Respuestas', data: this.contarPuntajes('ambiente_puntaje'),
          borderColor: '#eb6121', backgroundColor: 'rgba(235,97,33,0.15)',
          fill: true, tension: 0.4, pointBackgroundColor: '#eb6121', pointRadius: 5,
        }],
      },
      options: this.escalaOpciones() as any,
    });
  }

  private graficoBarrasVolveria(): Chart {
    const conteo = { si: 0, tal_vez: 0, no: 0 };
    this.encuestas().forEach(e => { if (e.volveria in conteo) conteo[e.volveria as keyof typeof conteo]++; });
    return new Chart('graficoVolveria', {
      type: 'bar',
      data: {
        labels: ['Sí', 'Tal vez', 'No'],
        datasets: [{ label: 'Respuestas', data: [conteo.si, conteo.tal_vez, conteo.no], backgroundColor: ['#43a047', '#fdd835', '#e53935'], borderRadius: 6 }],
      },
      options: this.escalaOpciones() as any,
    });
  }
}
