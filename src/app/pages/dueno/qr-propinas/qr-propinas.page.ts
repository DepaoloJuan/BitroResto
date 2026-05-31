import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonHeader, IonToolbar, IonTitle, IonContent,
  IonButton, IonIcon, IonSpinner, IonButtons, IonBackButton,
  IonList, IonItem, IonLabel
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { downloadOutline, starOutline } from 'ionicons/icons';
import * as QRCode from 'qrcode';
import { SupabaseService } from '../../../core/services/supabase';

@Component({
  selector: 'app-qr-propinas',
  templateUrl: './qr-propinas.page.html',
  styleUrls: ['./qr-propinas.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonHeader, IonToolbar, IonTitle, IonContent,
    IonButton, IonIcon, IonSpinner, IonButtons, IonBackButton,
    IonList, IonItem, IonLabel
  ]
})
export class QrPropinasPage implements OnInit {
  qrPropinas = '';

  constructor(private supabase: SupabaseService) {
    addIcons({ downloadOutline, starOutline });
  }

  async ngOnInit() {
    const { data } = await this.supabase.client
      .from('mesas')
      .select('qr_codigo')
      .eq('tipo', 'propinas')
      .single();

    if (data?.qr_codigo) {
      this.qrPropinas = await QRCode.toDataURL(data.qr_codigo);
    }
  }

  descargar() {
    const link = document.createElement('a');
    link.href = this.qrPropinas;
    link.download = 'qr-propinas.png';
    link.click();
  }
}
