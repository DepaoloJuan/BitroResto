import { ChangeDetectionStrategy, Component, DestroyRef, inject, NgZone, OnInit, signal } from '@angular/core';
import { TitleCasePipe } from '@angular/common';
import { AlertController, ToastController } from '@ionic/angular/standalone';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonBackButton,
  IonButton, IonIcon, IonBadge, IonSpinner,
  IonCard, IonCardHeader, IonCardTitle, IonCardSubtitle, IonCardContent,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { trashOutline, checkmarkCircleOutline, personOutline } from 'ionicons/icons';
import { SupabaseService } from '../../../core/services/supabase';
import { HapticsService } from '../../../core/services/haptics.service';
import { LoadingComponent } from '../../../shared/components/loading/loading.component';
import { RealtimeChannel } from '@supabase/supabase-js';

interface MesaUI {
  id: string;
  numero: number;
  tipo: string;
  capacidad: number;
  estado: string;
  cliente_nombre?: string;
  cliente_foto?: string;
  _accion: boolean;
}

@Component({
  selector: 'app-gestionar-mesas',
  templateUrl: './gestionar-mesas.page.html',
  styleUrls: ['./gestionar-mesas.page.scss'],
  imports: [
    TitleCasePipe, IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonBackButton,
    IonButton, IonIcon, IonBadge, IonSpinner, LoadingComponent,
    IonCard, IonCardHeader, IonCardTitle, IonCardSubtitle, IonCardContent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GestionarMesasPage implements OnInit {
  private readonly supabase = inject(SupabaseService);
  private readonly haptics = inject(HapticsService);
  private readonly alertCtrl = inject(AlertController);
  private readonly toastCtrl = inject(ToastController);
  private readonly ngZone = inject(NgZone);
  private readonly destroyRef = inject(DestroyRef);

  mesas = signal<MesaUI[]>([]);
  cargando = signal(true);

  private canal?: RealtimeChannel;

  constructor() {
    addIcons({ trashOutline, checkmarkCircleOutline, personOutline });
    this.destroyRef.onDestroy(() => {
      if (this.canal) this.supabase.client.removeChannel(this.canal);
    });
  }

  async ngOnInit() {
    await this.cargarMesas();
    this.suscribirCambios();
  }

  async cargarMesas(silencioso = false) {
    if (!silencioso) this.cargando.set(true);
    const { data } = await this.supabase.client
      .from('mesas')
      .select('*, lista_espera(estado, usuarios(nombre, foto))')
      .order('numero', { ascending: true });

    this.mesas.set(
      (data || []).map(m => {
        const asignacion = (m.lista_espera || []).find((le: any) => le.estado === 'asignado');
        return {
          id: m.id,
          numero: m.numero,
          tipo: m.tipo,
          capacidad: m.capacidad,
          estado: m.estado,
          cliente_nombre: asignacion?.usuarios?.nombre,
          cliente_foto: asignacion?.usuarios?.foto,
          _accion: false,
        } as MesaUI;
      })
    );
    if (!silencioso) this.cargando.set(false);
  }

  suscribirCambios() {
    this.canal = this.supabase.client
      .channel('supervisor_mesas')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'mesas' },
        () => this.ngZone.run(() => this.cargarMesas(true)))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'lista_espera' },
        () => this.ngZone.run(() => this.cargarMesas(true)))
      .subscribe();
  }

  async confirmarLiberar(mesa: MesaUI) {
    const alert = await this.alertCtrl.create({
      header: 'Liberar mesa',
      message: `¿Querés marcar la Mesa ${mesa.numero} como disponible? Se cerrará la sesión del cliente.`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        { text: 'Liberar', cssClass: 'alert-btn-danger', handler: () => this.liberarMesa(mesa) },
      ],
    });
    await alert.present();
  }

  private async mostrarToast(mensaje: string, color: 'success' | 'danger' = 'success') {
    const toast = await this.toastCtrl.create({
      message: mensaje,
      duration: 2500,
      position: 'bottom',
      color,
    });
    await toast.present();
  }

  async liberarMesa(mesa: MesaUI) {
    this.mesas.update(ms => ms.map(m => m.id === mesa.id ? { ...m, _accion: true } : m));
    try {
      const { error: e1 } = await this.supabase.client
        .from('mesas').update({ estado: 'disponible' }).eq('id', mesa.id);
      if (e1) throw e1;
      await this.supabase.client
        .from('lista_espera').update({ estado: 'finalizado' })
        .eq('mesa_id', mesa.id).eq('estado', 'asignado');
      this.mesas.update(ms => ms.map(m => m.id === mesa.id
        ? { ...m, estado: 'disponible', cliente_nombre: undefined, cliente_foto: undefined, _accion: false }
        : m
      ));
      await this.mostrarToast(`Mesa ${mesa.numero} liberada correctamente.`);
    } catch {
      await this.haptics.error();
      this.mesas.update(ms => ms.map(m => m.id === mesa.id ? { ...m, _accion: false } : m));
      await this.mostrarToast('Error al liberar la mesa.', 'danger');
    }
  }

  async confirmarEliminar(mesa: MesaUI) {
    const alert = await this.alertCtrl.create({
      header: 'Eliminar mesa',
      message: `¿Estás seguro de que querés eliminar la Mesa ${mesa.numero}? Esta acción no se puede deshacer.`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        { text: 'Eliminar', cssClass: 'alert-btn-danger', handler: () => this.eliminarMesa(mesa) },
      ],
    });
    await alert.present();
  }

  async eliminarMesa(mesa: MesaUI) {
    this.mesas.update(ms => ms.map(m => m.id === mesa.id ? { ...m, _accion: true } : m));
    try {
      await this.supabase.client.from('lista_espera').delete().eq('mesa_id', mesa.id);
      await this.supabase.client.from('encuestas').delete().eq('mesa_id', mesa.id);

      const { data: pedidos } = await this.supabase.client
        .from('pedidos').select('id').eq('mesa_id', mesa.id);
      for (const p of pedidos || []) {
        await this.supabase.client.from('pedido_items').delete().eq('pedido_id', p.id);
      }
      await this.supabase.client.from('pedidos').delete().eq('mesa_id', mesa.id);

      const { error } = await this.supabase.client.from('mesas').delete().eq('id', mesa.id);
      if (error) throw error;

      this.mesas.update(ms => ms.filter(m => m.id !== mesa.id));
      await this.mostrarToast(`Mesa ${mesa.numero} eliminada.`);
    } catch {
      await this.haptics.error();
      this.mesas.update(ms => ms.map(m => m.id === mesa.id ? { ...m, _accion: false } : m));
      await this.mostrarToast('No se pudo eliminar la mesa.', 'danger');
    }
  }
}
