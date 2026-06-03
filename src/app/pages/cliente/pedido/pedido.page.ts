import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonFooter, IonCard, IonCardHeader,
  IonCardTitle, IonCardSubtitle, IonCardContent, IonSpinner, IonButtons, IonBackButton,
  IonSegment, IonSegmentButton, IonLabel, IonButton, IonIcon, IonText,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { removeCircleOutline, addCircleOutline, sendOutline, timeOutline, cartOutline, hourglassOutline } from 'ionicons/icons';
import { AuthService } from '../../../core/services/auth';
import { SupabaseService } from '../../../core/services/supabase';
import { HapticsService } from '../../../core/services/haptics.service';
import { Plato, Bebida, Producto } from '../../../core/models';

@Component({
  selector: 'app-pedido',
  templateUrl: './pedido.page.html',
  styleUrls: ['./pedido.page.scss'],
  imports: [
    FormsModule, IonHeader, IonToolbar, IonTitle, IonContent, IonFooter, IonCard,
    IonCardHeader, IonCardTitle, IonCardSubtitle, IonCardContent, IonSpinner, IonButtons,
    IonBackButton, IonSegment, IonSegmentButton, IonLabel, IonButton, IonIcon, IonText,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PedidoPage implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly supabase = inject(SupabaseService);
  readonly router = inject(Router);
  private readonly haptics = inject(HapticsService);

  seccion = signal<'platos' | 'bebidas'>('platos');
  items = signal<Producto[]>([]);
  todosLosItems = signal<Producto[]>([]);
  cargando = signal(false);
  enviando = signal(false);
  pedidoExistente = signal<{ id: string; estado: string; pedido_items?: any[] } | null>(null);
  pedidoRechazadoId = signal<string | null>(null);
  private mesaId = '';

  itemsSeleccionados = computed(() => this.todosLosItems().filter(i => i._cantidad > 0));
  totalPedido = computed(() => this.itemsSeleccionados().reduce((sum, i) => sum + i.precio * i._cantidad, 0));
  tiempoTotal = computed(() =>
    this.itemsSeleccionados().length > 0
      ? Math.max(...this.itemsSeleccionados().map(i => i.tiempo_elaboracion))
      : 0
  );

  constructor() {
    addIcons({ removeCircleOutline, addCircleOutline, sendOutline, timeOutline, cartOutline, hourglassOutline });
  }

  async ngOnInit() {
    await this.obtenerMesa();
    await this.cargarItems();
    await this.verificarPedidoActivo();
  }

  async obtenerMesa() {
    const usuario = this.authService.getUsuarioActual();
    if (!usuario) return;
    const { data } = await this.supabase.client
      .from('lista_espera').select('mesa_id').eq('usuario_id', usuario.id).eq('estado', 'asignado').single();
    this.mesaId = data?.mesa_id || '';
  }

  async verificarPedidoActivo() {
    if (!this.mesaId) return;
    const { data } = await this.supabase.client
      .from('pedidos').select('id, estado, pedido_items(*)')
      .eq('mesa_id', this.mesaId)
      .in('estado', ['esperando_mozo', 'rechazado_mozo', 'en_cocina', 'listo', 'pago_solicitado'])
      .order('fecha_creacion', { ascending: false }).limit(1).maybeSingle();
    this.pedidoExistente.set(data);
    if (data?.estado === 'rechazado_mozo') {
      this.pedidoRechazadoId.set(data.id);
      this.todosLosItems.update(todos => todos.map(item => {
        const prevItem = (data.pedido_items || []).find((i: any) => i.producto_id === item.id);
        return prevItem ? { ...item, _cantidad: prevItem.cantidad } : item;
      }));
      this.items.update(items => items.map(i => ({
        ...i, _cantidad: this.todosLosItems().find(t => t.id === i.id)?._cantidad || 0,
      })));
    }
  }

  async cambiarSeccion() { await this.cargarItems(); }

  async cargarItems() {
    this.cargando.set(true);
    const tabla = this.seccion() === 'platos' ? 'platos' : 'bebidas';
    const { data } = await this.supabase.client.from(tabla).select('*').order('nombre', { ascending: true });
    const tipo = this.seccion();
    const nuevoItems: Producto[] = (data || []).map(item => {
      const existente = this.todosLosItems().find(i => i.id === item.id);
      return { ...(item as Plato | Bebida), _cantidad: existente?._cantidad || 0, _tipo: tipo };
    });
    this.items.set(nuevoItems);
    this.todosLosItems.update(todos => [
      ...todos.filter(i => i._tipo !== tipo),
      ...nuevoItems,
    ]);
    this.cargando.set(false);
  }

  cambiarCantidad(item: Producto, delta: number) {
    const nuevaCantidad = Math.max(0, (item._cantidad || 0) + delta);
    item._cantidad = nuevaCantidad;
    this.todosLosItems.update(todos => todos.map(i => i.id === item.id ? { ...i, _cantidad: nuevaCantidad } : i));
  }

  async confirmarPedido() {
    if (!this.mesaId || !this.itemsSeleccionados().length) return;
    const estadoActual = this.pedidoExistente()?.estado ?? '';
    if (['esperando_mozo', 'pago_solicitado'].includes(estadoActual)) return;
    const usuario = this.authService.getUsuarioActual();
    try {
      this.enviando.set(true);
      const rechazadoId = this.pedidoRechazadoId();
      if (rechazadoId) {
        const { error } = await this.supabase.client.from('pedidos')
          .update({ estado: 'esperando_mozo', total: this.totalPedido() }).eq('id', rechazadoId);
        if (error) throw error;
        await this.supabase.client.from('pedido_items').delete().eq('pedido_id', rechazadoId);
        const { error: eItems } = await this.supabase.client.from('pedido_items').insert(
          this.itemsSeleccionados().map(i => ({
            pedido_id: rechazadoId, producto_id: i.id, tipo: i._tipo, nombre: i.nombre,
            precio: i.precio, cantidad: i._cantidad, tiempo_elaboracion: i.tiempo_elaboracion, estado: 'pendiente',
          }))
        );
        if (eItems) throw eItems;
      } else {
        const { data: pedido, error } = await this.supabase.client.from('pedidos').insert({
          mesa_id: this.mesaId, usuario_id: usuario?.id, estado: 'esperando_mozo', total: this.totalPedido(),
        }).select().single();
        if (error) throw error;
        const { error: eItems } = await this.supabase.client.from('pedido_items').insert(
          this.itemsSeleccionados().map(i => ({
            pedido_id: pedido.id, producto_id: i.id, tipo: i._tipo, nombre: i.nombre,
            precio: i.precio, cantidad: i._cantidad, tiempo_elaboracion: i.tiempo_elaboracion, estado: 'pendiente',
          }))
        );
        if (eItems) throw eItems;
      }
      this.router.navigate(['/cliente/mesa'], { replaceUrl: true });
    } catch (e: unknown) {
      await this.haptics.error();
      console.error(e);
    } finally {
      this.enviando.set(false);
    }
  }
}
