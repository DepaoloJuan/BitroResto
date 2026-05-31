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
import * as QRCode from 'qrcode';
import { SupabaseService } from '../../../core/services/supabase';

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

  constructor(private supabase: SupabaseService) {
    addIcons({ downloadOutline });
  }

  async ngOnInit() {
    const { data } = await this.supabase.client
      .from('mesas')
      .select('qr_codigo')
      .eq('tipo', 'entrada')
      .single();

    if (data?.qr_codigo) {
      // Generar imagen QR a partir del string estático guardado en BD
      this.qrEntrada = await QRCode.toDataURL(data.qr_codigo);
    }
  }

  descargar() {
    const link = document.createElement('a');
    link.href = this.qrEntrada;
    link.download = 'qr-entrada-local.png';
    link.click();
  }
}
