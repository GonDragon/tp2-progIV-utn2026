import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export type NotificationType = 'info' | 'warning' | 'error';

export interface NotificationState {
  show: boolean;
  type: NotificationType;
  message: string;
}

@Injectable({
  providedIn: 'root',
})
export class Notificacion {
  private state = new BehaviorSubject<NotificationState>({
    show: false,
    type: 'info',
    message: '',
  });
  state$ = this.state.asObservable();

  // Guardamos el ID del timeout para poder reiniciarlo
  private timeoutId: ReturnType<typeof setTimeout> | null = null;

  showInfo(message: string) {
    this.display('info', message);
  }

  showWarning(message: string) {
    this.display('warning', message);
  }

  showError(message: string) {
    this.display('error', message);
  }

  private display(type: NotificationType, message: string) {
    this.state.next({ show: true, type, message });

    // Si ya había un toast visible, cancelamos su temporizador de cierre
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
    }

    // Se oculta automáticamente después de 3.5 segundos
    this.timeoutId = setTimeout(() => {
      this.close();
    }, 3500);
  }

  close() {
    this.state.next({ show: false, type: 'info', message: '' });
  }
}
