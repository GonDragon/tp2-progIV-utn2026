import { Component, inject, ChangeDetectorRef, OnInit } from '@angular/core';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { PublicacionesService } from '../../services/publicaciones';
import { AutenticacionService } from '../../services/autenticacion';
import { ImgService } from '../../services/img';
import { Notificacion } from '../../services/notificacion';
import { HttpErrorResponse } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { ControlInput } from '../../directivas/control-input';

@Component({
  selector: 'app-publicacion',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, ControlInput],
  templateUrl: './publicacion.html',
  styleUrl: './publicacion.css',
  host: {
    style:
      'display: flex; margin: auto!important; max-width: 600px; min-height: 100%; justify-content: center; align-items: center; flex-direction: column;',
  },
})
export class Publicacion implements OnInit {
  private fb = inject(FormBuilder);
  private publicacionesService = inject(PublicacionesService);
  private authService = inject(AutenticacionService);
  private imgService = inject(ImgService);
  private notificacion = inject(Notificacion);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  cargando = false;
  subiendoImagen = false;
  errorPublicacion = '';
  errorImagen = '';

  publicacionForm = this.fb.group({
    titulo: ['', [Validators.required]],
    contenido: [''],
    url_imagen: ['', [Validators.required]],
  });

  ngOnInit(): void {
    if (!this.authService.isLoggedIn()) {
      this.notificacion.showWarning('Debes iniciar sesión para crear una publicación.');
      this.router.navigate(['/login']);
    }
  }

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
          this.publicacionForm.patchValue({
            url_imagen: `${apiBaseUrl}${imgUrl}`,
          });
          this.publicacionForm.get('url_imagen')?.markAsTouched();
          this.cdr.detectChanges();
        },
        error: (err: HttpErrorResponse) => {
          this.subiendoImagen = false;
          this.errorImagen = err.error?.message || 'Error al subir la imagen de la publicación.';
          this.cdr.detectChanges();
          console.error('Error al subir imagen:', err);
        },
      });
    }
  }

  onSubmit() {
    if (this.publicacionForm.invalid || this.subiendoImagen) {
      this.publicacionForm.markAllAsTouched();
      return;
    }

    this.cargando = true;
    this.errorPublicacion = '';

    const formValue = this.publicacionForm.value;

    let url_imagen = formValue.url_imagen || '';
    if (url_imagen && !url_imagen.startsWith('http://') && !url_imagen.startsWith('https://')) {
      const apiBaseUrl = (environment.URL_BACKEND || '/api').replace(/\/+$/, '');
      const imgUrl = url_imagen.startsWith('/') ? url_imagen : `/${url_imagen}`;
      url_imagen = `${apiBaseUrl}${imgUrl}`;
    }

    const payload = {
      titulo: formValue.titulo!,
      contenido: formValue.contenido || '',
      url_imagen,
    };

    this.publicacionesService.publicar(payload).subscribe({
      next: () => {
        this.cargando = false;
        this.notificacion.showInfo('Publicación creada con éxito.');
        this.cdr.detectChanges();
        this.router.navigate(['/publicaciones']);
      },
      error: (err: HttpErrorResponse) => {
        this.cargando = false;
        this.errorPublicacion = err.error?.message || 'Error al crear la publicación.';
        this.cdr.detectChanges();
        console.error('Detalle del error:', err);
      },
    });
  }
}
