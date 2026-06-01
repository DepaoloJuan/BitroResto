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
  IonCard,
  IonCardContent,
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
  chatbubblesOutline,
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
    IonCard,
    IonCardContent,
  ],
})
export class HomePage implements OnInit {
  usuario: any;
  mesaAsignada: any = null;
  pedidoActual: any = null;

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
      chatbubblesOutline,
    });
  }

  async ngOnInit() {
    this.usuario = this.authService.getUsuarioActual();
    await this.verificarMesa();
    await this.verificarPedido();
    this.suscribirCambios();
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
      this.router.navigate(['/cliente/mesa'], { replaceUrl: true });
    }
  }

  async verificarPedido() {
    if (!this.mesaAsignada) return;
    const { data } = await this.supabase.client
      .from('pedidos')
      .select('*')
      .eq('mesa_id', this.mesaAsignada.id)
      .not('estado', 'in', '("pagado")')
      .order('fecha_creacion', { ascending: false })
      .limit(1)
      .single();
    this.pedidoActual = data || null;
  }

  suscribirCambios() {
    this.supabase.client
      .channel('home_cliente')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'pedidos',
        },
        () => this.verificarPedido(),
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'lista_espera',
        },
        () => {
          this.verificarMesa();
          this.verificarPedido();
        },
      )
      .subscribe();
  }

  getColorEstado(estado: string): string {
    const colores: Record<string, string> = {
      esperando_mozo: 'warning',
      rechazado_mozo: 'danger',
      en_cocina: 'primary',
      listo: 'success',
      entregado: 'tertiary',
      pago_solicitado: 'medium',
    };
    return colores[estado] || 'medium';
  }

  getTextoEstado(estado: string): string {
    const textos: Record<string, string> = {
      esperando_mozo: 'Esperando confirmación del mozo',
      rechazado_mozo: 'Pedido rechazado — modificalo y reenvialo',
      en_cocina: 'En preparación',
      listo: 'Listo para entregar',
      entregado: 'Entregado — ¡buen provecho!',
      pago_solicitado: 'Cuenta solicitada',
    };
    return textos[estado] || estado;
  }

  ir(ruta: string) {
    this.router.navigate([ruta]);
  }

  async cerrarSesion() {
    await this.authService.logout();
  }
}
