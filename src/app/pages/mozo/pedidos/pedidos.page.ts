import { ChangeDetectionStrategy, Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonCard, IonCardHeader, IonCardTitle,
  IonCardSubtitle, IonCardContent, IonButton, IonIcon, IonText, IonItem, IonLabel,
  IonNote, IonBadge, IonRow, IonCol, IonButtons, IonBackButton,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { checkmarkOutline, closeOutline, receiptOutline, checkmarkDoneOutline, cashOutline } from 'ionicons/icons';
import { SupabaseService } from '../../../core/services/supabase';
import { LoadingComponent } from '../../../shared/components/loading/loading.component';
import { HapticsService } from '../../../core/services/haptics.service';
import { NotificacionesService } from '../../../core/services/notificaciones';
import { Pedido } from '../../../core/models';
import { RealtimeChannel } from '@supabase/supabase-js';

interface PedidoUI extends Pedido { _exito: string; _error: string; }

@Component({
  selector: 'app-pedidos',
  templateUrl: './pedidos.page.html',
  styleUrls: ['./pedidos.page.scss'],
  imports: [
    IonHeader, IonToolbar, IonTitle, IonContent, IonCard, IonCardHeader, IonCardTitle,
    IonCardSubtitle, IonCardContent, IonButton, IonIcon, IonText, IonItem, IonLabel,
    IonNote, IonBadge, IonRow, IonCol, IonButtons, IonBackButton, LoadingComponent, DatePipe,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PedidosPage implements OnInit {
  private readonly supabase = inject(SupabaseService);
  private readonly haptics = inject(HapticsService);
  private readonly notificaciones = inject(NotificacionesService);
  private readonly destroyRef = inject(DestroyRef);

  pedidos = signal<PedidoUI[]>([]);
  cargando = signal(false);

  private canal?: RealtimeChannel;

  constructor() {
    addIcons({ checkmarkOutline, closeOutline, receiptOutline, checkmarkDoneOutline, cashOutline });
    this.destroyRef.onDestroy(() => {
      if (this.canal) this.supabase.client.removeChannel(this.canal);
    });
  }

  async ngOnInit() {
    await this.cargarPedidos();
    this.suscribirCambios();
  }

  async cargarPedidos() {
    this.cargando.set(true);
    const { data } = await this.supabase.client
      .from('pedidos').select('*, mesas(numero), pedido_items(*)')
      .in('estado', ['esperando_mozo', 'en_cocina', 'listo', 'pago_solicitado'])
      .order('fecha_creacion', { ascending: true });
    this.pedidos.set((data || []).map(p => ({ ...p, _exito: '', _error: '' }) as PedidoUI));
    this.cargando.set(false);
  }

  suscribirCambios() {
    this.canal = this.supabase.client
      .channel('pedidos_mozo')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pedidos' },
        () => this.cargarPedidos())
      .subscribe();
  }

  getBadgeColor(estado: string): string {
    const colores: Record<string, string> = {
      esperando_mozo: 'warning', en_cocina: 'primary', listo: 'success', pago_solicitado: 'tertiary',
    };
    return colores[estado] || 'medium';
  }

  async confirmar(pedido: PedidoUI) {
    try {
      const { error } = await this.supabase.client
        .from('pedidos').update({ estado: 'en_cocina' }).eq('id', pedido.id);
      if (error) throw error;
      await this.notificaciones.enviar('Nuevo pedido en cocina', 'Hay un nuevo pedido para preparar.');
      pedido._exito = 'Pedido confirmado y enviado a cocina/bar.';
      setTimeout(() => this.cargarPedidos(), 1500);
    } catch (e: unknown) { await this.haptics.error(); pedido._error = (e as Error).message; }
  }

  async rechazar(pedido: PedidoUI) {
    try {
      const { error } = await this.supabase.client
        .from('pedidos').update({ estado: 'rechazado_mozo' }).eq('id', pedido.id);
      if (error) throw error;
      await this.notificaciones.enviar('Pedido rechazado', 'El mozo rechazó tu pedido. Podés modificarlo y reenviarlo.');
      pedido._exito = 'Pedido rechazado. El cliente deberá modificarlo.';
      setTimeout(() => this.cargarPedidos(), 1500);
    } catch (e: unknown) { await this.haptics.error(); pedido._error = (e as Error).message; }
  }

  async entregar(pedido: PedidoUI) {
    try {
      const { error } = await this.supabase.client
        .from('pedidos').update({ estado: 'entregado' }).eq('id', pedido.id);
      if (error) throw error;
      pedido._exito = 'Pedido entregado al cliente.';
      setTimeout(() => this.cargarPedidos(), 1500);
    } catch (e: unknown) { pedido._error = (e as Error).message; }
  }

  async confirmarPago(pedido: PedidoUI) {
    try {
      const { error: e1 } = await this.supabase.client
        .from('pedidos').update({ estado: 'pagado' }).eq('mesa_id', pedido.mesa_id)
        .not('estado', 'in', '("pagado","cancelado")');
      if (e1) throw e1;
      const { error: e2 } = await this.supabase.client
        .from('mesas').update({ estado: 'disponible' }).eq('id', pedido.mesa_id);
      if (e2) throw e2;
      const { error: e3 } = await this.supabase.client
        .from('lista_espera').update({ estado: 'finalizado' }).eq('mesa_id', pedido.mesa_id).eq('estado', 'asignado');
      if (e3) throw e3;
      await this.notificaciones.enviar('Pago confirmado', 'Se confirmó un pago y se liberó una mesa.');
      pedido._exito = 'Pago confirmado. Mesa liberada.';
      setTimeout(() => this.cargarPedidos(), 1500);
    } catch (e: unknown) { pedido._error = (e as Error).message; }
  }
}
