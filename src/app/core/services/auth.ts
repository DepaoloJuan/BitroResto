import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { SupabaseService } from './supabase';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private usuarioActual: any = null;

  constructor(
    private supabase: SupabaseService,
    private router: Router,
  ) {
    const anonimo = sessionStorage.getItem('usuario_anonimo');
    if (anonimo) {
      this.usuarioActual = JSON.parse(anonimo);
    }
  }

  getUsuarioActual() {
    return this.usuarioActual;
  }

  setUsuarioAnonimo(usuario: any) {
    this.usuarioActual = usuario;
    if (usuario) {
      sessionStorage.setItem('usuario_anonimo', JSON.stringify(usuario));
    } else {
      sessionStorage.removeItem('usuario_anonimo');
    }
  }

  async login(email: string, password: string) {
    const { data, error } = await this.supabase.client.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;

    // Buscar datos del usuario en nuestra tabla
    const { data: usuario, error: errorUsuario } = await this.supabase.client
      .from('usuarios')
      .select('*')
      .eq('auth_id', data.user.id)
      .single();

    if (errorUsuario) throw errorUsuario;

    if (usuario.estado !== 'aprobado') {
      throw new Error(
        'Tu cuenta está pendiente de aprobación o fue rechazada.',
      );
    }

    this.usuarioActual = usuario;
    return usuario;
  }

  async logout() {
    await this.supabase.client.auth.signOut();
    this.usuarioActual = null;
    this.router.navigate(['/login']);
  }

  redirigirSegunPerfil(perfil: string) {
    const rutas: Record<string, string> = {
      dueño: '/dueno',
      supervisor: '/supervisor',
      metre: '/metre',
      mozo: '/mozo',
      cocinero: '/cocinero',
      cantinero: '/cantinero',
      bartender: '/cantinero',
      cliente: '/cliente/home',
    };

    const ruta = rutas[perfil] || '/login';
    this.router.navigate([ruta]);
  }
}
