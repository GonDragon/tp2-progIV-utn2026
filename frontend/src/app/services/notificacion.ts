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

  showInfo(message: string) {
    this.state.next({ show: true, type: 'info', message });
  }

  showWarning(message: string) {
    this.state.next({ show: true, type: 'warning', message });
  }

  showError(message: string) {
    this.state.next({ show: true, type: 'error', message });
  }

  close() {
    this.state.next({ show: false, type: 'info', message: '' });
  }
}
