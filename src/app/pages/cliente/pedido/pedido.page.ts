import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonFooter, IonSpinner, IonButtons, IonBackButton,
  IonSegment, IonSegmentButton, IonLabel, IonButton, IonIcon, IonText,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  removeCircleOutline, addCircleOutline, sendOutline, timeOutline, cartOutline,
  hourglassOutline, informationCircleOutline, alertCircleOutline,
} from 'ionicons/icons';
import { AuthService } from '../../../core/services/auth';
import { SupabaseService } from '../../../core/services/supabase';
import { HapticsService } from '../../../core/services/haptics.service';
import { NotificacionesService } from '../../../core/services/notificaciones';
import { LoadingComponent } from '../../../shared/components/loading/loading.component';
import { Plato, Bebida, Producto } from '../../../core/models';

@Component({
  selector: 'app-pedido',
  templateUrl: './pedido.page.html',
  styleUrls: ['./pedido.page.scss'],
  imports: [
    FormsModule, IonHeader, IonToolbar, IonTitle, IonContent, IonFooter, IonSpinner, IonButtons,
    IonBackButton, IonSegment, IonSegmentButton, IonLabel, IonButton, IonIcon, IonText, LoadingComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PedidoPage implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly supabase = inject(SupabaseService);
  readonly router = inject(Router);
  private readonly haptics = inject(HapticsService);
  private readonly notificaciones = inject(NotificacionesService);

  seccion = signal<'platos' | 'bebidas'>('platos');
  categoria = signal<'entrada' | 'principal' | 'postre'>('entrada');
  platos = signal<Producto[]>([]);
  bebidas = signal<Producto[]>([]);
  cargando = signal(false);
  enviando = signal(false);
  pedidoExistente = signal<{ id: string; estado: string; pedido_items?: any[] } | null>(null);
  pedidoRechazadoId = signal<string | null>(null);
  private mesaId = '';

  readonly itemsFiltrados = computed(() => {
    if (this.seccion() === 'bebidas') return this.bebidas();
    return this.platos().filter(p => (p as any).categoria === this.categoria());
  });

  readonly todosLosItems = computed(() => [...this.platos(), ...this.bebidas()]);
  readonly itemsSeleccionados = computed(() => this.todosLosItems().filter(i => i._cantidad > 0));
  readonly totalPedido = computed(() =>
    this.itemsSeleccionados().reduce((sum, i) => sum + i.precio * i._cantidad, 0)
  );
  readonly tiempoTotal = computed(() =>
    this.itemsSeleccionados().length > 0
      ? Math.max(...this.itemsSeleccionados().map(i => i.tiempo_elaboracion))
      : 0
  );
  readonly estadoBloqueado = computed(() =>
    this.pedidoExistente()?.estado === 'pago_solicitado'
  );
  readonly puedeModificar = computed(() =>
    this.pedidoExistente()?.estado === 'esperando_mozo'
  );

  constructor() {
    addIcons({
      removeCircleOutline, addCircleOutline, sendOutline, timeOutline, cartOutline,
      hourglassOutline, informationCircleOutline, alertCircleOutline,
    });
  }

  async ngOnInit() {
    await this.obtenerMesa();
    await this.cargarItems();
    await this.verificarPedidoActivo();
  }

  async obtenerMesa() {
    const usuario = this.authService.getUsuarioActual();
    if (!usuario) return;
    if (usuario.perfil === 'anonimo') {
      this.mesaId = usuario.mesa_id || '';
      return;
    }
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
    if (data?.estado === 'rechazado_mozo' || data?.estado === 'esperando_mozo') {
      this.pedidoRechazadoId.set(data.id);
      const prevItems = data.pedido_items || [];
      this.platos.update(ps => ps.map(p => {
        const prev = prevItems.find((i: any) => i.producto_id === p.id);
        return prev ? { ...p, _cantidad: prev.cantidad } : p;
      }));
      this.bebidas.update(bs => bs.map(b => {
        const prev = prevItems.find((i: any) => i.producto_id === b.id);
        return prev ? { ...b, _cantidad: prev.cantidad } : b;
      }));
    }
  }

  async cargarItems() {
    this.cargando.set(true);
    const [{ data: platosData }, { data: bebidasData }] = await Promise.all([
      this.supabase.client.from('platos').select('*').order('nombre', { ascending: true }),
      this.supabase.client.from('bebidas').select('*').order('nombre', { ascending: true }),
    ]);
    this.platos.set((platosData || []).map(p => ({ ...(p as Plato), _cantidad: 0, _tipo: 'platos' }) as Producto));
    this.bebidas.set((bebidasData || []).map(b => ({ ...(b as Bebida), _cantidad: 0, _tipo: 'bebidas' }) as Producto));
    this.cargando.set(false);
  }

  cambiarCantidad(item: Producto, delta: number) {
    const nuevaCantidad = Math.max(0, (item._cantidad || 0) + delta);
    if (item._tipo === 'platos') {
      this.platos.update(ps => ps.map(p => p.id === item.id ? { ...p, _cantidad: nuevaCantidad } : p));
    } else {
      this.bebidas.update(bs => bs.map(b => b.id === item.id ? { ...b, _cantidad: nuevaCantidad } : b));
    }
  }

  async confirmarPedido() {
    if (!this.mesaId || !this.itemsSeleccionados().length) return;
    const estadoActual = this.pedidoExistente()?.estado ?? '';
    if (estadoActual === 'pago_solicitado') return;
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
          mesa_id: this.mesaId, usuario_id: usuario?.id || null, estado: 'esperando_mozo', total: this.totalPedido(),
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
      this.notificaciones.enviarPorPerfil(['mozo'], 'Nuevo pedido', 'Un cliente realizó un pedido y espera confirmación.');
      const destino = usuario?.perfil === 'anonimo' ? '/cliente/anonimo-mesa' : '/cliente/mesa';
      this.router.navigate([destino], { replaceUrl: true });
    } catch (e: unknown) {
      await this.haptics.error();
      console.error(e);
    } finally {
      this.enviando.set(false);
    }
  }
}
