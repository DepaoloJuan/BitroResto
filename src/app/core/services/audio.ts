import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class AudioService {

  private reproducir(archivo: string) {
    const audio = new Audio(`assets/sounds/${archivo}`);
    audio.play().catch(() => {});
  }

  reproducirInicio() {
    this.reproducir('inicio.mp3');
  }

  reproducirCierre() {
    this.reproducir('cierre.mp3');
  }
}
