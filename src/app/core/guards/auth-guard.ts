import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth';

export const AuthGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const usuario = authService.getUsuarioActual();

  if (usuario) {
    return true;
  }

  router.navigate(['/login']);
  return false;
};
