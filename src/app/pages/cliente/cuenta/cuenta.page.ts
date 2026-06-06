import { ChangeDetectionStrategy, Component, computed, DestroyRef, inject, NgZone, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonCard, IonCardHeader, IonCardTitle,
  IonCardSubtitle, IonCardContent, IonButton, IonIcon, IonSpinner, IonText, IonItem,
  IonLabel, IonNote, IonButtons, IonBackButton, IonSegment, IonSegmentButton,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { cashOutline, giftOutline, hourglassOutline, qrCodeOutline, scanOutline } from 'ionicons/icons';
import { BarcodeScanner, BarcodeFormat } from '@capacitor-mlkit/barcode-scanning';
import { AuthService } from '../../../core/services/auth';
import { SupabaseService } from '../../../core/services/supabase';
import { LoadingComponent } from '../../../shared/components/loading/loading.component';
import { HapticsService } from '../../../core/services/haptics.service';
import { NotificacionesService } from '../../../core/services/notificaciones';
import { Pedido } from '../../../core/models';
import { RealtimeChannel } from '@supabase/supabase-js';

@Component({
  selector: 'app-cuenta',
  templateUrl: './cuenta.page.html',
  styleUrls: ['./cuenta.page.scss'],
  imports: [
    FormsModule, IonHeader, IonToolbar, IonTitle, IonContent, IonCard, IonCardHeader,
    IonCardTitle, IonCardSubtitle, IonCardContent, IonButton, IonIcon, IonSpinner, IonText,
    IonItem, IonLabel, IonNote, IonButtons, IonBackButton, IonSegment, IonSegmentButton, LoadingComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CuentaPage implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly supabase = inject(SupabaseService);
  private readonly router = inject(Router);
  private readonly haptics = inject(HapticsService);
  private readonly notificaciones = inject(NotificacionesService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly ngZone = inject(NgZone);

  private mesaId = '';
  pedido = signal<(Pedido & { total: number }) | null>(null);
  descuento = signal(0);
  propinaPorcentaje = signal(0);
  qrPropinasEscaneado = signal(false);
  escaneandoQRPropina = signal(false);
  errorQRPropina = signal('');
  cargando = signal(false);
  enviando = signal(false);
  errorGeneral = signal('');

  montoDescuento = computed(() => {
    const p = this.pedido();
    return p ? Math.round((p.total * this.descuento()) / 100) : 0;
  });
  montoPropina = computed(() => {
    const subtotal = (this.pedido()?.total ?? 0) - this.montoDescuento();
    return Math.round((subtotal * this.propinaPorcentaje()) / 100);
  });
  totalFinal = computed(() => (this.pedido()?.total ?? 0) - this.montoDescuento() + this.montoPropina());

  private canal?: RealtimeChannel;

  constructor() {
    addIcons({ cashOutline, giftOutline, hourglassOutline, qrCodeOutline, scanOutline });
    this.destroyRef.onDestroy(() => {
      if (this.canal) this.supabase.client.removeChannel(this.canal);
    });
  }

  async ngOnInit() {
    await this.obtenerMesa();
    await this.cargarPedido();
    await this.cargarDescuento();
    this.suscribirCambios();
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

  async cargarPedido() {
    this.cargando.set(true);
    const { data } = await this.supabase.client
      .from('pedidos').select('*, pedido_items(*)')
      .eq('mesa_id', this.mesaId)
      .not('estado', 'in', '("pagado","cancelado","rechazado_mozo")')
      .order('fecha_creacion', { ascending: true });
    if (data?.length) {
      this.pedido.set({
        ...data[data.length - 1],
        pedido_items: data.flatMap(p => p.pedido_items),
        total: data.reduce((sum, p) => sum + (p.total || 0), 0),
      } as Pedido & { total: number });
    }
    this.cargando.set(false);
  }

  async cargarDescuento() {
    if (!this.mesaId) return;
    const usuario = this.authService.getUsuarioActual();
    if (!usuario) return;
    const { data } = await this.supabase.client
      .from('descuentos').select('porcentaje').eq('usuario_id', usuario.id)
      .order('fecha', { ascending: false }).limit(1).maybeSingle();
    this.descuento.set(data?.porcentaje || 0);
  }

  suscribirCambios() {
    this.canal = this.supabase.client
      .channel('cuenta_pagado_' + this.mesaId)
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'pedidos', filter: `mesa_id=eq.${this.mesaId}` },
        (payload) => {
          this.ngZone.run(async () => {
            if ((payload.new as any)?.estado === 'pagado') {
              this.router.navigate(['/cliente/encuesta'], {
                state: { desdePago: true, mesaId: this.mesaId },
                replaceUrl: true,
              });
              return;
            }
            await this.cargarPedido();
          });
        })
      .subscribe();
  }

  async escanearQRPropina() {
    this.errorQRPropina.set('');
    this.escaneandoQRPropina.set(true);
    try {
      const { supported } = await BarcodeScanner.isSupported();
      if (!supported) { this.errorQRPropina.set('Este dispositivo no soporta la lectura de QR.'); return; }
      await BarcodeScanner.requestPermissions();
      const { barcodes } = await BarcodeScanner.scan({ formats: [BarcodeFormat.QrCode] });
      if (barcodes.length === 0) return;
      const valor = barcodes[0].rawValue ?? '';
      if (valor === 'com.bitroresto.app://propinas') {
        this.qrPropinasEscaneado.set(true);
      } else {
        await this.haptics.error();
        this.errorQRPropina.set('QR no válido. Escaneá el código de propinas de la mesa.');
      }
    } catch (error: unknown) {
      const e = error as any;
      if (e?.message === 'scan canceled.' || e?.errorMessage === 'scan canceled.') return;
      this.errorQRPropina.set('Error al leer el QR. Intentá de nuevo.');
      await this.haptics.error();
    } finally {
      this.escaneandoQRPropina.set(false);
    }
  }

  async solicitarCuenta() {
    this.errorGeneral.set('');
    const p = this.pedido();
    if (!p) return;
    try {
      this.enviando.set(true);
      const { error } = await this.supabase.client.from('pedidos').update({
        estado: 'pago_solicitado',
        propina: this.montoPropina(),
        descuento: this.montoDescuento(),
        total: this.totalFinal(),
      }).eq('id', p.id);
      if (error) throw error;
      this.notificaciones.enviarPorPerfil(['mozo', 'dueño', 'supervisor'], 'Cuenta solicitada', 'Un cliente está solicitando la cuenta.');
      this.pedido.update(prev => prev ? { ...prev, estado: 'pago_solicitado' } : prev);
    } catch (e: unknown) {
      await this.haptics.error();
      this.errorGeneral.set((e as Error).message || 'Error al solicitar la cuenta.');
    } finally {
      this.enviando.set(false);
    }
  }
}
