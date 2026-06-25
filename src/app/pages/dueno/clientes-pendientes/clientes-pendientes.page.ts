import { ChangeDetectionStrategy, Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonCard, IonCardHeader,
  IonCardTitle, IonCardSubtitle, IonCardContent, IonButton, IonIcon,
  IonText, IonGrid, IonRow, IonCol, IonAvatar, IonButtons, IonBackButton,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { checkmarkOutline, closeOutline, checkmarkCircleOutline } from 'ionicons/icons';
import { SupabaseService } from '../../../core/services/supabase';
import { AuthService } from '../../../core/services/auth';
import { NotificacionesService } from '../../../core/services/notificaciones';
import { HapticsService } from '../../../core/services/haptics.service';
import { LoadingComponent } from '../../../shared/components/loading/loading.component';
import { Usuario } from '../../../core/models';
import { RealtimeChannel } from '@supabase/supabase-js';

interface ClienteUI extends Usuario { _exito: string; _error: string; }

@Component({
  selector: 'app-clientes-pendientes',
  templateUrl: './clientes-pendientes.page.html',
  styleUrls: ['./clientes-pendientes.page.scss'],
  imports: [
    IonHeader, IonToolbar, IonTitle, IonContent, IonCard, IonCardHeader,
    IonCardTitle, IonCardSubtitle, IonCardContent, IonButton, IonIcon,
    IonText, IonGrid, IonRow, IonCol, IonAvatar, IonButtons, IonBackButton,
    LoadingComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ClientesPendientesPage implements OnInit {
  private readonly supabase = inject(SupabaseService);
  private readonly authService = inject(AuthService);
  private readonly notificaciones = inject(NotificacionesService);
  private readonly haptics = inject(HapticsService);
  private readonly destroyRef = inject(DestroyRef);

  clientes = signal<ClienteUI[]>([]);
  cargando = signal(false);
  backHref = signal('/dueno');

  private canal?: RealtimeChannel;

  constructor() {
    addIcons({ checkmarkOutline, closeOutline, checkmarkCircleOutline });
    const usuario = this.authService.getUsuarioActual();
    if (usuario?.perfil === 'supervisor') this.backHref.set('/supervisor');
    this.destroyRef.onDestroy(() => {
      if (this.canal) this.supabase.client.removeChannel(this.canal);
    });
  }

  async ngOnInit() {
    await this.cargarClientes();
    this.suscribirCambios();
  }

  suscribirCambios() {
    this.canal = this.supabase.client
      .channel('clientes_pendientes')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'usuarios' },
        async () => { await this.cargarClientes(); })
      .subscribe();
  }

  async cargarClientes() {
    this.cargando.set(true);
    const { data } = await this.supabase.client
      .from('usuarios').select('*').eq('perfil', 'cliente').eq('estado', 'pendiente')
      .order('fecha_registro', { ascending: true });
    this.clientes.set((data || []).map(c => ({ ...c, _exito: '', _error: '' }) as ClienteUI));
    this.cargando.set(false);
  }

  async aprobar(cliente: ClienteUI) {
    cliente._exito = '';
    cliente._error = '';
    try {
      const { error } = await this.supabase.client
        .from('usuarios').update({ estado: 'aprobado' }).eq('id', cliente.id);
      if (error) throw error;
      await this.supabase.client.functions.invoke('super-responder', {
        body: {
          email: cliente.email,
          nombre: cliente.nombre,
          accion: 'aprobado',
          auth_id: cliente.auth_id,
        },
        headers: {
          Authorization: `Bearer ${(await this.supabase.client.auth.getSession()).data.session?.access_token}`,
        }
      });
      cliente._exito = '¡Cliente aprobado correctamente!';
      setTimeout(() => this.cargarClientes(), 1500);
    } catch (e: unknown) {
      cliente._error = (e as Error).message || 'Error al aprobar el cliente.';
      await this.haptics.error();
    }
  }

  async rechazar(cliente: ClienteUI) {
    cliente._exito = '';
    cliente._error = '';
    try {
      const { error } = await this.supabase.client
        .from('usuarios').update({ estado: 'rechazado' }).eq('id', cliente.id);
      if (error) throw error;
       await this.supabase.client.functions.invoke('super-responder', {
        body: { email: cliente.email, nombre: cliente.nombre, accion: 'rechazado', auth_id: cliente.auth_id },
        headers: {
          Authorization: `Bearer ${(await this.supabase.client.auth.getSession()).data.session?.access_token}`,
        }
      });
      
      cliente._exito = 'Cliente rechazado.';
      setTimeout(() => this.cargarClientes(), 1500);
    } catch (e: unknown) {
      cliente._error = (e as Error).message || 'Error al rechazar el cliente.';
      await this.haptics.error();
    }
  }
}
