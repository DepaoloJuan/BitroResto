import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
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
  IonBadge,
  IonItem,
  IonLabel,
  IonSelect,
  IonSelectOption,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { checkmarkOutline, peopleOutline } from 'ionicons/icons';
import { SupabaseService } from '../../../core/services/supabase';

@Component({
  selector: 'app-lista-espera',
  templateUrl: './lista-espera.page.html',
  styleUrls: ['./lista-espera.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
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
    IonBadge,
    IonItem,
    IonLabel,
    IonSelect,
    IonSelectOption,
  ],
})
export class ListaEsperaPage implements OnInit {
  clientes: any[] = [];
  mesasDisponibles: any[] = [];
  cargando = false;

  constructor(private supabase: SupabaseService) {
    addIcons({ checkmarkOutline, peopleOutline });
  }

  async ngOnInit() {
    await this.cargarDatos();
    this.suscribirCambios();
  }

  async cargarDatos() {
    this.cargando = true;
    await Promise.all([this.cargarClientes(), this.cargarMesas()]);
    this.cargando = false;
  }

  async cargarClientes() {
    const { data } = await this.supabase.client
      .from('lista_espera')
      .select('*')
      .eq('estado', 'esperando')
      .order('fecha_ingreso', { ascending: true });
    this.clientes = (data || []).map((c) => ({
      ...c,
      _mesa_seleccionada: null,
      _exito: '',
      _error: '',
    }));
  }

  async cargarMesas() {
    const { data } = await this.supabase.client
      .from('mesas')
      .select('*')
      .eq('estado', 'disponible')
      .not('tipo', 'in', '("entrada","propinas")')
      .order('numero', { ascending: true });
    this.mesasDisponibles = data || [];
  }

  suscribirCambios() {
    this.supabase.client
      .channel('lista_espera_cambios')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'lista_espera',
        },
        () => {
          this.cargarClientes();
        },
      )
      .subscribe();
  }

  async asignarMesa(cliente: any) {
    cliente._exito = '';
    cliente._error = '';

    try {
      // Actualizar lista de espera
      const { error: errorEspera } = await this.supabase.client
        .from('lista_espera')
        .update({ estado: 'asignado', mesa_id: cliente._mesa_seleccionada })
        .eq('id', cliente.id);

      if (errorEspera) throw errorEspera;

      // Marcar mesa como ocupada
      const { error: errorMesa } = await this.supabase.client
        .from('mesas')
        .update({ estado: 'ocupada' })
        .eq('id', cliente._mesa_seleccionada);

      if (errorMesa) throw errorMesa;

      cliente._exito = 'Mesa asignada correctamente.';
      setTimeout(() => this.cargarDatos(), 1500);
    } catch (error: any) {
      cliente._error = error.message || 'Error al asignar la mesa.';
    }
  }
}
