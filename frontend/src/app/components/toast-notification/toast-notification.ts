import { Component } from '@angular/core';
import { AsyncPipe, NgClass } from '@angular/common';
import { Notificacion } from '../../services/notificacion';

@Component({
  selector: 'app-notification-modal',
  standalone: true,
  imports: [AsyncPipe, NgClass],
  templateUrl: './toast-notification.html',
})
export class ToastNotificationComponent {
  constructor(public notificacion: Notificacion) {}
}
