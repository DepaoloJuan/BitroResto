import { ChangeDetectionStrategy, Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonFooter, IonItem,
  IonInput, IonButton, IonIcon, IonButtons, IonBackButton,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { chatbubblesOutline, sendOutline } from 'ionicons/icons';
import { AuthService } from '../../../core/services/auth';
import { SupabaseService } from '../../../core/services/supabase';
import { NotificacionesService } from '../../../core/services/notificaciones';
import { Consulta, Mesa } from '../../../core/models';
import { RealtimeChannel } from '@supabase/supabase-js';

@Component({
  selector: 'app-chat',
  templateUrl: './chat.page.html',
  styleUrls: ['./chat.page.scss'],
  imports: [
    DatePipe, FormsModule, IonHeader, IonToolbar, IonTitle, IonContent, IonFooter,
    IonItem, IonInput, IonButton, IonIcon, IonButtons, IonBackButton,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChatPage implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly supabase = inject(SupabaseService);
  private readonly notificaciones = inject(NotificacionesService);
  private readonly destroyRef = inject(DestroyRef);

  mensajes = signal<Consulta[]>([]);
  nuevoMensaje = signal('');
  mesa = signal<Pick<Mesa, 'numero'> | null>(null);

  private mesaId = '';
  private canal?: RealtimeChannel;

  constructor() {
    addIcons({ chatbubblesOutline, sendOutline });
    this.destroyRef.onDestroy(() => {
      if (this.canal) this.supabase.client.removeChannel(this.canal);
    });
  }

  async ngOnInit() {
    await this.obtenerMesa();
    await this.cargarMensajes();
    this.suscribirCambios();
  }

  async obtenerMesa() {
    const usuario = this.authService.getUsuarioActual();
    if (!usuario) return;
    const { data } = await this.supabase.client
      .from('lista_espera').select('mesa_id').eq('usuario_id', usuario.id).eq('estado', 'asignado').single();
    this.mesaId = data?.mesa_id || '';
    if (this.mesaId) {
      const { data: mesaData } = await this.supabase.client
        .from('mesas').select('numero').eq('id', this.mesaId).single();
      this.mesa.set(mesaData);
    }
  }

  async cargarMensajes() {
    if (!this.mesaId) return;
    const { data } = await this.supabase.client
      .from('consultas').select('*').eq('mesa_id', this.mesaId).order('fecha', { ascending: true });
    this.mensajes.set(data || []);
  }

  suscribirCambios() {
    if (!this.mesaId) return;
    this.canal = this.supabase.client
      .channel('chat_cliente')
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'consultas',
        filter: `mesa_id=eq.${this.mesaId}`,
      }, () => this.cargarMensajes())
      .subscribe();
  }

  async enviar() {
    if (!this.nuevoMensaje().trim() || !this.mesaId) return;
    const usuario = this.authService.getUsuarioActual();
    const texto = this.nuevoMensaje().trim();
    const { error } = await this.supabase.client.from('consultas').insert({
      mesa_id: this.mesaId, usuario_id: usuario?.id,
      nombre_remitente: `${usuario?.nombre} ${usuario?.apellido}`,
      mensaje: texto, tipo: 'cliente',
    });
    if (!error) {
      await this.notificaciones.enviar('Nueva consulta', `Mesa ${this.mesa()?.numero}: ${texto}`);
      this.nuevoMensaje.set('');
      await this.cargarMensajes();
    }
  }
}
