import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AutenticacionService } from '../../services/autenticacion';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './login.html',
  host: {
    style: 'display: block; margin: auto!important; max-width: 400px',
  },
})
export class Login {
  private fb = inject(FormBuilder);
  private authService = inject(AutenticacionService);
  private router = inject(Router);

  // Estados pasados a Signals
  cargando = signal(false);
  errorLogin = signal('');

  loginForm = this.fb.group({
    username: ['', [Validators.required]],
    password: ['', [Validators.required]],
  });

  onSubmit() {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.cargando.set(true);
    this.errorLogin.set('');

    const { username, password } = this.loginForm.value;

    this.authService.login({ username: username!, password: password! }).subscribe({
      next: () => {
        this.cargando.set(false);
        this.router.navigate(['/publicaciones']);
      },
      error: (err) => {
        this.cargando.set(false);
        this.errorLogin.set('Credenciales inválidas o error de conexión.');
        console.error(err);
      },
    });
  }
}
