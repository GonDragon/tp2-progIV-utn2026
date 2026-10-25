import { Component, inject, ChangeDetectorRef } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AutenticacionService } from '../../services/autenticacion';
import { HttpErrorResponse } from '@angular/common/http';

// Validador personalizado para confirmar que las contraseñas coincidan
function passwordsMatchValidator(control: AbstractControl): ValidationErrors | null {
  const password = control.get('password')?.value;
  const repetir = control.get('repetirContrasenia')?.value;
  return password === repetir ? null : { passwordsMismatch: true };
}

@Component({
  selector: 'app-registro',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './registro.html',
})
export class Registro {
  private fb = inject(FormBuilder);
  private authService = inject(AutenticacionService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  cargando = false;
  errorRegistro = '';

  registroForm = this.fb.group(
    {
      nombre: ['', [Validators.required]],
      apellido: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      username: ['', [Validators.required]],
      password: [
        '',
        [
          Validators.required,
          Validators.minLength(8),
          Validators.pattern(/^(?=.*[A-Z])(?=.*\d).*$/),
        ],
      ],
      repetirContrasenia: ['', [Validators.required]],
      fechaNacimiento: ['', [Validators.required]],
      descripcion: ['', [Validators.required, Validators.maxLength(250)]],
      perfil: ['usuario'], // Campo oculto con valor por defecto
      urlFoto: [''], // El input file actualizará esto de forma decorativa por ahora
    },
    { validators: passwordsMatchValidator },
  );

  // Placeholder del INPUT File
  onFileChange(event: Event) {
    const element = event.target as HTMLInputElement;
    if (element.files && element.files.length > 0) {
      // Como es decorativo de momento, solo simulamos capturar un nombre o URL local
      this.registroForm.patchValue({
        urlFoto: element.files[0].name,
      });
    }
  }

  onSubmit() {
    if (this.registroForm.invalid) {
      this.registroForm.markAllAsTouched();
      return;
    }

    this.cargando = true;
    this.errorRegistro = '';

    // Extraemos los valores. repetirContrasenia se ignora para el payload
    const formValue = this.registroForm.value;

    const payload = {
      nombre: formValue.nombre!,
      apellido: formValue.apellido!,
      email: formValue.email!,
      username: formValue.username!,
      password: formValue.password!,
      fechaNacimiento: formValue.fechaNacimiento!,
      descripcion: formValue.descripcion!,
      profile: formValue.perfil!,
      urlFoto: formValue.urlFoto || '',
    };

    this.authService.registro(payload).subscribe({
      next: () => {
        this.cargando = false;
        this.cdr.detectChanges();
        this.router.navigate(['/publicaciones']);
      },
      error: (err: HttpErrorResponse) => {
        this.cargando = false;
        this.errorRegistro = err.error?.message || 'Error al registrar el usuario.';
        this.cdr.detectChanges();
        console.error('Detalle del error:', err);
      },
    });
  }
}
