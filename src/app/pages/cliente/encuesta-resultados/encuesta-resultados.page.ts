import { Component, OnInit, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
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
  IonButtons,
  IonBackButton,
  IonButton,
  IonIcon,
  IonText,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  barChartOutline,
  chevronBackOutline,
  chevronForwardOutline,
} from 'ionicons/icons';
import { SupabaseService } from '../../../core/services/supabase';
import { Chart, registerables } from 'chart.js';
import { LoadingComponent } from '../../../shared/components/loading/loading.component';

Chart.register(...registerables);

@Component({
  selector: 'app-encuesta-resultados',
  templateUrl: './encuesta-resultados.page.html',
  styleUrls: ['./encuesta-resultados.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardSubtitle,
    IonCardContent,
    IonButtons,
    IonBackButton,
    IonButton,
    IonIcon,
    IonText,
    LoadingComponent,
  ],
})
export class EncuestaResultadosPage implements OnInit, AfterViewInit {
  cargando = true;
  encuestas: any[] = [];
  graficosActivo = 0;
  chartsInstanciados: Chart[] = [];

  graficos = [
    {
      canvasId: 'graficoAtencion',
      titulo: 'Atención del personal',
      subtitulo: 'Gráfico de torta',
    },
    {
      canvasId: 'graficoComida',
      titulo: 'Calidad de la comida',
      subtitulo: 'Gráfico de barras',
    },
    {
      canvasId: 'graficoAmbiente',
      titulo: 'Ambiente del local',
      subtitulo: 'Gráfico lineal',
    },
    {
      canvasId: 'graficoVolveria',
      titulo: '¿Volvería al restaurante?',
      subtitulo: 'Gráfico de barras',
    },
  ];

  constructor(private supabase: SupabaseService) {
    addIcons({ barChartOutline, chevronBackOutline, chevronForwardOutline });
  }

  async ngOnInit() {
    const { data } = await this.supabase.client.from('encuestas').select('*');
    this.encuestas = data || [];
    this.cargando = false;
  }

  async ngAfterViewInit() {
    // Espera que termine ngOnInit y que el DOM esté listo
    setTimeout(() => this.renderizarGraficoActivo(), 300);
  }

  anterior() {
    if (this.graficosActivo > 0) {
      this.graficosActivo--;
      setTimeout(() => this.renderizarGraficoActivo(), 50);
    }
  }

  siguiente() {
    if (this.graficosActivo < this.graficos.length - 1) {
      this.graficosActivo++;
      setTimeout(() => this.renderizarGraficoActivo(), 50);
    }
  }

  renderizarGraficoActivo() {
    if (this.encuestas.length === 0) return;

    const canvasId = this.graficos[this.graficosActivo].canvasId;

    // Destruir instancia previa del mismo canvas si existe
    const existente = this.chartsInstanciados.find(
      (c) => (c.canvas as HTMLCanvasElement).id === canvasId,
    );
    if (existente) {
      existente.destroy();
      this.chartsInstanciados = this.chartsInstanciados.filter(
        (c) => (c.canvas as HTMLCanvasElement).id !== canvasId,
      );
    }

    switch (this.graficosActivo) {
      case 0:
        this.graficoTorta();
        break;
      case 1:
        this.graficoBarrasComida();
        break;
      case 2:
        this.graficoLinealAmbiente();
        break;
      case 3:
        this.graficoBarrasVolveria();
        break;
    }
  }

  graficoTorta() {
    const conteo = [0, 0, 0, 0, 0];
    this.encuestas.forEach((e) => {
      if (e.atencion_puntaje >= 1 && e.atencion_puntaje <= 5)
        conteo[e.atencion_puntaje - 1]++;
    });

    const chart = new Chart('graficoAtencion', {
      type: 'pie',
      data: {
        labels: ['1 ⭐', '2 ⭐', '3 ⭐', '4 ⭐', '5 ⭐'],
        datasets: [
          {
            data: conteo,
            backgroundColor: [
              '#e53935',
              '#fb8c00',
              '#fdd835',
              '#43a047',
              '#1e88e5',
            ],
          },
        ],
      },
    });
    this.chartsInstanciados.push(chart);
  }

  graficoBarrasComida() {
    const conteo = [0, 0, 0, 0, 0];
    this.encuestas.forEach((e) => {
      if (e.comida_puntaje >= 1 && e.comida_puntaje <= 5)
        conteo[e.comida_puntaje - 1]++;
    });

    const chart = new Chart('graficoComida', {
      type: 'bar',
      data: {
        labels: ['1', '2', '3', '4', '5'],
        datasets: [
          {
            label: 'Cantidad de respuestas',
            data: conteo,
            backgroundColor: '#1e88e5',
          },
        ],
      },
      options: {
        scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } },
      },
    });
    this.chartsInstanciados.push(chart);
  }

  graficoLinealAmbiente() {
    const conteo = [0, 0, 0, 0, 0];
    this.encuestas.forEach((e) => {
      if (e.ambiente_puntaje >= 1 && e.ambiente_puntaje <= 5)
        conteo[e.ambiente_puntaje - 1]++;
    });

    const chart = new Chart('graficoAmbiente', {
      type: 'line',
      data: {
        labels: ['1', '2', '3', '4', '5'],
        datasets: [
          {
            label: 'Cantidad de respuestas',
            data: conteo,
            borderColor: '#43a047',
            backgroundColor: 'rgba(67,160,71,0.2)',
            fill: true,
            tension: 0.4,
          },
        ],
      },
      options: {
        scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } },
      },
    });
    this.chartsInstanciados.push(chart);
  }

  graficoBarrasVolveria() {
    const conteo = { si: 0, tal_vez: 0, no: 0 };
    this.encuestas.forEach((e) => {
      if (e.volveria in conteo) conteo[e.volveria as keyof typeof conteo]++;
    });

    const chart = new Chart('graficoVolveria', {
      type: 'bar',
      data: {
        labels: ['Sí', 'Tal vez', 'No'],
        datasets: [
          {
            label: 'Respuestas',
            data: [conteo.si, conteo.tal_vez, conteo.no],
            backgroundColor: ['#43a047', '#fdd835', '#e53935'],
          },
        ],
      },
      options: {
        scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } },
      },
    });
    this.chartsInstanciados.push(chart);
  }
}
