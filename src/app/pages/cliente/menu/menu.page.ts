import { Component, OnInit } from '@angular/core';
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
  IonButtons,
  IonBackButton,
  IonSegment,
  IonSegmentButton,
  IonLabel,
} from '@ionic/angular/standalone';
import { SupabaseService } from '../../../core/services/supabase';
import { LoadingComponent } from '../../../shared/components/loading/loading.component';

@Component({
  selector: 'app-menu',
  templateUrl: './menu.page.html',
  styleUrls: ['./menu.page.scss'],
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
    IonButtons,
    IonBackButton,
    IonSegment,
    IonSegmentButton,
    IonLabel,
    LoadingComponent,
  ],
})
export class MenuPage implements OnInit {
  seccion = 'platos';
  items: any[] = [];
  cargando = false;

  constructor(private supabase: SupabaseService) {}

  async ngOnInit() {
    await this.cargarItems();
  }

  async cambiarSeccion() {
    await this.cargarItems();
  }

  async cargarItems() {
    this.cargando = true;
    const tabla = this.seccion === 'platos' ? 'platos' : 'bebidas';
    const { data } = await this.supabase.client
      .from(tabla)
      .select('*')
      .order('nombre', { ascending: true });
    this.items = data || [];
    this.cargando = false;
  }
}
