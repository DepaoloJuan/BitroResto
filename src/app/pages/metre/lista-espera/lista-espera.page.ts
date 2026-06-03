import { ChangeDetectionStrategy, Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonCard, IonCardHeader,
  IonCardTitle, IonCardSubtitle, IonCardContent, IonButton, IonIcon, IonText,
  IonGrid, IonRow, IonCol, IonAvatar, IonButtons, IonBackButton, IonBadge,
  IonItem, IonLabel, IonSelect, IonSelectOption,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { checkmarkOutline, peopleOutline } from 'ionicons/icons';
import { SupabaseService } from '../../../core/services/supabase';
import { LoadingComponent } from '../../../shared/components/loading/loading.component';
import { NotificacionesService } from '../../../core/services/notificaciones';
import { ListaEspera, Mesa } from '../../../core/models';
import { RealtimeChannel } from '@supabase/supabase-js';

interface ClienteEsperaUI extends ListaEspera { _mesa_seleccionada: string | null; _exito: string; _error: string; }

@Component({
  selector: 'app-lista-espera',
  templateUrl: './lista-espera.page.html',
  styleUrls: ['./lista-espera.page.scss'],
  imports: [
    FormsModule, IonHeader, IonToolbar, IonTitle, IonContent, IonCard, IonCardHeader,
    IonCardTitle, IonCardSubtitle, IonCardContent, IonButton, IonIcon, IonText,
    IonGrid, IonRow, IonCol, IonAvatar, IonButtons, IonBackButton, IonBadge,
    IonItem, IonLabel, IonSelect, IonSelectOption, LoadingComponent, DatePipe,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ListaEsperaPage implements OnInit {
  private readonly supabase = inject(SupabaseService);
  private readonly notificaciones = inject(NotificacionesService);
  private readonly destroyRef = inject(DestroyRef);

  clientes = signal<ClienteEsperaUI[]>([]);
  mesasDisponibles = signal<Mesa[]>([]);
  cargando = signal(false);

  private canal?: RealtimeChannel;

  constructor() {
    addIcons({ checkmarkOutline, peopleOutline });
    this.destroyRef.onDestroy(() => {
      if (this.canal) this.supabase.client.removeChannel(this.canal);
    });
  }

  async ngOnInit() {
    await this.cargarDatos();
    this.suscribirCambios();
  }

  async cargarDatos() {
    this.cargando.set(true);
    await Promise.all([this.cargarClientes(), this.cargarMesas()]);
    this.cargando.set(false);
  }

  async cargarClientes() {
    const { data } = await this.supabase.client
      .from('lista_espera').select('*').eq('estado', 'esperando')
      .order('fecha_ingreso', { ascending: true });
    this.clientes.set((data || []).map(c => ({
      ...c, _mesa_seleccionada: null, _exito: '', _error: '',
    }) as ClienteEsperaUI));
  }

  async cargarMesas() {
    const { data } = await this.supabase.client
      .from('mesas').select('*').eq('estado', 'disponible')
      .not('tipo', 'in', '("entrada","propinas")').order('numero', { ascending: true });
    this.mesasDisponibles.set(data || []);
  }

  suscribirCambios() {
    this.canal = this.supabase.client
      .channel('lista_espera_cambios')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'lista_espera' },
        async () => {
          await this.notificaciones.enviar('Nueva solicitud de mesa', 'Hay un cliente esperando una mesa.');
          await this.cargarClientes();
        })
      .subscribe();
  }

  async asignarMesa(cliente: ClienteEsperaUI) {
    cliente._exito = '';
    cliente._error = '';
    try {
      const { error: errorEspera } = await this.supabase.client
        .from('lista_espera').update({ estado: 'asignado', mesa_id: cliente._mesa_seleccionada }).eq('id', cliente.id);
      if (errorEspera) throw errorEspera;
      const { error: errorMesa } = await this.supabase.client
        .from('mesas').update({ estado: 'ocupada' }).eq('id', cliente._mesa_seleccionada);
      if (errorMesa) throw errorMesa;
      cliente._exito = 'Mesa asignada correctamente.';
      setTimeout(() => this.cargarDatos(), 1500);
    } catch (e: unknown) {
      cliente._error = (e as Error).message || 'Error al asignar la mesa.';
    }
  }
}
