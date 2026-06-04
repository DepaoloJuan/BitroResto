import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth';

// Qué perfiles pueden acceder a cada prefijo de ruta
const PERMISOS: Record<string, string[]> = {
  dueno: ['dueño'],
  supervisor: ['supervisor'],
  metre: ['metre'],
  mozo: ['mozo'],
  cocinero: ['cocinero'],
  cantinero: ['cantinero', 'bartender'],
  cliente: ['cliente'],
};

export const AuthGuard: CanActivateFn = (route) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const usuario = authService.getUsuarioActual();

  if (!usuario) {
    router.navigate(['/login']);
    return false;
  }

  // Obtener el primer segmento de la ruta para determinar el área
  const url = route.url.map((s) => s.path).join('/');
  const prefijo = url.split('/')[0];

  const perfilesPermitidos = PERMISOS[prefijo];

  // Si la ruta no tiene restricción de perfil específica, solo verificar login
  if (!perfilesPermitidos) return true;

  // Verificar que el perfil del usuario coincide
  if (perfilesPermitidos.includes(usuario.perfil)) return true;

  // Perfil incorrecto — redirigir a su propia ruta
  const rutasPorPerfil: Record<string, string> = {
    dueño: '/dueno',
    supervisor: '/supervisor',
    metre: '/metre',
    mozo: '/mozo',
    cocinero: '/cocinero',
    cantinero: '/cantinero',
    bartender: '/bartender',
    cliente: '/cliente/home',
  };

  const rutaPropia = rutasPorPerfil[usuario.perfil] || '/login';
  router.navigate([rutaPropia]);
  return false;
};
