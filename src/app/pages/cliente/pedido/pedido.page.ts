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
  IonItem,
  IonNote,
  IonRow,
  IonCol,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { removeCircleOutline, addCircleOutline } from 'ionicons/icons';
import { AuthService } from '../../../core/services/auth';
import { SupabaseService } from '../../../core/services/supabase';

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
    IonItem,
    IonNote,
    IonRow,
    IonCol,
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

  constructor(
    private authService: AuthService,
    private supabase: SupabaseService,
    private router: Router,
  ) {
    addIcons({ removeCircleOutline, addCircleOutline });
  }

  async ngOnInit() {
    this.usuario = this.authService.getUsuarioActual();
    await this.obtenerMesa();
    await this.cargarItems();
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

    try {
      this.enviando = true;

      // Crear pedido
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

      // Insertar items del pedido
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

      this.router.navigate(['/cliente/home']);
    } catch (error: any) {
      console.error(error);
    } finally {
      this.enviando = false;
    }
  }
}
