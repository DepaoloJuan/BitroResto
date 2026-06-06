import { inject, Injectable } from '@angular/core';
import { PushNotifications, Token } from '@capacitor/push-notifications';
import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';
import { SupabaseService } from './supabase';

@Injectable({ providedIn: 'root' })
export class NotificacionesService {
  private readonly supabase = inject(SupabaseService);
  private tokenFCM: string | null = null;
  private permisoConcedido = false;

  // Llamado desde splash — solo pide permisos y guarda el token en memoria
  async inicializar() {
    if (!Capacitor.isNativePlatform()) return;

    // Permisos locales primero para que enviar() funcione cuando llegue una push en primer plano
    try {
      const res = await LocalNotifications.requestPermissions();
      this.permisoConcedido = res.display === 'granted';
    } catch {
      this.permisoConcedido = false;
    }

    try {
      await PushNotifications.removeAllListeners();

      const resultado = await PushNotifications.requestPermissions();
      if (resultado.receive !== 'granted') return;

      await PushNotifications.register();

      await PushNotifications.addListener('registration', (token: Token) => {
        this.tokenFCM = token.value;
      });

      await PushNotifications.addListener('pushNotificationReceived', (notification) => {
        // App en primer plano — mostrar como notificación local
        this.enviar(notification.title ?? 'BitroResto', notification.body ?? '');
      });

    } catch (e) {
      console.warn('Push notifications no disponible:', e);
    }
  }

  async enviarPorPerfil(perfiles: string[], titulo: string, cuerpo: string) {
    try {
      const { data } = await this.supabase.client
        .from('usuarios').select('push_token').in('perfil', perfiles).not('push_token', 'is', null);
      const tokens = (data ?? []).map((u: any) => u.push_token).filter(Boolean);
      if (!tokens.length) return;
      await this.supabase.client.functions.invoke('enviar-push', { body: { tokens, titulo, cuerpo } });
    } catch (e) {
      console.warn('Error enviando push por perfil:', e);
    }
  }

  async enviarAUsuario(usuarioId: string, titulo: string, cuerpo: string) {
    try {
      const { data } = await this.supabase.client
        .from('usuarios').select('push_token').eq('id', usuarioId).maybeSingle();
      if (!data?.push_token) return;
      await this.supabase.client.functions.invoke('enviar-push', { body: { tokens: [data.push_token], titulo, cuerpo } });
    } catch (e) {
      console.warn('Error enviando push a usuario:', e);
    }
  }

  // Llamado desde AuthService después del login exitoso
  async guardarToken(usuarioId: string) {
    if (!this.tokenFCM) return;
    try {
      await this.supabase.client
        .from('usuarios')
        .update({ push_token: this.tokenFCM })
        .eq('id', usuarioId);
    } catch (e) {
      console.warn('Error guardando push token:', e);
    }
  }

  // Notificación local — se usa cuando la app está en primer plano
  async enviar(titulo: string, cuerpo: string) {
    if (!this.permisoConcedido) return;
    try {
      await LocalNotifications.schedule({
        notifications: [{
          id: Date.now() % 2147483647,
          title: titulo,
          body: cuerpo,
          schedule: { at: new Date(Date.now() + 500) },
        }],
      });
    } catch {
      // No interrumpir el flujo principal
    }
  }
}
