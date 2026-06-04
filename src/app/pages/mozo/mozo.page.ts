import { ChangeDetectionStrategy, Component, DestroyRef, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonButton,
  IonIcon, IonGrid, IonRow, IonCol, IonCard, IonCardContent,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { receiptOutline, chatbubblesOutline, logOutOutline } from 'ionicons/icons';
import { AuthService } from '../../core/services/auth';
import { SupabaseService } from '../../core/services/supabase';
import { NotificacionesService } from '../../core/services/notificaciones';
import { RealtimeChannel } from '@supabase/supabase-js';

@Component({
  selector: 'app-mozo',
  templateUrl: './mozo.page.html',
  styleUrls: ['./mozo.page.scss'],
  imports: [
    IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonButton,
    IonIcon, IonGrid, IonRow, IonCol, IonCard, IonCardContent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MozoPage implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly supabase = inject(SupabaseService);
  private readonly notificaciones = inject(NotificacionesService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly usuario = this.authService.usuario;

  private canal?: RealtimeChannel;

  constructor() {
    addIcons({ receiptOutline, chatbubblesOutline, logOutOutline });
    this.destroyRef.onDestroy(() => {
      if (this.canal) this.supabase.client.removeChannel(this.canal);
    });
  }

  ngOnInit() {
    this.canal = this.supabase.client
      .channel('mozo_dashboard')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'pedidos' },
        async (payload) => {
          const estado = (payload.new as any)?.estado;
          if (estado === 'esperando_mozo') {
            await this.notificaciones.enviar('Nuevo pedido', 'Hay un nuevo pedido esperando confirmación.');
          } else if (estado === 'pago_solicitado') {
            await this.notificaciones.enviar('Cuenta solicitada', 'Un cliente está solicitando la cuenta.');
          } else if (estado === 'listo') {
            await this.notificaciones.enviar('Pedido listo', 'Un pedido está listo para entregar.');
          }
        })
      .subscribe();
  }

  ir(ruta: string) { this.router.navigate([ruta]); }
  async cerrarSesion() { await this.authService.logout(); }
}
