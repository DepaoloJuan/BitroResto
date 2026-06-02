import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonFooter,
  IonItem,
  IonInput,
  IonButton,
  IonIcon,
  IonButtons,
  IonBackButton,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { chatbubblesOutline, sendOutline } from 'ionicons/icons';
import { AuthService } from '../../../core/services/auth';
import { SupabaseService } from '../../../core/services/supabase';
import { NotificacionesService } from '../../../core/services/notificaciones';

@Component({
  selector: 'app-chat',
  templateUrl: './chat.page.html',
  styleUrls: ['./chat.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonFooter,
    IonItem,
    IonInput,
    IonButton,
    IonIcon,
    IonButtons,
    IonBackButton,
  ],
})
export class ChatPage implements OnInit {
  mensajes: any[] = [];
  nuevoMensaje = '';
  usuario: any;
  mesaId = '';
  mesa: any = null;

  constructor(
    private authService: AuthService,
    private supabase: SupabaseService,
    private notificaciones: NotificacionesService,
  ) {
    addIcons({ chatbubblesOutline, sendOutline });
  }

  async ngOnInit() {
    this.usuario = this.authService.getUsuarioActual();
    await this.obtenerMesa();
    await this.cargarMensajes();
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
    if (this.mesaId) {
      const { data: mesaData } = await this.supabase.client
        .from('mesas')
        .select('numero')
        .eq('id', this.mesaId)
        .single();
      this.mesa = mesaData;
    }
  }

  async cargarMensajes() {
    if (!this.mesaId) return;
    const { data } = await this.supabase.client
      .from('consultas')
      .select('*')
      .eq('mesa_id', this.mesaId)
      .order('fecha', { ascending: true });
    this.mensajes = data || [];
  }

  suscribirCambios() {
    this.supabase.client
      .channel('chat_cliente')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'consultas',
          filter: `mesa_id=eq.${this.mesaId}`,
        },
        () => this.cargarMensajes(),
      )
      .subscribe();
  }

  async enviar() {
    if (!this.nuevoMensaje.trim() || !this.mesaId) return;

    const { error } = await this.supabase.client.from('consultas').insert({
      mesa_id: this.mesaId,
      usuario_id: this.usuario.id,
      nombre_remitente: `${this.usuario.nombre} ${this.usuario.apellido}`,
      mensaje: this.nuevoMensaje.trim(),
      tipo: 'cliente',
    });

    if (!error) {
      await this.notificaciones.enviar('Nueva consulta', `Mesa ${this.mesa?.numero}: ${this.nuevoMensaje.trim()}`);
      this.nuevoMensaje = '';
      await this.cargarMensajes();
    }
  }
}
