import { Component } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { Notificacion } from '../../services/notificacion';

@Component({
  selector: 'app-notification-modal',
  standalone: true,
  imports: [AsyncPipe],
  templateUrl: './toast-notification.html',
})
export class ToastNotificationComponent {
  constructor(public notificacion: Notificacion) {}
}
