import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AutenticacionService } from '../../services/autenticacion';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './layout.html',
  styleUrls: ['./layout.css'],
})
export class Layout {
  private authService = inject(AutenticacionService);
  private router = inject(Router);

  public esPantallaCarga(): boolean {
    const url = this.router.url.split('?')[0];
    return url === '' || url === '/' || url === '/loading';
  }

  public logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
