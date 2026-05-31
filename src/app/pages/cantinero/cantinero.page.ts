import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonButton,
  IonIcon,
  IonGrid,
  IonRow,
  IonCol,
  IonCard,
  IonCardContent,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { wineOutline, listOutline, logOutOutline } from 'ionicons/icons';
import { AuthService } from '../../core/services/auth';

@Component({
  selector: 'app-cantinero',
  templateUrl: './cantinero.page.html',
  styleUrls: ['./cantinero.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButtons,
    IonButton,
    IonIcon,
    IonGrid,
    IonRow,
    IonCol,
    IonCard,
    IonCardContent,
  ],
})
export class CantineroPage implements OnInit {
  usuario: any;

  constructor(
    private authService: AuthService,
    private router: Router,
  ) {
    addIcons({ wineOutline, listOutline, logOutOutline });
  }

  ngOnInit() {
    this.usuario = this.authService.getUsuarioActual();
  }

  ir(ruta: string) {
    this.router.navigate([ruta]);
  }

  async cerrarSesion() {
    await this.authService.logout();
  }
}
