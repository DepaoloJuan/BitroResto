import { Injectable } from '@angular/core';
import { LocalNotifications } from '@capacitor/local-notifications';
// import { PushNotifications } from '@capacitor/push-notifications';

@Injectable({ providedIn: 'root' })
export class NotificacionesService {
  private fcmToken: string | null = null;

  async inicializar() {
    await LocalNotifications.requestPermissions();
    // Push notifications deshabilitadas hasta configurar Firebase
    // await this.inicializarPush();
  }

  // private async inicializarPush() {
  //   const permission = await PushNotifications.requestPermissions();
  //   if (permission.receive !== 'granted') return;
  //   await PushNotifications.register();
  //   PushNotifications.addListener('registration', (token) => {
  //     this.fcmToken = token.value;
  //     console.log('FCM Token:', token.value);
  //   });
  //   PushNotifications.addListener('pushNotificationReceived', (notification) => {
  //     console.log('Push recibida:', notification);
  //   });
  // }

  getFcmToken(): string | null {
    return this.fcmToken;
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
