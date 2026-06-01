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
  IonSpinner,
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
    IonSpinner,
    IonText,
    IonGrid,
    IonRow,
    IonCol,
    IonAvatar,
    IonButtons,
    IonBackButton,
  ],
})
export class ClientesPendientesPage implements OnInit {
  clientes: any[] = [];
  cargando = false;

  constructor(private supabase: SupabaseService) {
    addIcons({ checkmarkOutline, closeOutline, checkmarkCircleOutline });
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
        filter: 'estado=eq.pendiente'
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
    this.clientes = data || [];
    this.cargando = false;
  }

  async aprobar(cliente: any) {
    try {
      const { error } = await this.supabase.client
        .from('usuarios')
        .update({ estado: 'aprobado' })
        .eq('id', cliente.id);

      if (error) throw error;

      cliente._exito = 'Cliente aprobado correctamente.';
      setTimeout(() => this.cargarClientes(), 1500);
    } catch (error: any) {
      cliente._error = error.message || 'Error al aprobar el cliente.';
    }
  }

  async rechazar(cliente: any) {
    try {
      const { error } = await this.supabase.client
        .from('usuarios')
        .update({ estado: 'rechazado' })
        .eq('id', cliente.id);

      if (error) throw error;

      cliente._exito = 'Cliente rechazado.';
      setTimeout(() => this.cargarClientes(), 1500);
    } catch (error: any) {
      cliente._error = error.message || 'Error al rechazar el cliente.';
    }
  }
}
