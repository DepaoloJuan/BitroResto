import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardSubtitle,
  IonCardContent,
  IonButton,
  IonIcon,
  IonSpinner,
  IonText,
  IonItem,
  IonLabel,
  IonNote,
  IonButtons,
  IonBackButton,
  IonRadioGroup,
  IonRadio,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { cashOutline, giftOutline, hourglassOutline } from 'ionicons/icons';
import { AuthService } from '../../../core/services/auth';
import { SupabaseService } from '../../../core/services/supabase';
import { LoadingComponent } from '../../../shared/components/loading/loading.component';
import { HapticsService } from '../../../core/services/haptics.service';
import { NotificacionesService } from '../../../core/services/notificaciones';

@Component({
  selector: 'app-cuenta',
  templateUrl: './cuenta.page.html',
  styleUrls: ['./cuenta.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardSubtitle,
    IonCardContent,
    IonButton,
    IonIcon,
    IonSpinner,
    IonText,
    IonItem,
    IonLabel,
    IonNote,
    IonButtons,
    IonBackButton,
    IonRadioGroup,
    IonRadio,
    LoadingComponent,
  ],
})
export class CuentaPage implements OnInit {
  usuario: any;
  mesaId = '';
  pedido: any = null;
  descuento = 0;
  propinaPorcentaje: number = 0;
  cargando = false;
  enviando = false;
  errorGeneral = '';

  constructor(
    private authService: AuthService,
    private supabase: SupabaseService,
    private router: Router,
    private haptics: HapticsService,
    private notificaciones: NotificacionesService,
  ) {
    addIcons({ cashOutline, giftOutline, hourglassOutline });
  }

  async ngOnInit() {
    this.usuario = this.authService.getUsuarioActual();
    await this.obtenerMesa();
    await this.cargarPedido();
    await this.cargarDescuento();
    this.suscribirCambios();
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

  async cargarPedido() {
    this.cargando = true;
    const { data } = await this.supabase.client
      .from('pedidos')
      .select('*, pedido_items(*)')
      .eq('mesa_id', this.mesaId)
      .not('estado', 'in', '("pagado","cancelado","rechazado_mozo")')
      .order('fecha_creacion', { ascending: true });

    if (data && data.length > 0) {
      this.pedido = {
        ...data[data.length - 1],
        pedido_items: data.flatMap(p => p.pedido_items),
        total: data.reduce((sum, p) => sum + (p.total || 0), 0),
      };
    }
    this.cargando = false;
  }

  async cargarDescuento() {
    if (!this.mesaId) return;

    const { data } = await this.supabase.client
      .from('descuentos')
      .select('porcentaje')
      .eq('usuario_id', this.usuario.id)
      .order('fecha', { ascending: false })
      .limit(1)
      .maybeSingle();

    this.descuento = data?.porcentaje || 0;
  }

  get montoDescuento() {
    return Math.round((this.pedido.total * this.descuento) / 100);
  }

  get montoPropina() {
    const subtotal = this.pedido.total - this.montoDescuento;
    return Math.round((subtotal * this.propinaPorcentaje) / 100);
  }

  get totalFinal() {
    return this.pedido.total - this.montoDescuento + this.montoPropina;
  }

  suscribirCambios() {
    this.supabase.client
      .channel('cuenta_cliente')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'pedidos',
        },
        () => this.cargarPedido(),
      )
      .subscribe();
  }

  async solicitarCuenta() {
    this.errorGeneral = '';
    try {
      this.enviando = true;

      const { error } = await this.supabase.client
        .from('pedidos')
        .update({
          estado: 'pago_solicitado',
          propina: this.montoPropina,
          descuento: this.montoDescuento,
          total: this.totalFinal,
        })
        .eq('id', this.pedido.id);

      if (error) throw error;

      await this.notificaciones.enviar('Cuenta solicitada', 'Un cliente está solicitando la cuenta.');
      this.pedido.estado = 'pago_solicitado';
    } catch (error: any) {
      await this.haptics.error();
      this.errorGeneral = error.message || 'Error al solicitar la cuenta.';
    } finally {
      this.enviando = false;
    }
  }
}
