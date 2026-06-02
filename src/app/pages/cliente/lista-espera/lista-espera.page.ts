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
  IonSpinner,
  IonText,
  IonButtons,
  IonBackButton,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  timeOutline,
  hourglassOutline,
  checkmarkCircleOutline,
  barChartOutline,
} from 'ionicons/icons';
import { AuthService } from '../../../core/services/auth';
import { SupabaseService } from '../../../core/services/supabase';

@Component({
  selector: 'app-lista-espera',
  templateUrl: './lista-espera.page.html',
  styleUrls: ['./lista-espera.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButton,
    IonIcon,
    IonSpinner,
    IonText,
    IonButtons,
    IonBackButton,
  ],
})
export class ListaEsperaPage implements OnInit {
  usuario: any;
  yaEnEspera = false;
  mesaAsignada: any = null;
  cargando = false;
  errorGeneral = '';

  constructor(
    private authService: AuthService,
    private supabase: SupabaseService,
    public router: Router,
  ) {
    addIcons({ timeOutline, hourglassOutline, checkmarkCircleOutline, barChartOutline });
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
      .eq('usuario_id', this.usuario.id)
      .order('fecha_ingreso', { ascending: false })
      .limit(1)
      .single();

    if (!data) return;

    if (data.estado === 'esperando') {
      this.yaEnEspera = true;
    } else if (data.estado === 'asignado' && data.mesas) {
      this.mesaAsignada = data.mesas;
    }
  }

  suscribirCambios() {
    this.supabase.client
      .channel('espera_cliente')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'lista_espera',
          filter: `usuario_id=eq.${this.usuario.id}`,
        },
        () => {
          this.verificarEstado();
        },
      )
      .subscribe();
  }

  async anotarse() {
    this.errorGeneral = '';
    try {
      this.cargando = true;

      const { error } = await this.supabase.client.from('lista_espera').insert({
        nombre: `${this.usuario.nombre} ${this.usuario.apellido}`,
        foto: this.usuario.foto || null,
        tipo_cliente: 'registrado',
        usuario_id: this.usuario.id,
        estado: 'esperando',
      });

      if (error) throw error;

      this.yaEnEspera = true;
    } catch (error: any) {
      this.errorGeneral =
        error.message || 'Error al anotarse en la lista de espera.';
    } finally {
      this.cargando = false;
    }
  }

  ir(ruta: string) {
    this.router.navigate([ruta]);
  }
}
