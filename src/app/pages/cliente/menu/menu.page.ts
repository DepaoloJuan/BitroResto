import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  IonHeader, IonToolbar, IonTitle, IonContent,
  IonButtons, IonBackButton, IonSegment, IonSegmentButton, IonLabel,
} from '@ionic/angular/standalone';
import { SupabaseService } from '../../../core/services/supabase';
import { LoadingComponent } from '../../../shared/components/loading/loading.component';
import { Plato, Bebida } from '../../../core/models';

@Component({
  selector: 'app-menu',
  templateUrl: './menu.page.html',
  styleUrls: ['./menu.page.scss'],
  imports: [
    FormsModule, IonHeader, IonToolbar, IonTitle, IonContent,
    IonButtons, IonBackButton, IonSegment, IonSegmentButton, IonLabel, LoadingComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MenuPage implements OnInit {
  private readonly supabase = inject(SupabaseService);

  seccion = signal('platos');
  categoria = signal('entrada');
  platos = signal<Plato[]>([]);
  bebidas = signal<Bebida[]>([]);
  cargando = signal(false);

  readonly itemsFiltrados = computed(() => {
    if (this.seccion() === 'bebidas') return this.bebidas();
    return this.platos().filter(p => (p as any).categoria === this.categoria());
  });

  async ngOnInit() { await this.cargarItems(); }

  async cargarItems() {
    this.cargando.set(true);
    const [{ data: platosData }, { data: bebidasData }] = await Promise.all([
      this.supabase.client.from('platos').select('*').order('nombre', { ascending: true }),
      this.supabase.client.from('bebidas').select('*').order('nombre', { ascending: true }),
    ]);
    this.platos.set((platosData || []) as Plato[]);
    this.bebidas.set((bebidasData || []) as Bebida[]);
    this.cargando.set(false);
  }
}
