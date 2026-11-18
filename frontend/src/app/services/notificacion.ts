import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export type NotificationType = 'info' | 'warning' | 'error';

export interface NotificationState {
  show: boolean;
  type: NotificationType;
  message: string;
  isSessionTimer?: boolean;
  onIgnore?: () => void;
  onExtendSession?: () => void;
}

@Injectable({
  providedIn: 'root',
})
export class Notificacion {
  private state = new BehaviorSubject<NotificationState>({
    show: false,
    type: 'info',
    message: '',
    isSessionTimer: false,
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

  showSessionTimer(
    message: string,
    onIgnore?: () => void,
    onExtendSession?: () => void,
  ) {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
    const current = this.state.getValue();
    if (current.show && current.isSessionTimer) {
      this.state.next({
        ...current,
        message,
        ...(onIgnore ? { onIgnore } : {}),
        ...(onExtendSession ? { onExtendSession } : {}),
      });
      return;
    }
    this.state.next({
      show: true,
      type: 'warning',
      message,
      isSessionTimer: true,
      onIgnore,
      onExtendSession,
    });
  }

  updateSessionTimerMessage(message: string) {
    const current = this.state.getValue();
    if (current.show && current.isSessionTimer) {
      this.state.next({
        ...current,
        message,
      });
    }
  }

  cerrarSiEsSesion() {
    const current = this.state.getValue();
    if (current.show && current.isSessionTimer) {
      this.close();
    }
  }

  private display(type: NotificationType, message: string) {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }

    this.state.next({ show: true, type, message, isSessionTimer: false });

    // Se oculta automáticamente después de 3.5 segundos
    this.timeoutId = setTimeout(() => {
      this.close();
    }, 3500);
  }

  close() {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
    this.state.next({ show: false, type: 'info', message: '', isSessionTimer: false });
  }
}
