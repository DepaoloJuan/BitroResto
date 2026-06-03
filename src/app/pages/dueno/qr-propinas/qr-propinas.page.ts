import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonButton, IonIcon,
  IonSpinner, IonButtons, IonBackButton, IonList, IonItem, IonLabel,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { downloadOutline, starOutline } from 'ionicons/icons';
import * as QRCode from 'qrcode';
import { SupabaseService } from '../../../core/services/supabase';

@Component({
  selector: 'app-qr-propinas',
  templateUrl: './qr-propinas.page.html',
  styleUrls: ['./qr-propinas.page.scss'],
  imports: [
    IonHeader, IonToolbar, IonTitle, IonContent, IonButton, IonIcon,
    IonSpinner, IonButtons, IonBackButton, IonList, IonItem, IonLabel,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class QrPropinasPage implements OnInit {
  private readonly supabase = inject(SupabaseService);

  qrPropinas = signal('');

  constructor() { addIcons({ downloadOutline, starOutline }); }

  async ngOnInit() {
    const { data } = await this.supabase.client
      .from('mesas').select('qr_codigo').eq('tipo', 'propinas').single();
    if (data?.qr_codigo) {
      this.qrPropinas.set(await QRCode.toDataURL(data.qr_codigo));
    }
  }

  descargar() {
    const link = document.createElement('a');
    link.href = this.qrPropinas();
    link.download = 'qr-propinas.png';
    link.click();
  }
}
