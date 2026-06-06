import { ChangeDetectionStrategy, Component, DestroyRef, inject, NgZone, OnInit, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonCard, IonCardHeader, IonCardTitle,
  IonCardSubtitle, IonCardContent, IonButton, IonIcon, IonSpinner, IonText, IonItem,
  IonLabel, IonBadge, IonButtons, IonBackButton,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { restaurantOutline, checkmarkDoneOutline } from 'ionicons/icons';
import { SupabaseService } from '../../../core/services/supabase';
import { LoadingComponent } from '../../../shared/components/loading/loading.component';
import { HapticsService } from '../../../core/services/haptics.service';
import { NotificacionesService } from '../../../core/services/notificaciones';
import { Pedido, PedidoItem } from '../../../core/models';
import { RealtimeChannel } from '@supabase/supabase-js';

interface PedidoUI extends Pedido {
  items_filtrados: PedidoItem[];
  _exito: string; _error: string; _enviando: boolean;
}

@Component({
  selector: 'app-pedidos',
  templateUrl: './pedidos.page.html',
  styleUrls: ['./pedidos.page.scss'],
  imports: [
    DatePipe, IonHeader, IonToolbar, IonTitle, IonContent, IonCard, IonCardHeader, IonCardTitle,
    IonCardSubtitle, IonCardContent, IonButton, IonIcon, IonSpinner, IonText, IonItem,
    IonLabel, IonBadge, IonButtons, IonBackButton, LoadingComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PedidosPage implements OnInit {
  private readonly supabase = inject(SupabaseService);
  private readonly haptics = inject(HapticsService);
  private readonly notificaciones = inject(NotificacionesService);
  private readonly ngZone = inject(NgZone);
  private readonly destroyRef = inject(DestroyRef);

  pedidos = signal<PedidoUI[]>([]);
  cargando = signal(false);

  private canal?: RealtimeChannel;

  constructor() {
    addIcons({ restaurantOutline, checkmarkDoneOutline });
    this.destroyRef.onDestroy(() => {
      if (this.canal) this.supabase.client.removeChannel(this.canal);
    });
  }

  async ngOnInit() { await this.cargarPedidos(); this.suscribirCambios(); }

  async cargarPedidos() {
    this.cargando.set(true);
    const { data } = await this.supabase.client
      .from('pedidos').select('*, mesas(numero), pedido_items(*)')
      .eq('estado', 'en_cocina').order('fecha_creacion', { ascending: true });
    this.pedidos.set(
      (data || [])
        .map(p => ({ ...p, items_filtrados: p.pedido_items.filter((i: PedidoItem) => i.tipo === 'platos'), _exito: '', _error: '', _enviando: false }) as PedidoUI)
        .filter(p => p.items_filtrados.length > 0)
    );
    this.cargando.set(false);
  }

  suscribirCambios() {
    this.canal = this.supabase.client
      .channel('pedidos_cocina')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pedidos' },
        async (payload) => this.ngZone.run(async () => {
          if ((payload.new as any)?.estado === 'en_cocina') {
            await this.notificaciones.enviar('Nuevo pedido en cocina', 'Hay un nuevo pedido para preparar.');
          }
          await this.cargarPedidos();
        }))
      .subscribe();
  }

  async marcarListo(pedido: PedidoUI) {
    this.pedidos.update(ps => ps.map(p => p.id === pedido.id ? { ...p, _enviando: true, _exito: '', _error: '' } : p));
    try {
      const { error } = await this.supabase.client
        .from('pedido_items').update({ estado: 'listo' }).eq('pedido_id', pedido.id).eq('tipo', 'platos');
      if (error) throw error;
      await this.verificarPedidoCompleto(pedido.id);
      this.pedidos.update(ps => ps.map(p => p.id === pedido.id ? { ...p, _exito: 'Productos listos para entregar.', _enviando: false } : p));
      setTimeout(() => this.ngZone.run(() => this.cargarPedidos()), 1500);
    } catch (e: unknown) {
      await this.haptics.error();
      this.pedidos.update(ps => ps.map(p => p.id === pedido.id ? { ...p, _error: (e as Error).message, _enviando: false } : p));
    }
  }

  async verificarPedidoCompleto(pedidoId: string) {
    const { data } = await this.supabase.client
      .from('pedido_items').select('estado').eq('pedido_id', pedidoId);
    if (data?.every(i => i.estado === 'listo')) {
      await this.supabase.client.from('pedidos').update({ estado: 'listo' }).eq('id', pedidoId);
    }
  }
}
