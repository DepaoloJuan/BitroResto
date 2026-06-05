import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonBackButton,
  IonSegment, IonSegmentButton, IonLabel, IonIcon,
} from '@ionic/angular/standalone';
import { NgApexchartsModule } from 'ng-apexcharts';
import { addIcons } from 'ionicons';
import { restaurantOutline, cashOutline, trendingUpOutline, star, starOutline } from 'ionicons/icons';
import { SupabaseService } from '../../../core/services/supabase';
import { LoadingComponent } from '../../../shared/components/loading/loading.component';

type Periodo = 'dia' | 'semana' | 'mes';

@Component({
  selector: 'app-tablero',
  templateUrl: './tablero.page.html',
  styleUrls: ['./tablero.page.scss'],
  imports: [
    FormsModule, NgApexchartsModule,
    IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonBackButton,
    IonSegment, IonSegmentButton, IonLabel, IonIcon, LoadingComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TableroPague implements OnInit {
  private readonly supabase = inject(SupabaseService);

  cargando = signal(true);
  periodo = signal<Periodo>('dia');

  mesasAtendidas = signal(0);
  facturacion    = signal(0);
  ticketPromedio = signal(0);

  promedioAtencion = signal(0);
  promedioComida   = signal(0);
  promedioAmbiente = signal(0);

  barSeries     = signal<any[]>([]);
  barCategorias = signal<string[]>([]);
  donutSeries   = signal<number[]>([0, 0, 0]);

  private pedidos:   any[] = [];
  private encuestas: any[] = [];

  // ── Chart configs (estáticos) ─────────────────────────────
  readonly barChart        = { type: 'bar' as const, height: 220, toolbar: { show: false }, background: 'transparent', foreColor: '#ffdca3' };
  readonly barPlotOptions  = { bar: { borderRadius: 6, columnWidth: '55%' } };
  readonly barColors       = ['#eb6121'];
  readonly barDataLabels   = { enabled: false };
  readonly chartGrid       = { borderColor: 'rgba(255,255,255,0.12)', strokeDashArray: 4 };
  readonly barYaxis        = { labels: { style: { colors: '#ffdca3', fontSize: '11px' }, formatter: (v: number) => v >= 1000 ? `$${(v / 1000).toFixed(1)}k` : `$${v}` } };
  readonly barTooltip      = { theme: 'dark', y: { formatter: (v: number) => `$${v.toLocaleString('es-AR')}` } };
  readonly donutChart      = { type: 'donut' as const, height: 210, background: 'transparent', foreColor: '#ffdca3' };
  readonly donutColors     = ['#2ec27e', '#e5a50a', '#e01b24'];
  readonly donutLabels     = ['Sí', 'Tal vez', 'No'];
  readonly donutLegend     = { labels: { colors: ['#ffdca3', '#ffdca3', '#ffdca3'] }, fontSize: '13px' };
  readonly donutDataLabels = { style: { colors: ['#fff', '#fff', '#fff'] } };
  readonly donutTooltip    = { theme: 'dark' };

  readonly encuestasVacias  = computed(() => this.promedioAtencion() === 0 && this.promedioComida() === 0);
  readonly donutVacio       = computed(() => this.donutSeries().every(v => v === 0));
  readonly satisfaccionItems = computed(() => [
    { label: 'Atención', valor: this.promedioAtencion() },
    { label: 'Comida',   valor: this.promedioComida()   },
    { label: 'Ambiente', valor: this.promedioAmbiente() },
  ]);

  readonly barXaxis = computed(() => ({
    categories: this.barCategorias(),
    labels: { style: { colors: '#ffdca3', fontSize: '11px' } },
    axisBorder: { color: 'rgba(255,255,255,0.12)' },
    axisTicks:  { color: 'rgba(255,255,255,0.12)' },
  }));

  constructor() {
    addIcons({ restaurantOutline, cashOutline, trendingUpOutline, star, starOutline });
  }

  async ngOnInit() {
    await this.cargarDatos();
  }

  async cargarDatos() {
    this.cargando.set(true);

    const hace31dias = new Date();
    hace31dias.setDate(hace31dias.getDate() - 31);
    hace31dias.setHours(0, 0, 0, 0);

    const [{ data: pedidosData }, { data: encuestasData }] = await Promise.all([
      this.supabase.client
        .from('pedidos').select('fecha_creacion, total')
        .eq('estado', 'pagado').gte('fecha_creacion', hace31dias.toISOString()),
      this.supabase.client
        .from('encuestas').select('atencion_puntaje, comida_puntaje, ambiente_puntaje, volveria'),
    ]);

    this.pedidos   = pedidosData   || [];
    this.encuestas = encuestasData || [];

    this.calcularMetricas();
    this.calcularGrafico7Dias();
    this.calcularEncuestas();
    this.cargando.set(false);
  }

  cambiarPeriodo(p: string) {
    this.periodo.set(p as Periodo);
    this.calcularMetricas();
  }

  private startOf(periodo: Periodo): Date {
    const now = new Date();
    if (periodo === 'dia') return new Date(now.getFullYear(), now.getMonth(), now.getDate());
    if (periodo === 'semana') {
      const diff = now.getDay() === 0 ? 6 : now.getDay() - 1;
      return new Date(now.getFullYear(), now.getMonth(), now.getDate() - diff);
    }
    return new Date(now.getFullYear(), now.getMonth(), 1);
  }

  private calcularMetricas() {
    const desde    = this.startOf(this.periodo());
    const filtrado = this.pedidos.filter(p => new Date(p.fecha_creacion) >= desde);
    const total    = filtrado.reduce((s, p) => s + (p.total || 0), 0);
    this.mesasAtendidas.set(filtrado.length);
    this.facturacion.set(total);
    this.ticketPromedio.set(filtrado.length ? Math.round(total / filtrado.length) : 0);
  }

  private calcularGrafico7Dias() {
    const dias = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      d.setHours(0, 0, 0, 0);
      return d;
    });

    const datos = dias.map(dia => {
      const sig = new Date(dia);
      sig.setDate(sig.getDate() + 1);
      return this.pedidos
        .filter(p => { const f = new Date(p.fecha_creacion); return f >= dia && f < sig; })
        .reduce((s, p) => s + (p.total || 0), 0);
    });

    const cats = dias.map(d =>
      d.toLocaleDateString('es-AR', { weekday: 'short', day: 'numeric' }).replace('.', '')
    );

    this.barSeries.set([{ name: 'Facturación', data: datos }]);
    this.barCategorias.set(cats);
  }

  private calcularEncuestas() {
    const enc = this.encuestas;
    if (!enc.length) return;
    const avg = (key: string) =>
      Math.round(enc.reduce((s, e) => s + (e[key] || 0), 0) / enc.length * 10) / 10;
    this.promedioAtencion.set(avg('atencion_puntaje'));
    this.promedioComida.set(avg('comida_puntaje'));
    this.promedioAmbiente.set(avg('ambiente_puntaje'));
    this.donutSeries.set([
      enc.filter(e => e.volveria === 'si').length,
      enc.filter(e => e.volveria === 'tal_vez').length,
      enc.filter(e => e.volveria === 'no').length,
    ]);
  }

  formatCurrency(v: number): string {
    return v >= 1000 ? `$${(v / 1000).toFixed(1)}k` : `$${v}`;
  }

  stars(val: number): boolean[] {
    return Array.from({ length: 5 }, (_, i) => i < Math.round(val));
  }
}
