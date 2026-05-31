import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonButton,
  IonIcon,
  IonGrid,
  IonRow,
  IonCol,
  IonCard,
  IonCardContent,
  IonItem,
  IonLabel,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  checkmarkCircleOutline,
  restaurantOutline,
  chatbubblesOutline,
  barChartOutline,
  logOutOutline,
} from 'ionicons/icons';
import { AuthService } from '../../../core/services/auth';
import { SupabaseService } from '../../../core/services/supabase';

@Component({
  selector: 'app-anonimo-mesa',
  templateUrl: './anonimo-mesa.page.html',
  styleUrls: ['./anonimo-mesa.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButtons,
    IonButton,
    IonIcon,
    IonGrid,
    IonRow,
    IonCol,
    IonCard,
    IonCardContent,
    IonItem,
    IonLabel,
  ],
})
export class AnonimoMesaPage implements OnInit {
  usuario: any;
  mesa: any = null;

  constructor(
    private authService: AuthService,
    private supabase: SupabaseService,
    private router: Router,
  ) {
    addIcons({
      checkmarkCircleOutline,
      restaurantOutline,
      chatbubblesOutline,
      barChartOutline,
      logOutOutline,
    });
  }

  async ngOnInit() {
    this.usuario = this.authService.getUsuarioActual();
    await this.cargarMesa();
  }

  async cargarMesa() {
    if (!this.usuario?.mesa_id) return;
    const { data } = await this.supabase.client
      .from('mesas')
      .select('*')
      .eq('id', this.usuario.mesa_id)
      .single();
    this.mesa = data;
  }

  ir(ruta: string) {
    this.router.navigate([ruta]);
  }

  verEncuestas() {
    this.router.navigate(['/cliente/encuesta-resultados']);
  }

  salir() {
    this.authService.setUsuarioAnonimo(null);
    this.router.navigate(['/login']);
  }
}
