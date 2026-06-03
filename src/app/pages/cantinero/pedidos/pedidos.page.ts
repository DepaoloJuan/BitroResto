import { ChangeDetectionStrategy, Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonCard, IonCardHeader, IonCardTitle,
  IonCardSubtitle, IonCardContent, IonButton, IonIcon, IonSpinner, IonText, IonItem,
  IonLabel, IonBadge, IonButtons, IonBackButton,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { wineOutline, checkmarkDoneOutline } from 'ionicons/icons';
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
  selector: 'app-pedidos-cantinero',
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
  private readonly destroyRef = inject(DestroyRef);

  pedidos = signal<PedidoUI[]>([]);
  cargando = signal(false);

  private canal?: RealtimeChannel;

  constructor() {
    addIcons({ wineOutline, checkmarkDoneOutline });
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
        .map(p => ({ ...p, items_filtrados: p.pedido_items.filter((i: PedidoItem) => i.tipo === 'bebidas'), _exito: '', _error: '', _enviando: false }) as PedidoUI)
        .filter(p => p.items_filtrados.length > 0)
    );
    this.cargando.set(false);
  }

  suscribirCambios() {
    this.canal = this.supabase.client
      .channel('pedidos_bar')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pedidos' },
        () => this.cargarPedidos())
      .subscribe();
  }

  async marcarListo(pedido: PedidoUI) {
    pedido._enviando = true;
    pedido._exito = '';
    pedido._error = '';
    try {
      const { error } = await this.supabase.client
        .from('pedido_items').update({ estado: 'listo' }).eq('pedido_id', pedido.id).eq('tipo', 'bebidas');
      if (error) throw error;
      await this.verificarPedidoCompleto(pedido.id);
      pedido._exito = 'Bebidas listas para entregar.';
      setTimeout(() => this.cargarPedidos(), 1500);
    } catch (e: unknown) { await this.haptics.error(); pedido._error = (e as Error).message; }
    finally { pedido._enviando = false; }
  }

  async verificarPedidoCompleto(pedidoId: string) {
    const { data } = await this.supabase.client
      .from('pedido_items').select('estado').eq('pedido_id', pedidoId);
    if (data?.every(i => i.estado === 'listo')) {
      await this.supabase.client.from('pedidos').update({ estado: 'listo' }).eq('id', pedidoId);
      await this.notificaciones.enviar('Pedido listo', 'Un pedido está completo y listo para entregar.');
    }
  }
}
