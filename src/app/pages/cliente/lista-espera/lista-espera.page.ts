import { ChangeDetectionStrategy, Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonButton, IonIcon,
  IonSpinner, IonText, IonButtons, IonBackButton,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { timeOutline, hourglassOutline, checkmarkCircleOutline, barChartOutline } from 'ionicons/icons';
import { AuthService } from '../../../core/services/auth';
import { SupabaseService } from '../../../core/services/supabase';
import { Mesa } from '../../../core/models';
import { RealtimeChannel } from '@supabase/supabase-js';

@Component({
  selector: 'app-lista-espera',
  templateUrl: './lista-espera.page.html',
  styleUrls: ['./lista-espera.page.scss'],
  imports: [
    IonHeader, IonToolbar, IonTitle, IonContent, IonButton, IonIcon,
    IonSpinner, IonText, IonButtons, IonBackButton,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ListaEsperaPage implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly supabase = inject(SupabaseService);
  readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly usuario = this.authService.usuario;
  yaEnEspera = signal(false);
  mesaAsignada = signal<Mesa | null>(null);
  cargando = signal(false);
  errorGeneral = signal('');

  private canal?: RealtimeChannel;

  constructor() {
    addIcons({ timeOutline, hourglassOutline, checkmarkCircleOutline, barChartOutline });
    this.destroyRef.onDestroy(() => {
      if (this.canal) this.supabase.client.removeChannel(this.canal);
    });
  }

  async ngOnInit() {
    await this.verificarEstado();
    this.suscribirCambios();
  }

  async verificarEstado() {
    const usuario = this.authService.getUsuarioActual();
    if (!usuario) return;
    const { data } = await this.supabase.client
      .from('lista_espera').select('*, mesas(*)')
      .eq('usuario_id', usuario.id).order('fecha_ingreso', { ascending: false }).limit(1).single();
    if (!data) return;
    if (data.estado === 'esperando') {
      this.yaEnEspera.set(true);
    } else if (data.estado === 'asignado' && data.mesas) {
      this.mesaAsignada.set(data.mesas as Mesa);
    }
  }

  suscribirCambios() {
    const usuario = this.authService.getUsuarioActual();
    if (!usuario) return;
    this.canal = this.supabase.client
      .channel('espera_cliente')
      .on('postgres_changes', {
        event: 'UPDATE', schema: 'public', table: 'lista_espera',
        filter: `usuario_id=eq.${usuario.id}`,
      }, () => this.verificarEstado())
      .subscribe();
  }

  async anotarse() {
    this.errorGeneral.set('');
    const usuario = this.authService.getUsuarioActual();
    if (!usuario) return;
    try {
      this.cargando.set(true);
      const { error } = await this.supabase.client.from('lista_espera').insert({
        nombre: `${usuario.nombre} ${usuario.apellido}`,
        foto: usuario.foto || null, tipo_cliente: 'registrado',
        usuario_id: usuario.id, estado: 'esperando',
      });
      if (error) throw error;
      this.yaEnEspera.set(true);
    } catch (e: unknown) {
      this.errorGeneral.set((e as Error).message || 'Error al anotarse en la lista de espera.');
    } finally {
      this.cargando.set(false);
    }
  }

  ir(ruta: string) { this.router.navigate([ruta]); }
}
