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
  IonSpinner,
  IonButtons,
  IonBackButton,
} from '@ionic/angular/standalone';
import { SupabaseService } from '../../../core/services/supabase';
import { Chart, registerables } from 'chart.js';

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
    IonSpinner,
    IonButtons,
    IonBackButton,
  ],
})
export class EncuestaResultadosPage implements OnInit, AfterViewInit {
  cargando = true;
  encuestas: any[] = [];

  constructor(private supabase: SupabaseService) {}

  async ngOnInit() {
    const { data } = await this.supabase.client.from('encuestas').select('*');
    this.encuestas = data || [];
    this.cargando = false;
  }

  async ngAfterViewInit() {
    setTimeout(() => this.generarGraficos(), 500);
  }

  generarGraficos() {
    if (this.encuestas.length === 0) return;
    this.graficoTorta();
    this.graficoBarrasComida();
    this.graficoLinealAmbiente();
    this.graficoBarrasVolveria();
  }

  graficoTorta() {
    const conteo = [0, 0, 0, 0, 0];
    this.encuestas.forEach((e) => {
      if (e.atencion_puntaje >= 1 && e.atencion_puntaje <= 5)
        conteo[e.atencion_puntaje - 1]++;
    });

    new Chart('graficaAtencion', {
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
  }

  graficoBarrasComida() {
    const conteo = [0, 0, 0, 0, 0];
    this.encuestas.forEach((e) => {
      if (e.comida_puntaje >= 1 && e.comida_puntaje <= 5)
        conteo[e.comida_puntaje - 1]++;
    });

    new Chart('graficoCome', {
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
  }

  graficoLinealAmbiente() {
    const conteo = [0, 0, 0, 0, 0];
    this.encuestas.forEach((e) => {
      if (e.ambiente_puntaje >= 1 && e.ambiente_puntaje <= 5)
        conteo[e.ambiente_puntaje - 1]++;
    });

    new Chart('graficoAmbiente', {
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
  }

  graficoBarrasVolveria() {
    const conteo = { si: 0, tal_vez: 0, no: 0 };
    this.encuestas.forEach((e) => {
      if (e.volveria in conteo) conteo[e.volveria as keyof typeof conteo]++;
    });

    new Chart('graficoVolveria', {
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
  }
}
