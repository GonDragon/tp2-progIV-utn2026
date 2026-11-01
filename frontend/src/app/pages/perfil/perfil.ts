import { Component, OnInit, OnDestroy, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { UsuarioService, Usuario } from '../../services/usuario';
import {
  PublicacionesService,
  PublicacionItem,
} from '../../services/publicaciones';
import {
  AutenticacionService,
  UsuarioToken,
} from '../../services/autenticacion';
import { Notificacion } from '../../services/notificacion';
import { PublicacionComponent } from '../../components/publicacion/publicacion';

@Component({
  selector: 'app-perfil',
  standalone: true,
  imports: [CommonModule, RouterLink, PublicacionComponent],
  templateUrl: './perfil.html',
  styleUrl: './perfil.css',
})
export class Perfil implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private usuarioService = inject(UsuarioService);
  private publicacionesService = inject(PublicacionesService);
  private authService = inject(AutenticacionService);
  private notificacion = inject(Notificacion);
  private cdr = inject(ChangeDetectorRef);

  private routeSub?: Subscription;

  usuario: Usuario | null = null;
  publicaciones: PublicacionItem[] = [];
  cargandoUsuario = true;
  cargandoPublicaciones = false;
  error: string | null = null;
  fotoError = false;

  usuarioActual: UsuarioToken | null = null;
  esMiPerfil = false;
  likesLocales: Set<string> = new Set<string>();

  ngOnInit(): void {
    this.usuarioActual = this.authService.getUsuarioActual();
    this.cargarLikesLocales();

    this.routeSub = this.route.paramMap.subscribe((params) => {
      this.fotoError = false;
      this.error = null;
      this.publicaciones = [];
      const paramUsuario = params.get('usuario');

      if (!paramUsuario) {
        // Ruta /perfil a secas
        if (!this.authService.isLoggedIn()) {
          this.router.navigate(['/publicaciones']);
          return;
        }

        this.esMiPerfil = true;
        const current = this.authService.getUsuarioActual();
        if (current?.sub) {
          this.cargarUsuarioPorId(current.sub);
        } else if (current?.username) {
          this.cargarUsuarioPorUsername(current.username);
        } else {
          this.router.navigate(['/publicaciones']);
        }
      } else {
        // Ruta /perfil/:usuario
        this.esMiPerfil =
          !!this.usuarioActual &&
          this.usuarioActual.username?.toLowerCase() === paramUsuario.toLowerCase();
        this.cargarUsuarioPorUsername(paramUsuario);
      }
    });
  }

  ngOnDestroy(): void {
    this.routeSub?.unsubscribe();
  }

  cargarUsuarioPorId(id: string): void {
    this.cargandoUsuario = true;
    this.usuarioService.getById(id).subscribe({
      next: (user) => {
        this.usuario = user;
        this.cargandoUsuario = false;
        this.cdr.detectChanges();
        if (user._id) {
          this.cargarPublicacionesUsuario(user._id);
        }
      },
      error: (err) => {
        this.cargandoUsuario = false;
        this.error = 'No se pudo cargar la información del usuario.';
        this.cdr.detectChanges();
        console.error('Error al cargar usuario por id:', err);
      },
    });
  }

  cargarUsuarioPorUsername(username: string): void {
    this.cargandoUsuario = true;
    this.usuarioService.getByUsername(username).subscribe({
      next: (user) => {
        this.usuario = user;
        this.cargandoUsuario = false;
        this.cdr.detectChanges();
        if (user._id) {
          this.cargarPublicacionesUsuario(user._id);
        }
      },
      error: (err) => {
        this.cargandoUsuario = false;
        this.error = 'Usuario no encontrado.';
        this.cdr.detectChanges();
        console.error('Error al cargar usuario por username:', err);
      },
    });
  }

  cargarPublicacionesUsuario(autorId: string): void {
    this.cargandoPublicaciones = true;
    this.publicacionesService
      .getPublicaciones({
        autor: autorId,
        limit: 3,
      })
      .subscribe({
        next: (data) => {
          this.publicaciones = data || [];
          this.cargandoPublicaciones = false;
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.cargandoPublicaciones = false;
          this.cdr.detectChanges();
          console.error('Error al cargar publicaciones del usuario:', err);
        },
      });
  }

  getIniciales(): string {
    if (!this.usuario) return '?';
    if (this.usuario.nombre && this.usuario.apellido) {
      return (
        this.usuario.nombre.charAt(0) + this.usuario.apellido.charAt(0)
      ).toUpperCase();
    }
    if (this.usuario.nombre) {
      return this.usuario.nombre.charAt(0).toUpperCase();
    }
    if (this.usuario.username) {
      return this.usuario.username.charAt(0).toUpperCase();
    }
    return '?';
  }

  onImgError(): void {
    this.fotoError = true;
  }

  onDarLike(pub: PublicacionItem): void {
    if (!this.authService.isLoggedIn()) {
      this.notificacion.showWarning('Debes iniciar sesión para dar me gusta');
      return;
    }

    this.publicacionesService.darLike(pub._id).subscribe({
      next: () => {
        pub.likes += 1;
        this.likesLocales.add(pub._id);
        this.guardarLikesLocales();
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error al dar like:', err);
      },
    });
  }

  onQuitarLike(pub: PublicacionItem): void {
    if (!this.authService.isLoggedIn()) {
      this.notificacion.showWarning('Debes iniciar sesión');
      return;
    }

    this.publicacionesService.quitarLike(pub._id).subscribe({
      next: () => {
        pub.likes = Math.max(0, pub.likes - 1);
        this.likesLocales.delete(pub._id);
        this.guardarLikesLocales();
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error al quitar like:', err);
      },
    });
  }

  onEliminar(pub: PublicacionItem): void {
    this.publicacionesService.borrar(pub._id).subscribe({
      next: () => {
        this.notificacion.showInfo('Publicación eliminada correctamente');
        this.publicaciones = this.publicaciones.filter((p) => p._id !== pub._id);
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error al eliminar publicación:', err);
      },
    });
  }

  estaLikeada(pubId: string): boolean {
    return this.likesLocales.has(pubId);
  }

  private cargarLikesLocales(): void {
    const userId = this.usuarioActual?.sub;
    if (!userId) {
      this.likesLocales.clear();
      return;
    }

    try {
      const stored = localStorage.getItem(`liked_pubs_${userId}`);
      if (stored) {
        const arr = JSON.parse(stored);
        this.likesLocales = new Set<string>(arr);
      }
    } catch {
      this.likesLocales = new Set<string>();
    }
  }

  private guardarLikesLocales(): void {
    const userId = this.usuarioActual?.sub;
    if (!userId) return;

    try {
      const arr = Array.from(this.likesLocales);
      localStorage.setItem(`liked_pubs_${userId}`, JSON.stringify(arr));
    } catch (e) {
      console.error('Error al guardar likes locales:', e);
    }
  }
}
