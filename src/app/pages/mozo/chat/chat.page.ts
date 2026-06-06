import { ChangeDetectionStrategy, Component, DestroyRef, inject, NgZone, OnInit, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonCard, IonCardHeader,
  IonCardTitle, IonCardContent, IonItem, IonInput, IonButton, IonIcon,
  IonSpinner, IonButtons, IonBackButton,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { chatbubblesOutline, sendOutline } from 'ionicons/icons';
import { AuthService } from '../../../core/services/auth';
import { SupabaseService } from '../../../core/services/supabase';
import { NotificacionesService } from '../../../core/services/notificaciones';
import { HapticsService } from '../../../core/services/haptics.service';
import { Mesa, Consulta } from '../../../core/models';
import { RealtimeChannel } from '@supabase/supabase-js';

interface MesaConMensajes extends Mesa { mensajes: Consulta[]; _respuesta: string; }

@Component({
  selector: 'app-chat',
  templateUrl: './chat.page.html',
  styleUrls: ['./chat.page.scss'],
  imports: [
    DatePipe, FormsModule, IonHeader, IonToolbar, IonTitle, IonContent, IonCard, IonCardHeader,
    IonCardTitle, IonCardContent, IonItem, IonInput, IonButton, IonIcon,
    IonSpinner, IonButtons, IonBackButton,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChatPage implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly supabase = inject(SupabaseService);
  private readonly notificaciones = inject(NotificacionesService);
  private readonly haptics = inject(HapticsService);
  private readonly ngZone = inject(NgZone);
  private readonly destroyRef = inject(DestroyRef);

  mesas = signal<MesaConMensajes[]>([]);
  cargando = signal(false);

  private canal?: RealtimeChannel;

  constructor() {
    addIcons({ chatbubblesOutline, sendOutline });
    this.destroyRef.onDestroy(() => {
      if (this.canal) this.supabase.client.removeChannel(this.canal);
    });
  }

  async ngOnInit() {
    await this.cargarMensajes();
    this.suscribirCambios();
  }

  async cargarMensajes() {
    this.cargando.set(true);
    const { data: mesasOcupadas } = await this.supabase.client
      .from('mesas').select('*').eq('estado', 'ocupada').not('tipo', 'in', '("entrada","propinas")');
    if (!mesasOcupadas?.length) { this.mesas.set([]); this.cargando.set(false); return; }
    const mesaIds = mesasOcupadas.map(m => m.id);
    const { data: mensajes } = await this.supabase.client
      .from('consultas').select('*').in('mesa_id', mesaIds).order('fecha', { ascending: true });
    this.mesas.set(
      mesasOcupadas
        .map(mesa => ({ ...mesa, mensajes: (mensajes || []).filter(m => m.mesa_id === mesa.id), _respuesta: '' }) as MesaConMensajes)
        .filter(m => m.mensajes.length > 0)
    );
    this.cargando.set(false);
  }

  suscribirCambios() {
    this.canal = this.supabase.client
      .channel('chat_mozo')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'consultas' },
        async () => this.ngZone.run(async () => {
          await this.notificaciones.enviar('Nueva consulta', 'Un cliente envió una consulta.');
          await this.cargarMensajes();
        }))
      .subscribe();
  }

  async responder(mesa: MesaConMensajes) {
    if (!mesa._respuesta.trim()) return;
    const usuario = this.authService.getUsuarioActual();
    const { error } = await this.supabase.client.from('consultas').insert({
      mesa_id: mesa.id, usuario_id: usuario?.id || null,
      nombre_remitente: `${usuario?.nombre} (Mozo)`,
      mensaje: mesa._respuesta.trim(), tipo: 'mozo',
    });
    if (!error) {
      this.mesas.update(ms => ms.map(m => m.id === mesa.id ? { ...m, _respuesta: '' } : m));
      await this.cargarMensajes();
    } else {
      await this.haptics.error();
    }
  }
}
