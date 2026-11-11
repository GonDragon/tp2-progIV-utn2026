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
import { ImgService } from '../../services/img';
import { HttpErrorResponse } from '@angular/common/http';
import { environment } from '../../../environments/environment';

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
  private imgService = inject(ImgService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  cargando = false;
  subiendoImagen = false;
  errorRegistro = '';
  errorImagen = '';

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
      urlFoto: [''],
    },
    { validators: passwordsMatchValidator },
  );

  onFileChange(event: Event) {
    const element = event.target as HTMLInputElement;
    if (element.files && element.files.length > 0) {
      const file = element.files[0];
      this.subiendoImagen = true;
      this.errorImagen = '';
      this.cdr.detectChanges();

      this.imgService.upload(file).subscribe({
        next: (res) => {
          this.subiendoImagen = false;
          const apiBaseUrl = (environment.URL_BACKEND || '/api').replace(/\/+$/, '');
          const imgUrl = res.url.startsWith('/') ? res.url : `/${res.url}`;
          this.registroForm.patchValue({
            urlFoto: `${apiBaseUrl}${imgUrl}`,
          });
          this.cdr.detectChanges();
        },
        error: (err: HttpErrorResponse) => {
          this.subiendoImagen = false;
          this.errorImagen =
            err.error?.message || 'Error al subir la imagen de perfil.';
          this.cdr.detectChanges();
          console.error('Error al subir imagen:', err);
        },
      });
    }
  }

  onSubmit() {
    if (this.registroForm.invalid || this.subiendoImagen) {
      this.registroForm.markAllAsTouched();
      return;
    }

    this.cargando = true;
    this.errorRegistro = '';

    // Extraemos los valores. repetirContrasenia se ignora para el payload
    const formValue = this.registroForm.value;

    let urlFoto = formValue.urlFoto || '';
    if (urlFoto && !urlFoto.startsWith('http://') && !urlFoto.startsWith('https://')) {
      const apiBaseUrl = (environment.URL_BACKEND || '/api').replace(/\/+$/, '');
      const imgUrl = urlFoto.startsWith('/') ? urlFoto : `/${urlFoto}`;
      urlFoto = `${apiBaseUrl}${imgUrl}`;
    }

    const payload = {
      nombre: formValue.nombre!,
      apellido: formValue.apellido!,
      email: formValue.email!,
      username: formValue.username!,
      password: formValue.password!,
      fechaNacimiento: formValue.fechaNacimiento!,
      descripcion: formValue.descripcion!,
      urlFoto,
      perfil: formValue.perfil || 'usuario',
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
