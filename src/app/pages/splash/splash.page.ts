import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { IonContent } from '@ionic/angular/standalone';
import { AudioService } from '../../core/services/audio';
import { NotificacionesService } from '../../core/services/notificaciones';

@Component({
  selector: 'app-splash',
  templateUrl: './splash.page.html',
  styleUrls: ['./splash.page.scss'],
  imports: [IonContent],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SplashPage implements OnInit {
  private readonly router = inject(Router);
  private readonly audio = inject(AudioService);
  private readonly notificaciones = inject(NotificacionesService);

  animando = signal(false);
  mostrarTexto = signal(false);
  mostrarIntegrantes = signal(false);

  async ngOnInit() {
    await this.notificaciones.inicializar();
    this.audio.reproducirInicio();
    setTimeout(() => this.animando.set(true), 300);
    setTimeout(() => this.mostrarTexto.set(true), 600);
    setTimeout(() => this.mostrarIntegrantes.set(true), 1000);
    setTimeout(() => this.router.navigate(['/login']), 3500);
  }
}
