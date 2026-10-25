import { Component, inject, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AutenticacionService } from '../../services/autenticacion';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './login.html',
})
export class Login {
  private fb = inject(FormBuilder);
  private authService = inject(AutenticacionService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  cargando = false;
  errorLogin = '';

  loginForm = this.fb.group({
    username: ['', [Validators.required]],
    password: [
      '',
      [
        Validators.required,
        Validators.minLength(8),
        // Validar al menos una letra mayúscula y al menos un número
        Validators.pattern(/^(?=.*[A-Z])(?=.*\d).*$/),
      ],
    ],
  });

  onSubmit() {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.cargando = true;
    this.errorLogin = '';

    const { username, password } = this.loginForm.value;

    this.authService.login({ username: username!, password: password! }).subscribe({
      next: () => {
        this.cargando = false;
        this.cdr.detectChanges();
        this.router.navigate(['/publicaciones']);
      },
      error: (err) => {
        this.cargando = false;
        this.cdr.detectChanges();
        this.errorLogin = 'Credenciales inválidas o error de conexión.';
        console.error(err);
      },
    });
  }
}
