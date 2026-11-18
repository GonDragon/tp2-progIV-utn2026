import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { Notificacion } from '../services/notificacion';
import { AutenticacionService } from '../services/autenticacion';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const notificationService = inject(Notificacion);
  const authService = inject(AutenticacionService);
  const router = inject(Router);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        authService.logout();
        router.navigate(['/login']);
      }

      let errorMsg = 'Ocurrió un error inesperado';

      if (error.status === 0) {
        errorMsg =
          'No hay conexión con el servidor. Revisá tu internet o si el backend está encendido.';
      } else if (error.status === 500) {
        errorMsg = 'Error interno del servidor. Intentá más tarde.';
      } else if (error.error && error.error.message) {
        // Backend manda un { message: "..." }
        errorMsg = error.error.message;
      }

      if (errorMsg === 'Unauthorized') {
        errorMsg = 'Debes iniciar sesión.';
      }

      notificationService.showError(errorMsg);

      // Deja que el error siga su curso hacia el componente
      return throwError(() => error);
    }),
  );
};
