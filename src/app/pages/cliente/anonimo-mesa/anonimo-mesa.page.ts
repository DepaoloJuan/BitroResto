import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonButton, IonIcon,
  IonGrid, IonRow, IonCol, IonCard, IonCardContent, IonItem, IonLabel,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { checkmarkCircleOutline, restaurantOutline, chatbubblesOutline, barChartOutline, logOutOutline } from 'ionicons/icons';
import { AuthService } from '../../../core/services/auth';
import { SupabaseService } from '../../../core/services/supabase';
import { Mesa } from '../../../core/models';

@Component({
  selector: 'app-anonimo-mesa',
  templateUrl: './anonimo-mesa.page.html',
  styleUrls: ['./anonimo-mesa.page.scss'],
  imports: [
    IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonButton, IonIcon,
    IonGrid, IonRow, IonCol, IonCard, IonCardContent, IonItem, IonLabel,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AnonimoMesaPage implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly supabase = inject(SupabaseService);
  private readonly router = inject(Router);

  protected readonly usuario = this.authService.usuario;
  mesa = signal<Mesa | null>(null);

  constructor() {
    addIcons({ checkmarkCircleOutline, restaurantOutline, chatbubblesOutline, barChartOutline, logOutOutline });
  }

  async ngOnInit() { await this.cargarMesa(); }

  async cargarMesa() {
    const u = this.authService.getUsuarioActual();
    if (!u?.mesa_id) return;
    const { data } = await this.supabase.client.from('mesas').select('*').eq('id', u.mesa_id).single();
    this.mesa.set(data);
  }

  ir(ruta: string) { this.router.navigate([ruta]); }
  verEncuestas() { this.router.navigate(['/cliente/encuesta-resultados']); }
  salir() { this.authService.setUsuarioAnonimo(null); this.router.navigate(['/login']); }
}
