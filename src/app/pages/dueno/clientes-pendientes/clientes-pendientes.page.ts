import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
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
  IonText,
  IonGrid,
  IonRow,
  IonCol,
  IonAvatar,
  IonButtons,
  IonBackButton,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  checkmarkOutline,
  closeOutline,
  checkmarkCircleOutline,
} from 'ionicons/icons';
import { SupabaseService } from '../../../core/services/supabase';
import { AuthService } from '../../../core/services/auth';
import { LoadingComponent } from '../../../shared/components/loading/loading.component';

@Component({
  selector: 'app-clientes-pendientes',
  templateUrl: './clientes-pendientes.page.html',
  styleUrls: ['./clientes-pendientes.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
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
    IonText,
    IonGrid,
    IonRow,
    IonCol,
    IonAvatar,
    IonButtons,
    IonBackButton,
    LoadingComponent,
  ],
})
export class ClientesPendientesPage implements OnInit {
  clientes: any[] = [];
  cargando = false;
  backHref = '/dueno';

  constructor(
    private supabase: SupabaseService,
    private authService: AuthService,
  ) {
    addIcons({ checkmarkOutline, closeOutline, checkmarkCircleOutline });

    const usuario = this.authService.getUsuarioActual();
    if (usuario?.perfil === 'supervisor') {
      this.backHref = '/supervisor';
    }
  }

  async ngOnInit() {
    await this.cargarClientes();
    this.suscribirCambios();
  }

  suscribirCambios() {
    this.supabase.client
      .channel('clientes_pendientes')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'usuarios',
      }, () => {
        this.cargarClientes();
      })
      .subscribe();
  }

  async cargarClientes() {
    this.cargando = true;
    const { data } = await this.supabase.client
      .from('usuarios')
      .select('*')
      .eq('perfil', 'cliente')
      .eq('estado', 'pendiente')
      .order('fecha_registro', { ascending: true });
    this.clientes = (data || []).map(c => ({
      ...c,
      _exito: '',
      _error: '',
    }));
    this.cargando = false;
  }

  async aprobar(cliente: any) {
    cliente._exito = '';
    cliente._error = '';
    try {
      const { error } = await this.supabase.client
        .from('usuarios')
        .update({ estado: 'aprobado' })
        .eq('id', cliente.id);

      if (error) throw error;

      await this.supabase.client.functions.invoke('enviar-correo', {
        body: {
          email: cliente.email,
          nombre: cliente.nombre,
          accion: 'aprobado',
        },
      });

      cliente._exito = '¡Cliente aprobado correctamente!';
      setTimeout(() => this.cargarClientes(), 1500);
    } catch (e: any) {
      cliente._error = e.message || 'Error al aprobar el cliente.';
    }
  }

  async rechazar(cliente: any) {
    cliente._exito = '';
    cliente._error = '';
    try {
      const { error } = await this.supabase.client
        .from('usuarios')
        .update({ estado: 'rechazado' })
        .eq('id', cliente.id);

      if (error) throw error;

      await this.supabase.client.functions.invoke('enviar-correo', {
        body: {
          email: cliente.email,
          nombre: cliente.nombre,
          accion: 'rechazado',
          auth_id: cliente.auth_id,
        },
      });

      cliente._exito = 'Cliente rechazado.';
      setTimeout(() => this.cargarClientes(), 1500);
    } catch (e: any) {
      cliente._error = e.message || 'Error al rechazar el cliente.';
    }
  }
}
