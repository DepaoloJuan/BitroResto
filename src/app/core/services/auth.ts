import { inject, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Usuario } from '../models';
import { SupabaseService } from './supabase';
import { AudioService } from './audio';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly supabase = inject(SupabaseService);
  private readonly router = inject(Router);
  private readonly audio = inject(AudioService);

  private readonly _usuario = signal<Usuario | null>(null);
  readonly usuario = this._usuario.asReadonly();

  constructor() {
    const anonimo = sessionStorage.getItem('usuario_anonimo');
    if (anonimo) {
      this._usuario.set(JSON.parse(anonimo));
    }
  }

  getUsuarioActual(): Usuario | null {
    return this._usuario();
  }

  setUsuarioAnonimo(usuario: Usuario | null): void {
    this._usuario.set(usuario);
    if (usuario) {
      sessionStorage.setItem('usuario_anonimo', JSON.stringify(usuario));
    } else {
      sessionStorage.removeItem('usuario_anonimo');
    }
  }

  async login(email: string, password: string): Promise<Usuario> {
    const { data, error } = await this.supabase.client.auth.signInWithPassword({ email, password });
    if (error) throw error;

    const { data: usuario, error: errorUsuario } = await this.supabase.client
      .from('usuarios')
      .select('*')
      .eq('auth_id', data.user.id)
      .single();

    if (errorUsuario) throw errorUsuario;
    if (usuario.estado !== 'aprobado') {
      throw new Error('Tu cuenta está pendiente de aprobación o fue rechazada.');
    }

    this._usuario.set(usuario as Usuario);
    return usuario as Usuario;
  }

  async logout(): Promise<void> {
    this.audio.reproducirCierre();
    await this.supabase.client.auth.signOut();
    this._usuario.set(null);
    this.router.navigate(['/login']);
  }

  redirigirSegunPerfil(perfil: string): void {
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
    this.router.navigate([rutas[perfil] ?? '/login']);
  }
}
