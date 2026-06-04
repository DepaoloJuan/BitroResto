import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonButton,
  IonIcon, IonSpinner, IonButtons, IonBackButton,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { downloadOutline } from 'ionicons/icons';
import * as QRCode from 'qrcode';
import { AuthService } from '../../../core/services/auth';

@Component({
  selector: 'app-qr-entrada',
  templateUrl: './qr-entrada.page.html',
  styleUrls: ['./qr-entrada.page.scss'],
  imports: [
    IonHeader, IonToolbar, IonTitle, IonContent, IonButton,
    IonIcon, IonSpinner, IonButtons, IonBackButton,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class QrEntradaPage implements OnInit {
  private readonly authService = inject(AuthService);

  qrEntrada = signal('');
  backHref = signal('/dueno');

  constructor() {
    addIcons({ downloadOutline });
    const usuario = this.authService.getUsuarioActual();
    if (usuario?.perfil === 'supervisor') this.backHref.set('/supervisor');
  }

  async ngOnInit() {
    const qrUrl = await QRCode.toDataURL('com.bitroresto.app://entrada', { width: 300 });
    this.qrEntrada.set(qrUrl);
  }

  descargar() {
    const link = document.createElement('a');
    link.href = this.qrEntrada();
    link.download = 'qr-entrada-local.png';
    link.click();
  }
}
