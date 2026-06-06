import { ChangeDetectionStrategy, Component, DestroyRef, inject, NgZone, OnInit, signal } from '@angular/core';
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
  private readonly ngZone = inject(NgZone);

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
        () => this.ngZone.run(() => this.cargarPedidos()))
      .subscribe();
  }

  getBadgeColor(estado: string): string {
    const colores: Record<string, string> = {
      esperando_mozo: 'warning', en_cocina: 'primary', listo: 'success', pago_solicitado: 'tertiary',
    };
    return colores[estado] || 'medium';
  }

  private setExito(id: string, msg: string) {
    this.pedidos.update(ps => ps.map(p => p.id === id ? { ...p, _exito: msg, _error: '' } : p));
    setTimeout(() => this.ngZone.run(() => this.cargarPedidos()), 1500);
  }

  private setError(id: string, e: unknown) {
    this.haptics.error();
    this.pedidos.update(ps => ps.map(p => p.id === id ? { ...p, _error: (e as Error).message, _exito: '' } : p));
  }

  async confirmar(pedido: PedidoUI) {
    try {
      const { error } = await this.supabase.client
        .from('pedidos').update({ estado: 'en_cocina' }).eq('id', pedido.id);
      if (error) throw error;
      this.notificaciones.enviarPorPerfil(['cocinero', 'cantinero', 'bartender'], 'Nuevo pedido', 'Hay un nuevo pedido para preparar.');
      this.setExito(pedido.id, 'Pedido confirmado y enviado a cocina/bar.');
    } catch (e: unknown) { this.setError(pedido.id, e); }
  }

  async rechazar(pedido: PedidoUI) {
    try {
      const { error } = await this.supabase.client
        .from('pedidos').update({ estado: 'rechazado_mozo' }).eq('id', pedido.id);
      if (error) throw error;
      if (pedido.usuario_id) {
        this.notificaciones.enviarAUsuario(pedido.usuario_id, 'Pedido rechazado', 'El mozo rechazó tu pedido. Podés modificarlo y reenviarlo.');
      }
      this.setExito(pedido.id, 'Pedido rechazado. El cliente deberá modificarlo.');
    } catch (e: unknown) { this.setError(pedido.id, e); }
  }

  async entregar(pedido: PedidoUI) {
    try {
      const { error } = await this.supabase.client
        .from('pedidos').update({ estado: 'entregado' }).eq('id', pedido.id);
      if (error) throw error;
      this.setExito(pedido.id, 'Pedido entregado al cliente.');
    } catch (e: unknown) { this.setError(pedido.id, e); }
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
      this.notificaciones.enviarPorPerfil(['dueño', 'supervisor'], 'Pago confirmado', 'El mozo confirmó un pago y liberó una mesa.');
      this.setExito(pedido.id, 'Pago confirmado. Mesa liberada.');
    } catch (e: unknown) { this.setError(pedido.id, e); }
  }
}
