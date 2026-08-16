import { HttpInterceptorFn, HttpErrorResponse, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

const AUTH_ENDPOINT_PATTERN = /\/auth\/(login|register|refresh-token|forgot-password|reset-password|resend-verification)/;

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const token = authService.getToken();

  const authReq: HttpRequest<unknown> = token
    ? req.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`
        }
      })
    : req;

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401 && !AUTH_ENDPOINT_PATTERN.test(req.url)) {
        authService.purgeSession();
        window.location.reload();
      }
      return throwError(() => error);
    })
  );
};
