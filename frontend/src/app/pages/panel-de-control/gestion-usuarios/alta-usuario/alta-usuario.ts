import { Component, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { Backend } from '../../../../services/backend';
import { ImgService } from '../../../../services/img';
import { Notificacion } from '../../../../services/notificacion';
import { HttpErrorResponse } from '@angular/common/http';
import { environment } from '../../../../../environments/environment';

function passwordsMatchValidator(control: AbstractControl): ValidationErrors | null {
  const password = control.get('password')?.value;
  const repetir = control.get('repetirContrasenia')?.value;
  return password === repetir ? null : { passwordsMismatch: true };
}

@Component({
  selector: 'app-alta-usuario',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  styleUrl: './alta-usuario.css',
  templateUrl: './alta-usuario.html',
})
export class AltaUsuario {
  private fb = inject(FormBuilder);
  private backend = inject(Backend);
  private imgService = inject(ImgService);
  private notificacion = inject(Notificacion);
  private cdr = inject(ChangeDetectorRef);

  cargando = false;
  subiendoImagen = false;
  errorAlta = '';
  errorImagen = '';

  altaForm = this.fb.group(
    {
      nombre: ['', [Validators.required]],
      apellido: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      username: ['', [Validators.required]],
      esAdmin: [false],
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
      perfil: ['usuario'],
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
          this.altaForm.patchValue({
            urlFoto: `${apiBaseUrl}${imgUrl}`,
          });
          this.cdr.detectChanges();
        },
        error: (err: HttpErrorResponse) => {
          this.subiendoImagen = false;
          this.errorImagen = err.error?.message || 'Error al subir la imagen de perfil.';
          this.cdr.detectChanges();
          console.error('Error al subir imagen:', err);
        },
      });
    }
  }

  onSubmit() {
    if (this.altaForm.invalid || this.subiendoImagen) {
      this.altaForm.markAllAsTouched();
      this.cdr.detectChanges();
      return;
    }

    this.cargando = true;
    this.errorAlta = '';
    this.cdr.detectChanges();

    const formValue = this.altaForm.value;

    let urlFoto = formValue.urlFoto || '';
    if (urlFoto && !urlFoto.startsWith('http://') && !urlFoto.startsWith('https://')) {
      const apiBaseUrl = (environment.URL_BACKEND || '/api').replace(/\/+$/, '');
      const imgUrl = urlFoto.startsWith('/') ? urlFoto : `/${urlFoto}`;
      urlFoto = `${apiBaseUrl}${imgUrl}`;
    }

    const payload: Record<string, any> = {
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

    if (formValue.esAdmin) {
      payload['rol'] = 'admin';
    }

    this.backend.post<{ token?: string }>('/auth/register', payload).subscribe({
      next: () => {
        this.cargando = false;
        this.notificacion.showInfo('usuario creado exitosamente');
        this.resetFormulario();
        this.cdr.detectChanges();
      },
      error: (err: HttpErrorResponse) => {
        this.cargando = false;
        this.errorAlta = err.error?.message || 'Error al crear el usuario.';
        this.cdr.detectChanges();
        console.error('Error al crear usuario:', err);
      },
    });
  }

  resetFormulario() {
    this.altaForm.reset({
      nombre: '',
      apellido: '',
      email: '',
      username: '',
      esAdmin: false,
      password: '',
      repetirContrasenia: '',
      fechaNacimiento: '',
      descripcion: '',
      perfil: 'usuario',
      urlFoto: '',
    });
    this.errorAlta = '';
    this.errorImagen = '';
    this.subiendoImagen = false;
  }
}
