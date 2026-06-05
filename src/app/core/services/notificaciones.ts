import { Injectable } from '@angular/core';
import { LocalNotifications } from '@capacitor/local-notifications';

@Injectable({ providedIn: 'root' })
export class NotificacionesService {
  private permisoConcedido = false;

  async inicializar() {
    try {
      const resultado = await LocalNotifications.requestPermissions();
      this.permisoConcedido = resultado.display === 'granted';
    } catch {
      this.permisoConcedido = false;
    }
  }

  async enviar(titulo: string, cuerpo: string) {
    if (!this.permisoConcedido) return;
    try {
      await LocalNotifications.schedule({
        notifications: [
          {
            id: Date.now() % 2147483647,
            title: titulo,
            body: cuerpo,
            schedule: { at: new Date(Date.now() + 1000) },
          },
        ],
      });
    } catch {
      // Notificación fallida — no interrumpir el flujo principal
    }
  }
}
