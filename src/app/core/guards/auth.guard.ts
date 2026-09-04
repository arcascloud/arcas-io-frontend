import { inject } from '@angular/core';
import { CanMatchFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanMatchFn = async () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const isAuthenticated = await new Promise<boolean>((resolve) => {
    authService.checkStatus().subscribe(resolve);
  });

  if (!isAuthenticated) {
    router.navigateByUrl('/login');
    return false;
  }

  return true;
};
