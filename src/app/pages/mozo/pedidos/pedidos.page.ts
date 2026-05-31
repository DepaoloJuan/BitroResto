import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonCard,
  IonCardHeader, IonCardTitle, IonCardSubtitle, IonCardContent,
  IonButton, IonIcon, IonSpinner, IonText, IonItem, IonLabel,
  IonNote, IonBadge, IonRow, IonCol, IonButtons, IonBackButton
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  checkmarkOutline, closeOutline, receiptOutline,
  checkmarkDoneOutline, cashOutline
} from 'ionicons/icons';
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
    IonNote, IonBadge, IonRow, IonCol, IonButtons, IonBackButton
  ]
})
export class PedidosPage implements OnInit {
  pedidos: any[] = [];
  cargando = false;

  constructor(private supabase: SupabaseService) {
    addIcons({ checkmarkOutline, closeOutline, receiptOutline, checkmarkDoneOutline, cashOutline });
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
      .in('estado', ['esperando_mozo', 'en_cocina', 'listo', 'pago_solicitado'])
      .order('fecha_creacion', { ascending: true });
    this.pedidos = (data || []).map(p => ({ ...p, _exito: '', _error: '' }));
    this.cargando = false;
  }

  suscribirCambios() {
    this.supabase.client
      .channel('pedidos_mozo')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'pedidos'
      }, () => this.cargarPedidos())
      .subscribe();
  }

  getBadgeColor(estado: string) {
    const colores: Record<string, string> = {
      'esperando_mozo': 'warning',
      'en_cocina': 'primary',
      'listo': 'success',
      'pago_solicitado': 'tertiary'
    };
    return colores[estado] || 'medium';
  }

  async confirmar(pedido: any) {
    try {
      const { error } = await this.supabase.client
        .from('pedidos')
        .update({ estado: 'en_cocina' })
        .eq('id', pedido.id);
      if (error) throw error;
      pedido._exito = 'Pedido confirmado y enviado a cocina/bar.';
      setTimeout(() => this.cargarPedidos(), 1500);
    } catch (e: any) {
      pedido._error = e.message;
    }
  }

  async rechazar(pedido: any) {
    try {
      const { error } = await this.supabase.client
        .from('pedidos')
        .update({ estado: 'rechazado_mozo' })
        .eq('id', pedido.id);
      if (error) throw error;
      pedido._exito = 'Pedido rechazado. El cliente deberá modificarlo.';
      setTimeout(() => this.cargarPedidos(), 1500);
    } catch (e: any) {
      pedido._error = e.message;
    }
  }

  async entregar(pedido: any) {
    try {
      const { error } = await this.supabase.client
        .from('pedidos')
        .update({ estado: 'entregado' })
        .eq('id', pedido.id);
      if (error) throw error;
      pedido._exito = 'Pedido entregado al cliente.';
      setTimeout(() => this.cargarPedidos(), 1500);
    } catch (e: any) {
      pedido._error = e.message;
    }
  }

  async confirmarPago(pedido: any) {
    try {
      const { error } = await this.supabase.client
        .from('pedidos')
        .update({ estado: 'pagado' })
        .eq('id', pedido.id);
      if (error) throw error;

      await this.supabase.client
        .from('mesas')
        .update({ estado: 'disponible' })
        .eq('id', pedido.mesa_id);

      await this.supabase.client
        .from('lista_espera')
        .update({ estado: 'finalizado' })
        .eq('mesa_id', pedido.mesa_id);

      pedido._exito = 'Pago confirmado. Mesa liberada.';
      setTimeout(() => this.cargarPedidos(), 1500);
    } catch (e: any) {
      pedido._error = e.message;
    }
  }
}
