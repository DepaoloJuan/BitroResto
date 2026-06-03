import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonButton,
  IonIcon, IonGrid, IonRow, IonCol, IonCard, IonCardContent,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { peopleOutline, personAddOutline, gridOutline, qrCodeOutline, cashOutline, logOutOutline } from 'ionicons/icons';
import { AuthService } from '../../core/services/auth';
import { Usuario } from '../../core/models';

@Component({
  selector: 'app-dueno',
  templateUrl: './dueno.page.html',
  styleUrls: ['./dueno.page.scss'],
  imports: [
    IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonButton,
    IonIcon, IonGrid, IonRow, IonCol, IonCard, IonCardContent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DuenoPage implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly usuario = this.authService.usuario;

  constructor() {
    addIcons({ peopleOutline, personAddOutline, gridOutline, qrCodeOutline, cashOutline, logOutOutline });
  }

  ngOnInit() {}

  ir(ruta: string) { this.router.navigate([ruta]); }
  async cerrarSesion() { await this.authService.logout(); }
}
