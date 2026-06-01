import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  IonIcon,
  IonButtons,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  hourglassOutline,
  checkmarkCircleOutline,
  logOutOutline,
  barChartOutline,
} from 'ionicons/icons';
import { AuthService } from '../../../core/services/auth';
import { SupabaseService } from '../../../core/services/supabase';

@Component({
  selector: 'app-anonimo-espera',
  templateUrl: './anonimo-espera.page.html',
  styleUrls: ['./anonimo-espera.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButton,
    IonIcon,
    IonButtons,
  ],
})
export class AnonimoEsperaPage implements OnInit {
  usuario: any;
  mesaAsignada: any = null;

  constructor(
    private authService: AuthService,
    private supabase: SupabaseService,
    private router: Router,
  ) {
    addIcons({
      hourglassOutline,
      checkmarkCircleOutline,
      logOutOutline,
      barChartOutline,
    });
  }

  async ngOnInit() {
    this.usuario = this.authService.getUsuarioActual();
    await this.verificarEstado();
    this.suscribirCambios();
  }

  async verificarEstado() {
    const { data } = await this.supabase.client
      .from('lista_espera')
      .select('*, mesas(*)')
      .eq('nombre', this.usuario.nombre)
      .eq('tipo_cliente', 'anonimo')
      .in('estado', ['esperando', 'asignado'])
      .order('fecha_ingreso', { ascending: false })
      .limit(1)
      .single();

    if (!data) return;

    if (data.estado === 'asignado' && data.mesas) {
      this.mesaAsignada = data.mesas;
      this.authService.setUsuarioAnonimo({
        ...this.usuario,
        mesa_id: data.mesa_id,
        lista_espera_id: data.id,
      });
    }
  }

  suscribirCambios() {
    this.supabase.client
      .channel('anonimo_espera')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'lista_espera',
        },
        () => this.verificarEstado(),
      )
      .subscribe();
  }

  irAMesa() {
    this.router.navigate(['/cliente/mesa']);
  }

  verEncuestas() {
    this.router.navigate(['/cliente/encuesta-resultados']);
  }

  salir() {
    this.authService.setUsuarioAnonimo(null);
    this.router.navigate(['/login']);
  }
}
