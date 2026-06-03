import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonCard, IonCardHeader, IonCardTitle,
  IonCardSubtitle, IonCardContent, IonButtons, IonBackButton, IonSegment, IonSegmentButton, IonLabel,
} from '@ionic/angular/standalone';
import { SupabaseService } from '../../../core/services/supabase';
import { LoadingComponent } from '../../../shared/components/loading/loading.component';
import { Plato, Bebida } from '../../../core/models';

@Component({
  selector: 'app-menu',
  templateUrl: './menu.page.html',
  styleUrls: ['./menu.page.scss'],
  imports: [
    FormsModule, IonHeader, IonToolbar, IonTitle, IonContent, IonCard, IonCardHeader,
    IonCardTitle, IonCardSubtitle, IonCardContent, IonButtons, IonBackButton,
    IonSegment, IonSegmentButton, IonLabel, LoadingComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MenuPage implements OnInit {
  private readonly supabase = inject(SupabaseService);

  seccion = signal('platos');
  items = signal<(Plato | Bebida)[]>([]);
  cargando = signal(false);

  async ngOnInit() { await this.cargarItems(); }

  async cambiarSeccion() { await this.cargarItems(); }

  async cargarItems() {
    this.cargando.set(true);
    const tabla = this.seccion() === 'platos' ? 'platos' : 'bebidas';
    const { data } = await this.supabase.client
      .from(tabla).select('*').order('nombre', { ascending: true });
    this.items.set(data || []);
    this.cargando.set(false);
  }
}
