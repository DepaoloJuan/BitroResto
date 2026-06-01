import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule, TitleCasePipe } from '@angular/common';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonButton,
  IonIcon,
  IonSpinner,
  IonGrid,
  IonRow,
  IonCol,
  IonCard,
  IonCardContent,
  IonItem,
  IonLabel,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  checkmarkCircleOutline,
  restaurantOutline,
  cartOutline,
  chatbubblesOutline,
  gameControllerOutline,
  starOutline,
  receiptOutline,
  barChartOutline,
  logOutOutline,
  hourglassOutline,
  closeCircleOutline,
  checkmarkDoneOutline,
  bicycleOutline,
  timeOutline,
} from 'ionicons/icons';
import { AuthService } from '../../../core/services/auth';
import { SupabaseService } from '../../../core/services/supabase';
import { RealtimeChannel } from '@supabase/supabase-js';

@Component({
  selector: 'app-mesa',
  templateUrl: './mesa.page.html',
  styleUrls: ['./mesa.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    TitleCasePipe,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButtons,
    IonButton,
    IonIcon,
    IonSpinner,
    IonGrid,
    IonRow,
    IonCol,
    IonCard,
    IonCardContent,
    IonItem,
    IonLabel,
  ],
})
export class MesaPage implements OnInit, OnDestroy {
  cargando = true;
  usuario: any;
  mesa: any = null;
  pedido: any = null;
  esAnonimo = false;
  mesaId = '';
  private canal: RealtimeChannel | null = null;

  constructor(
    private authService: AuthService,
    private supabase: SupabaseService,
    private router: Router,
  ) {
    addIcons({
      checkmarkCircleOutline,
      restaurantOutline,
      cartOutline,
      chatbubblesOutline,
      gameControllerOutline,
      starOutline,
      receiptOutline,
      barChartOutline,
      logOutOutline,
      hourglassOutline,
      closeCircleOutline,
      checkmarkDoneOutline,
      bicycleOutline,
      timeOutline,
    });
  }

  async ngOnInit() {
    this.usuario = this.authService.getUsuarioActual();
    this.esAnonimo = !this.usuario?.perfil;
    await this.resolverMesaId();
    await this.cargarMesa();
    await this.cargarPedido();
    this.suscribirCambios();
  }

  async resolverMesaId() {
    if (this.esAnonimo) {
      this.mesaId = this.usuario?.mesa_id || '';
    } else {
      const { data } = await this.supabase.client
        .from('lista_espera')
        .select('mesa_id')
        .eq('usuario_id', this.usuario.id)
        .eq('estado', 'asignado')
        .single();
      this.mesaId = data?.mesa_id || '';
    }
  }

  ngOnDestroy() {
    this.canal?.unsubscribe();
  }

  async cargarMesa() {
    if (!this.mesaId) return;

    const { data } = await this.supabase.client
      .from('mesas')
      .select('*')
      .eq('id', this.mesaId)
      .single();
    this.mesa = data;
  }

  async cargarPedido() {
    if (!this.mesaId) {
      this.cargando = false;
      return;
    }

    const { data: mesaData } = await this.supabase.client
      .from('mesas')
      .select('estado')
      .eq('id', this.mesaId)
      .single();

    if (mesaData?.estado === 'disponible') {
      if (this.esAnonimo) {
        this.authService.setUsuarioAnonimo(null);
        this.router.navigate(['/login'], { replaceUrl: true });
      } else {
        this.router.navigate(['/cliente/home'], { replaceUrl: true });
      }
      return;
    }

    const { data } = await this.supabase.client
      .from('pedidos')
      .select('id, estado')
      .eq('mesa_id', this.mesaId)
      .not('estado', 'in', '("pagado","cancelado")')
      .order('fecha_creacion', { ascending: false })
      .limit(1)
      .maybeSingle();

    this.pedido = data;
    this.cargando = false;
  }

  suscribirCambios() {
    if (!this.mesaId) return;

    this.canal = this.supabase.client
      .channel('mesa_hub_' + this.mesaId)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'pedidos',
        filter: `mesa_id=eq.${this.mesaId}`,
      }, () => this.cargarPedido())
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'mesas',
        filter: `id=eq.${this.mesaId}`,
      }, () => this.cargarPedido())
      .subscribe();
  }

  // ── Permisos por estado ────────────────────────────────────────────────────

  get estado(): string {
    return this.pedido?.estado ?? '';
  }

  get puedePedir(): boolean {
    return !this.estado || this.estado === 'rechazado_mozo';
  }

  get puedeJugar(): boolean {
    return (
      !this.esAnonimo &&
      [
        'confirmado',
        'pendiente',
        'completado',
        'listo',
        'entregado',
        'recibido',
      ].includes(this.estado)
    );
  }

  get puedeEncuesta(): boolean {
    return ['entregado', 'recibido'].includes(this.estado);
  }

  get puedeCuenta(): boolean {
    return ['entregado', 'recibido'].includes(this.estado);
  }

  // ── Texto e ícono según estado ─────────────────────────────────────────────

  get estadoTexto(): string {
    const map: Record<string, string> = {
      esperando_mozo: '⏳ Pedido enviado, esperando al mozo',
      rechazado_mozo: '❌ El mozo rechazó tu pedido, podés modificarlo',
      confirmado: '✅ Pedido confirmado, en preparación',
      pendiente: '🍳 Tu pedido está siendo preparado',
      completado: '🔔 Tu pedido está listo para ser entregado',
      listo: '🔔 Tu pedido está listo para ser entregado',
      entregado: '🎉 Pedido entregado, ¡buen provecho!',
      recibido: '🎉 Pedido entregado, ¡buen provecho!',
      pago_solicitado: '💳 Cuenta solicitada, esperando al mozo',
    };
    return map[this.estado] ?? '';
  }

  get estadoColor(): string {
    const map: Record<string, string> = {
      esperando_mozo: 'warning',
      rechazado_mozo: 'danger',
      confirmado: 'primary',
      pendiente: 'primary',
      completado: 'success',
      listo: 'success',
      entregado: 'success',
      recibido: 'success',
      pago_solicitado: 'warning',
    };
    return map[this.estado] ?? 'light';
  }

  get estadoIcono(): string {
    const map: Record<string, string> = {
      esperando_mozo: 'hourglass-outline',
      rechazado_mozo: 'close-circle-outline',
      confirmado: 'checkmark-circle-outline',
      pendiente: 'time-outline',
      completado: 'checkmark-done-outline',
      listo: 'checkmark-done-outline',
      entregado: 'checkmark-done-outline',
      recibido: 'checkmark-done-outline',
      pago_solicitado: 'hourglass-outline',
    };
    return map[this.estado] ?? 'information-circle-outline';
  }

  ir(ruta: string) {
    this.router.navigate([ruta]);
  }

  salir() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
