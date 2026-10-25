import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { Notificacion } from '../services/notificacion';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const notificationService = inject(Notificacion);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
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

      // Dispara el modal global
      notificationService.showError(errorMsg);

      // Deja que el error siga su curso hacia el componente
      return throwError(() => error);
    }),
  );
};
