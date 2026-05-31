import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonCard,
  IonCardHeader, IonCardTitle, IonCardSubtitle, IonCardContent,
  IonButton, IonIcon, IonSpinner, IonText, IonItem, IonLabel,
  IonBadge, IonButtons, IonBackButton
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { restaurantOutline, checkmarkDoneOutline } from 'ionicons/icons';
import { SupabaseService } from '../../../core/services/supabase';

@Component({
  selector: 'app-pedidos',
  templateUrl: './pedidos.page.html',
  styleUrls: ['./pedidos.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonHeader, IonToolbar, IonTitle, IonContent, IonCard,
    IonCardHeader, IonCardTitle, IonCardSubtitle, IonCardContent,
    IonButton, IonIcon, IonSpinner, IonText, IonItem, IonLabel,
    IonBadge, IonButtons, IonBackButton
  ]
})
export class PedidosPage implements OnInit {
  pedidos: any[] = [];
  cargando = false;

  constructor(private supabase: SupabaseService) {
    addIcons({ restaurantOutline, checkmarkDoneOutline });
  }

  async ngOnInit() {
    await this.cargarPedidos();
    this.suscribirCambios();
  }

  async cargarPedidos() {
    this.cargando = true;
    const { data } = await this.supabase.client
      .from('pedidos')
      .select('*, mesas(numero), pedido_items(*)')
      .eq('estado', 'en_cocina')
      .order('fecha_creacion', { ascending: true });

    this.pedidos = (data || []).map(p => ({
      ...p,
      items_filtrados: p.pedido_items.filter((i: any) => i.tipo === 'platos'),
      _exito: '',
      _error: '',
      _enviando: false
    })).filter(p => p.items_filtrados.length > 0);

    this.cargando = false;
  }

  suscribirCambios() {
    this.supabase.client
      .channel('pedidos_cocina')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'pedidos'
      }, () => this.cargarPedidos())
      .subscribe();
  }

  async marcarListo(pedido: any) {
    pedido._enviando = true;
    pedido._exito = '';
    pedido._error = '';
    try {
      const { error } = await this.supabase.client
        .from('pedido_items')
        .update({ estado: 'listo' })
        .eq('pedido_id', pedido.id)
        .eq('tipo', 'platos');

      if (error) throw error;

      await this.verificarPedidoCompleto(pedido.id);

      pedido._exito = 'Productos listos para entregar.';
      setTimeout(() => this.cargarPedidos(), 1500);
    } catch (e: any) {
      pedido._error = e.message;
    } finally {
      pedido._enviando = false;
    }
  }

  async verificarPedidoCompleto(pedidoId: string) {
    const { data } = await this.supabase.client
      .from('pedido_items')
      .select('estado')
      .eq('pedido_id', pedidoId);

    const todosListos = data?.every(i => i.estado === 'listo');
    if (todosListos) {
      await this.supabase.client
        .from('pedidos')
        .update({ estado: 'listo' })
        .eq('id', pedidoId);
    }
  }
}
