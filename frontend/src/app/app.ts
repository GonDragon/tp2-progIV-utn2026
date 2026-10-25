import { Component, signal } from '@angular/core';
import { Layout } from './components/layout/layout';
import { NotificationModalComponent } from './components/modal-notificacion/modal-notificacion';

@Component({
  imports: [Layout, NotificationModalComponent ],
  selector: 'app-root',
  styleUrl: './app.css',
  templateUrl: './app.html',
})
export class App {
  protected readonly title = signal('frontend');
}
