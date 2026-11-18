import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { AutenticacionService } from '../../services/autenticacion';
import { timer, forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Component({
  selector: 'app-loading',
  standalone: true,
  imports: [],
  templateUrl: './loading.html',
  styleUrls: ['./loading.css'],
})
export class Loading implements OnInit {
  private authService = inject(AutenticacionService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  ngOnInit(): void {
    this.validarCredenciales();
  }

  private validarCredenciales(): void {
    const timer$ = timer(2000);
    const token = this.authService.getToken();
    const id = this.authService.getUsuarioId();

    if (token && id && this.authService.isLoggedIn()) {
      forkJoin({
        auth: this.authService.validateToken(id).pipe(
          catchError(() => of(null))
        ),
        delay: timer$,
      }).subscribe({
        next: ({ auth }) => {
          if (auth) {
            this.authService.iniciarTimerSesion();
            this.cdr.detectChanges();
            this.router.navigate(['/publicaciones']);
          } else {
            this.authService.logout();
            this.cdr.detectChanges();
            this.router.navigate(['/login']);
          }
        },
        error: () => {
          this.authService.logout();
          this.cdr.detectChanges();
          this.router.navigate(['/login']);
        },
      });
    } else {
      timer$.subscribe(() => {
        this.authService.logout();
        this.cdr.detectChanges();
        this.router.navigate(['/login']);
      });
    }
  }
}
