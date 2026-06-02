import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  IonIcon,
  IonSpinner,
  IonButtons,
  IonBackButton,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { downloadOutline } from 'ionicons/icons';
import { SupabaseService } from '../../../core/services/supabase';
import { AuthService } from '../../../core/services/auth';

@Component({
  selector: 'app-qr-entrada',
  templateUrl: './qr-entrada.page.html',
  styleUrls: ['./qr-entrada.page.scss'],
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
    IonButtons,
    IonBackButton,
  ],
})
export class QrEntradaPage implements OnInit {
  qrEntrada = '';
  backHref = '/dueno';

  constructor(
    private supabase: SupabaseService,
    private authService: AuthService,
  ) {
    addIcons({ downloadOutline });
    const usuario = this.authService.getUsuarioActual();
    if (usuario?.perfil === 'supervisor') {
      this.backHref = '/supervisor';
    }
  }

  async ngOnInit() {
    const { data } = await this.supabase.client
      .from('mesas')
      .select('qr_codigo')
      .eq('tipo', 'entrada')
      .single();

    if (data?.qr_codigo) {
      this.qrEntrada = data.qr_codigo;
    }
  }

  descargar() {
    const link = document.createElement('a');
    link.href = this.qrEntrada;
    link.download = 'qr-entrada-local.png';
    link.click();
  }
}
