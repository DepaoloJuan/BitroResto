import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonButton,
  IonIcon, IonGrid, IonRow, IonCol, IonCard, IonCardContent,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { wineOutline, listOutline, logOutOutline } from 'ionicons/icons';
import { AuthService } from '../../core/services/auth';

@Component({
  selector: 'app-cantinero',
  templateUrl: './cantinero.page.html',
  styleUrls: ['./cantinero.page.scss'],
  imports: [
    IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonButton,
    IonIcon, IonGrid, IonRow, IonCol, IonCard, IonCardContent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CantineroPage {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly usuario = this.authService.usuario;

  constructor() { addIcons({ wineOutline, listOutline, logOutOutline }); }

  ir(ruta: string) { this.router.navigate([ruta]); }
  async cerrarSesion() { await this.authService.logout(); }
}
