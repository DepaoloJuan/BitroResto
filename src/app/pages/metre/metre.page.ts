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
import { peopleOutline, logOutOutline } from 'ionicons/icons';
import { AuthService } from '../../core/services/auth';

@Component({
  selector: 'app-metre',
  templateUrl: './metre.page.html',
  styleUrls: ['./metre.page.scss'],
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
export class MetrePage implements OnInit {
  usuario: any;

  constructor(
    private authService: AuthService,
    private router: Router,
  ) {
    addIcons({ peopleOutline, logOutOutline });
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
