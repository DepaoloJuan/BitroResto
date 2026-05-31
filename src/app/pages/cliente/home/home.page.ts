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
  timeOutline,
  restaurantOutline,
  cartOutline,
  gameControllerOutline,
  clipboardOutline,
  receiptOutline,
  logOutOutline,
  checkmarkCircleOutline,
} from 'ionicons/icons';
import { AuthService } from '../../../core/services/auth';
import { SupabaseService } from '../../../core/services/supabase';

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
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
export class HomePage implements OnInit {
  usuario: any;
  mesaAsignada: any = null;

  constructor(
    private authService: AuthService,
    private supabase: SupabaseService,
    private router: Router,
  ) {
    addIcons({
      timeOutline,
      restaurantOutline,
      cartOutline,
      gameControllerOutline,
      clipboardOutline,
      receiptOutline,
      logOutOutline,
      checkmarkCircleOutline,
    });
  }

  async ngOnInit() {
    this.usuario = this.authService.getUsuarioActual();
    await this.verificarMesa();
  }

  async verificarMesa() {
    if (!this.usuario) return;

    const { data } = await this.supabase.client
      .from('lista_espera')
      .select('*, mesas(*)')
      .eq('usuario_id', this.usuario.id)
      .eq('estado', 'asignado')
      .single();

    if (data?.mesas) {
      this.mesaAsignada = data.mesas;
    }
  }

  ir(ruta: string) {
    this.router.navigate([ruta]);
  }

  async cerrarSesion() {
    await this.authService.logout();
  }
}
