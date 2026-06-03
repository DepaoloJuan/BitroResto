import { ChangeDetectionStrategy, Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonButton,
  IonIcon, IonCard, IonCardContent,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  timeOutline, restaurantOutline, cartOutline, gameControllerOutline, clipboardOutline,
  receiptOutline, logOutOutline, checkmarkCircleOutline, chatbubblesOutline,
} from 'ionicons/icons';
import { AuthService } from '../../../core/services/auth';
import { SupabaseService } from '../../../core/services/supabase';
import { Pedido } from '../../../core/models';
import { RealtimeChannel } from '@supabase/supabase-js';

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  imports: [
    IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonButton,
    IonIcon, IonCard, IonCardContent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomePage implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly supabase = inject(SupabaseService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly usuario = this.authService.usuario;
  mesaAsignada = signal<{ id: string } | null>(null);
  pedidoActual = signal<Pedido | null>(null);

  private canal?: RealtimeChannel;

  constructor() {
    addIcons({ timeOutline, restaurantOutline, cartOutline, gameControllerOutline, clipboardOutline, receiptOutline, logOutOutline, checkmarkCircleOutline, chatbubblesOutline });
    this.destroyRef.onDestroy(() => {
      if (this.canal) this.supabase.client.removeChannel(this.canal);
    });
  }

  async ngOnInit() {
    await this.verificarMesa();
    await this.verificarPedido();
    this.suscribirCambios();
  }

  async verificarMesa() {
    const usuario = this.authService.getUsuarioActual();
    if (!usuario) return;
    const { data } = await this.supabase.client
      .from('lista_espera').select('*, mesas(*)')
      .eq('usuario_id', usuario.id).eq('estado', 'asignado').single();
    if (data?.mesas) {
      this.router.navigate(['/cliente/mesa'], { replaceUrl: true });
    }
  }

  async verificarPedido() {
    const mesa = this.mesaAsignada();
    if (!mesa) return;
    const { data } = await this.supabase.client
      .from('pedidos').select('*').eq('mesa_id', mesa.id)
      .not('estado', 'in', '("pagado")').order('fecha_creacion', { ascending: false }).limit(1).single();
    this.pedidoActual.set(data || null);
  }

  suscribirCambios() {
    this.canal = this.supabase.client
      .channel('home_cliente')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pedidos' },
        () => this.verificarPedido())
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'lista_espera' },
        () => { this.verificarMesa(); this.verificarPedido(); })
      .subscribe();
  }

  getColorEstado(estado: string): string {
    const colores: Record<string, string> = {
      esperando_mozo: 'warning', rechazado_mozo: 'danger', en_cocina: 'primary',
      listo: 'success', entregado: 'tertiary', pago_solicitado: 'medium',
    };
    return colores[estado] || 'medium';
  }

  getTextoEstado(estado: string): string {
    const textos: Record<string, string> = {
      esperando_mozo: 'Esperando confirmación del mozo',
      rechazado_mozo: 'Pedido rechazado — modificalo y reenvialo',
      en_cocina: 'En preparación', listo: 'Listo para entregar',
      entregado: 'Entregado — ¡buen provecho!', pago_solicitado: 'Cuenta solicitada',
    };
    return textos[estado] || estado;
  }

  ir(ruta: string) { this.router.navigate([ruta]); }
  async cerrarSesion() { await this.authService.logout(); }
}
