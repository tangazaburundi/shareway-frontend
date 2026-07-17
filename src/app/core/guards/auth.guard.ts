import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { AdminAuthService } from '../services/admin.auth.service';

export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (auth.isAuthenticated()) return true;
  router.navigate(['/auth/login']);
  return false;
};

/*
export const adminGuard: CanActivateFn = () => {
  const adminAuth = inject(AdminAuthService);
  const router = inject(Router);
  if (adminAuth.isLoggedIn() && adminAuth.hasRole('ADMIN', 'SUPER_ADMIN', 'MODERATOR')) return true;
  return router.createUrlTree(['/auth/login']);
 // router.navigate(['/auth/login']);
 /// return false;
};
 */

export const guestGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (!auth.isAuthenticated()) return true;
  router.navigate(['/']);
  return false;
};

export const driverGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const user = auth.currentUser();
  if (user?.role === 'DRIVER' || user?.role === 'BOTH') return true;
  router.navigate(['/trips']);
  return false;
};
