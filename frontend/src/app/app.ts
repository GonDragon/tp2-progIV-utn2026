import { Component, signal } from '@angular/core';
import { Layout } from './components/layout/layout';
import { ToastNotificationComponent } from './components/toast-notification/toast-notification';

@Component({
  imports: [Layout, ToastNotificationComponent ],
  selector: 'app-root',
  styleUrl: './app.css',
  templateUrl: './app.html',
})
export class App {
  protected readonly title = signal('frontend');
}
