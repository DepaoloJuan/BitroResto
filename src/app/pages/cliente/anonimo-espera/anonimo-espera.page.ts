import { ChangeDetectionStrategy, Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonButton, IonIcon, IonButtons,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { hourglassOutline, checkmarkCircleOutline, logOutOutline, barChartOutline } from 'ionicons/icons';
import { AuthService } from '../../../core/services/auth';
import { SupabaseService } from '../../../core/services/supabase';
import { Mesa } from '../../../core/models';
import { RealtimeChannel } from '@supabase/supabase-js';

@Component({
  selector: 'app-anonimo-espera',
  templateUrl: './anonimo-espera.page.html',
  styleUrls: ['./anonimo-espera.page.scss'],
  imports: [IonHeader, IonToolbar, IonTitle, IonContent, IonButton, IonIcon, IonButtons],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AnonimoEsperaPage implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly supabase = inject(SupabaseService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly usuario = this.authService.usuario;
  mesaAsignada = signal<Mesa | null>(null);

  private canal?: RealtimeChannel;

  constructor() {
    addIcons({ hourglassOutline, checkmarkCircleOutline, logOutOutline, barChartOutline });
    this.destroyRef.onDestroy(() => {
      if (this.canal) this.supabase.client.removeChannel(this.canal);
    });
  }

  async ngOnInit() {
    await this.verificarEstado();
    this.suscribirCambios();
  }

  async verificarEstado() {
    const u = this.authService.getUsuarioActual();
    if (!u) return;
    const { data } = await this.supabase.client
      .from('lista_espera').select('*, mesas(*)')
      .eq('nombre', u.nombre).eq('tipo_cliente', 'anonimo')
      .in('estado', ['esperando', 'asignado'])
      .order('fecha_ingreso', { ascending: false }).limit(1).single();
    if (!data) return;
    if (data.estado === 'asignado' && data.mesas) {
      this.mesaAsignada.set(data.mesas as Mesa);
      this.authService.setUsuarioAnonimo({ ...u, mesa_id: data.mesa_id, lista_espera_id: data.id });
    }
  }

  suscribirCambios() {
    this.canal = this.supabase.client
      .channel('anonimo_espera')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'lista_espera' },
        () => this.verificarEstado())
      .subscribe();
  }

  irAMesa() { this.router.navigate(['/cliente/mesa']); }
  verEncuestas() { this.router.navigate(['/cliente/encuesta-resultados']); }
  salir() { this.authService.setUsuarioAnonimo(null); this.router.navigate(['/login']); }
}
