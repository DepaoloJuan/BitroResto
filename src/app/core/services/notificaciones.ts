import { Injectable } from '@angular/core';
import { LocalNotifications } from '@capacitor/local-notifications';

@Injectable({ providedIn: 'root' })
export class NotificacionesService {
  async inicializar() {
    await LocalNotifications.requestPermissions();
  }

  async enviar(titulo: string, cuerpo: string) {
    await LocalNotifications.schedule({
      notifications: [
        {
          id: Date.now(),
          title: titulo,
          body: cuerpo,
          schedule: { at: new Date(Date.now() + 100) },
        },
      ],
    });
  }
}
