import { ChangeDetectionStrategy, Component, DestroyRef, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonButton,
  IonIcon, IonGrid, IonRow, IonCol, IonCard, IonCardContent,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { peopleOutline, personAddOutline, gridOutline, qrCodeOutline, cashOutline, logOutOutline, barChartOutline } from 'ionicons/icons';
import { RealtimeChannel } from '@supabase/supabase-js';
import { AuthService } from '../../core/services/auth';
import { SupabaseService } from '../../core/services/supabase';
import { NotificacionesService } from '../../core/services/notificaciones';

@Component({
  selector: 'app-dueno',
  templateUrl: './dueno.page.html',
  styleUrls: ['./dueno.page.scss'],
  imports: [
    IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonButton,
    IonIcon, IonGrid, IonRow, IonCol, IonCard, IonCardContent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DuenoPage implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly supabase = inject(SupabaseService);
  private readonly notificaciones = inject(NotificacionesService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly usuario = this.authService.usuario;
  private canal?: RealtimeChannel;

  constructor() {
    addIcons({ peopleOutline, personAddOutline, gridOutline, qrCodeOutline, cashOutline, logOutOutline, barChartOutline });
    this.destroyRef.onDestroy(() => {
      if (this.canal) this.supabase.client.removeChannel(this.canal);
    });
  }

  ngOnInit() {
    this.canal = this.supabase.client
      .channel('dueno_dashboard')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'usuarios' },
        async (payload: any) => {
          if (payload.new?.perfil === 'cliente' && payload.new?.estado === 'pendiente') {
            await this.notificaciones.enviar('Nuevo cliente pendiente', 'Hay un cliente esperando aprobación.');
          }
        })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'pedidos' },
        async (payload: any) => {
          const estado = payload.new?.estado;
          if (estado === 'pago_solicitado') {
            await this.notificaciones.enviar('Cuenta solicitada', 'Un cliente está solicitando la cuenta.');
          } else if (estado === 'pagado') {
            await this.notificaciones.enviar('Pago confirmado', 'El mozo confirmó un pago y liberó una mesa.');
          }
        })
      .subscribe();
  }

  ir(ruta: string) { this.router.navigate([ruta]); }
  async cerrarSesion() { await this.authService.logout(); }
}
