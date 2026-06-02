import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonFooter,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardSubtitle,
  IonCardContent,
  IonSpinner,
  IonButtons,
  IonBackButton,
  IonSegment,
  IonSegmentButton,
  IonLabel,
  IonButton,
  IonIcon,
  IonText,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { removeCircleOutline, addCircleOutline, sendOutline, timeOutline, cartOutline, hourglassOutline } from 'ionicons/icons';
import { AuthService } from '../../../core/services/auth';
import { SupabaseService } from '../../../core/services/supabase';
import { HapticsService } from '../../../core/services/haptics.service';
import { NotificacionesService } from '../../../core/services/notificaciones';

@Component({
  selector: 'app-pedido',
  templateUrl: './pedido.page.html',
  styleUrls: ['./pedido.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonFooter,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardSubtitle,
    IonCardContent,
    IonSpinner,
    IonButtons,
    IonBackButton,
    IonSegment,
    IonSegmentButton,
    IonLabel,
    IonButton,
    IonIcon,
    IonText,
  ],
})
export class PedidoPage implements OnInit {
  seccion = 'platos';
  items: any[] = [];
  todosLosItems: any[] = [];
  cargando = false;
  enviando = false;
  usuario: any;
  mesaId: string = '';
  pedidoExistente: any = null;
  pedidoRechazadoId: string | null = null;

  constructor(
    private authService: AuthService,
    private supabase: SupabaseService,
    public router: Router,
    private haptics: HapticsService,
    private notificaciones: NotificacionesService,
  ) {
    addIcons({ removeCircleOutline, addCircleOutline, sendOutline, timeOutline, cartOutline, hourglassOutline });
  }

  async ngOnInit() {
    this.usuario = this.authService.getUsuarioActual();
    await this.obtenerMesa();
    await this.cargarItems();
    await this.verificarPedidoActivo();
  }

  async obtenerMesa() {
    const { data } = await this.supabase.client
      .from('lista_espera')
      .select('mesa_id')
      .eq('usuario_id', this.usuario.id)
      .eq('estado', 'asignado')
      .single();
    this.mesaId = data?.mesa_id || '';
  }

  async verificarPedidoActivo() {
    if (!this.mesaId) return;

    const { data } = await this.supabase.client
      .from('pedidos')
      .select('id, estado, pedido_items(*)')
      .eq('mesa_id', this.mesaId)
      .in('estado', ['esperando_mozo', 'rechazado_mozo'])
      .order('fecha_creacion', { ascending: false })
      .limit(1)
      .maybeSingle();

    this.pedidoExistente = data;

    if (data?.estado === 'rechazado_mozo') {
      this.pedidoRechazadoId = data.id;
      for (const item of data.pedido_items || []) {
        const idx = this.todosLosItems.findIndex(i => i.id === item.producto_id);
        if (idx >= 0) {
          this.todosLosItems[idx]._cantidad = item.cantidad;
        }
      }
      // Sincronizar items visibles con las cantidades precargadas
      this.items = this.items.map(i => ({
        ...i,
        _cantidad: this.todosLosItems.find(t => t.id === i.id)?._cantidad || 0,
      }));
    }
  }

  async cambiarSeccion() {
    await this.cargarItems();
  }

  async cargarItems() {
    this.cargando = true;
    const tabla = this.seccion === 'platos' ? 'platos' : 'bebidas';
    const { data } = await this.supabase.client
      .from(tabla)
      .select('*')
      .order('nombre', { ascending: true });

    // Mantener cantidades previas
    this.items = (data || []).map((item) => {
      const existente = this.todosLosItems.find((i) => i.id === item.id);
      return {
        ...item,
        _cantidad: existente?._cantidad || 0,
        _tipo: this.seccion,
      };
    });

    // Actualizar lista global
    this.todosLosItems = [
      ...this.todosLosItems.filter((i) => i._tipo !== this.seccion),
      ...this.items,
    ];

    this.cargando = false;
  }

  cambiarCantidad(item: any, delta: number) {
    item._cantidad = Math.max(0, (item._cantidad || 0) + delta);
    const idx = this.todosLosItems.findIndex((i) => i.id === item.id);
    if (idx >= 0) this.todosLosItems[idx]._cantidad = item._cantidad;
  }

  get itemsSeleccionados() {
    return this.todosLosItems.filter((i) => i._cantidad > 0);
  }

  get totalPedido() {
    return this.itemsSeleccionados.reduce(
      (sum, i) => sum + i.precio * i._cantidad,
      0,
    );
  }

  get tiempoTotal() {
    return this.itemsSeleccionados.length > 0
      ? Math.max(...this.itemsSeleccionados.map((i) => i.tiempo_elaboracion))
      : 0;
  }

  async confirmarPedido() {
    if (!this.mesaId || this.itemsSeleccionados.length === 0) return;
    if (this.pedidoExistente?.estado === 'esperando_mozo') return;

    try {
      this.enviando = true;

      if (this.pedidoRechazadoId) {
        // Actualizar el pedido rechazado existente
        const { error: errorPedido } = await this.supabase.client
          .from('pedidos')
          .update({ estado: 'esperando_mozo', total: this.totalPedido })
          .eq('id', this.pedidoRechazadoId);

        if (errorPedido) throw errorPedido;

        // Eliminar items anteriores
        await this.supabase.client
          .from('pedido_items')
          .delete()
          .eq('pedido_id', this.pedidoRechazadoId);

        // Insertar items nuevos
        const items = this.itemsSeleccionados.map((i) => ({
          pedido_id: this.pedidoRechazadoId,
          producto_id: i.id,
          tipo: i._tipo,
          nombre: i.nombre,
          precio: i.precio,
          cantidad: i._cantidad,
          tiempo_elaboracion: i.tiempo_elaboracion,
          estado: 'pendiente',
        }));

        const { error: errorItems } = await this.supabase.client
          .from('pedido_items')
          .insert(items);

        if (errorItems) throw errorItems;

      } else {
        // Crear pedido nuevo (flujo normal)
        const { data: pedido, error } = await this.supabase.client
          .from('pedidos')
          .insert({
            mesa_id: this.mesaId,
            usuario_id: this.usuario.id,
            estado: 'esperando_mozo',
            total: this.totalPedido,
          })
          .select()
          .single();

        if (error) throw error;

        const items = this.itemsSeleccionados.map((i) => ({
          pedido_id: pedido.id,
          producto_id: i.id,
          tipo: i._tipo,
          nombre: i.nombre,
          precio: i.precio,
          cantidad: i._cantidad,
          tiempo_elaboracion: i.tiempo_elaboracion,
          estado: 'pendiente',
        }));

        const { error: errorItems } = await this.supabase.client
          .from('pedido_items')
          .insert(items);

        if (errorItems) throw errorItems;
      }

      await this.notificaciones.enviar('Nuevo pedido', 'Hay un nuevo pedido esperando confirmación.');
      this.router.navigate(['/cliente/mesa'], { replaceUrl: true });
    } catch (error: any) {
      await this.haptics.error();
      console.error(error);
    } finally {
      this.enviando = false;
    }
  }
}
