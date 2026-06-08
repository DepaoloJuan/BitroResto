import { ChangeDetectionStrategy, Component, DestroyRef, inject, NgZone, OnInit, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonCard, IonCardHeader,
  IonCardTitle, IonCardSubtitle, IonCardContent, IonButton, IonIcon, IonText,
  IonGrid, IonRow, IonCol, IonAvatar, IonButtons, IonBackButton, IonBadge,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { checkmarkOutline, checkmarkCircle, peopleOutline, chevronDownOutline, chevronUpOutline, closeOutline } from 'ionicons/icons';
import { SupabaseService } from '../../../core/services/supabase';
import { LoadingComponent } from '../../../shared/components/loading/loading.component';
import { NotificacionesService } from '../../../core/services/notificaciones';
import { HapticsService } from '../../../core/services/haptics.service';
import { ListaEspera, Mesa } from '../../../core/models';
import { RealtimeChannel } from '@supabase/supabase-js';

interface ClienteEsperaUI extends ListaEspera { _mesa_seleccionada: string | null; _exito: string; _error: string; _mostrar_mesas: boolean; }

@Component({
  selector: 'app-lista-espera',
  templateUrl: './lista-espera.page.html',
  styleUrls: ['./lista-espera.page.scss'],
  imports: [
    IonHeader, IonToolbar, IonTitle, IonContent, IonCard, IonCardHeader,
    IonCardTitle, IonCardSubtitle, IonCardContent, IonButton, IonIcon, IonText,
    IonGrid, IonRow, IonCol, IonAvatar, IonButtons, IonBackButton, IonBadge,
    LoadingComponent, DatePipe,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ListaEsperaPage implements OnInit {
  private readonly supabase = inject(SupabaseService);
  private readonly notificaciones = inject(NotificacionesService);
  private readonly haptics = inject(HapticsService);
  private readonly ngZone = inject(NgZone);
  private readonly destroyRef = inject(DestroyRef);

  clientes = signal<ClienteEsperaUI[]>([]);
  mesasDisponibles = signal<Mesa[]>([]);
  cargando = signal(false);

  private canal?: RealtimeChannel;

  constructor() {
    addIcons({ checkmarkOutline, checkmarkCircle, peopleOutline, chevronDownOutline, chevronUpOutline, closeOutline });
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
      ...c, _mesa_seleccionada: null, _exito: '', _error: '', _mostrar_mesas: false,
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
        async (payload) => this.ngZone.run(async () => {
           console.log('REALTIME INSERT lista_espera:', payload);
          await this.notificaciones.enviar('Nueva solicitud de mesa', 'Hay un cliente esperando una mesa.');
          await this.cargarClientes();
        }))
      .subscribe();
  }

  toggleMesas(cliente: ClienteEsperaUI) {
    this.clientes.update(cs => cs.map(c =>
      c.id === cliente.id ? { ...c, _mostrar_mesas: !c._mostrar_mesas } : c
    ));
  }

  seleccionarMesa(cliente: ClienteEsperaUI, mesaId: string) {
    this.clientes.update(cs => cs.map(c =>
      c.id === cliente.id ? { ...c, _mesa_seleccionada: mesaId, _mostrar_mesas: false } : c
    ));
  }

  getMesaLabel(mesaId: string | null): string {
    if (!mesaId) return '';
    const mesa = this.mesasDisponibles().find(m => m.id === mesaId);
    return mesa ? `Mesa ${mesa.numero} · ${mesa.tipo} · ${mesa.capacidad} personas` : '';
  }

  async rechazarCliente(cliente: ClienteEsperaUI) {
    this.clientes.update(cs => cs.map(c => c.id === cliente.id ? { ...c, _exito: '', _error: '' } : c));
    try {
      const { error } = await this.supabase.client
        .from('lista_espera').update({ estado: 'rechazado' }).eq('id', cliente.id);
      if (error) throw error;
      this.clientes.update(cs => cs.map(c => c.id === cliente.id ? { ...c, _exito: 'Cliente rechazado.' } : c));
      setTimeout(() => this.cargarClientes(), 1500);
    } catch (e: unknown) {
      this.clientes.update(cs => cs.map(c => c.id === cliente.id ? { ...c, _error: (e as Error).message || 'Error al rechazar.' } : c));
      await this.haptics.error();
    }
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
      if (cliente.usuario_id) {
        this.notificaciones.enviarAUsuario(cliente.usuario_id, '¡Tu mesa está lista!', 'Se te asignó una mesa. Ya podés dirigirte a ella.');
      }
      cliente._exito = 'Mesa asignada correctamente.';
      setTimeout(() => this.cargarDatos(), 1500);
    } catch (e: unknown) {
      cliente._error = (e as Error).message || 'Error al asignar la mesa.';
      await this.haptics.error();
    }
  }
}
