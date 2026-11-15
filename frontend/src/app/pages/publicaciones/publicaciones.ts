import { Component, OnInit, OnDestroy, inject, ChangeDetectorRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { IconoComponent } from '../../components/icono/icono';
import { PublicacionComponent } from '../../components/publicacion/publicacion';
import {
  PublicacionesService,
  PublicacionItem,
} from '../../services/publicaciones';
import {
  AutenticacionService,
  UsuarioToken,
} from '../../services/autenticacion';
import { Notificacion } from '../../services/notificacion';

@Component({
  selector: 'app-publicaciones',
  standalone: true,
  imports: [CommonModule, IconoComponent, PublicacionComponent],
  templateUrl: './publicaciones.html',
  styleUrl: './publicaciones.css',
})
export class Publicaciones implements OnInit, OnDestroy {
  private publicacionesService = inject(PublicacionesService);
  private authService = inject(AutenticacionService);
  private notificacion = inject(Notificacion);
  private cdr = inject(ChangeDetectorRef);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  publicaciones: PublicacionItem[] = [];
  cargando = false;
  paginaActual = 1;
  limitePorPagina = 6;
  hayMasPublicaciones = true;
  criterioOrden: 'fecha' | 'likes' = 'fecha';

  usuarioActual: UsuarioToken | null = null;
  likesLocales: Set<string> = new Set<string>();

  publicacionModal: PublicacionItem | null = null;
  cargandoModal = false;
  private routeSub?: Subscription;

  @HostListener('document:keydown.escape')
  onEscapePress(): void {
    if (this.publicacionModal || this.cargandoModal) {
      this.cerrarModal();
    }
  }

  ngOnInit(): void {
    this.usuarioActual = this.authService.getUsuarioActual();
    this.cargarLikesLocales();
    this.cargarPublicaciones();

    this.routeSub = this.route.queryParamMap.subscribe((params) => {
      const pubId = params.get('id');
      if (pubId) {
        if (this.publicacionModal?._id === pubId) {
          return;
        }
        const encontrada = this.publicaciones.find((p) => p._id === pubId);
        if (encontrada) {
          this.publicacionModal = encontrada;
          this.cargandoModal = false;
          this.cdr.detectChanges();
        } else {
          this.cargandoModal = true;
          this.publicacionModal = null;
          this.cdr.detectChanges();
          this.publicacionesService.getPublicacion(pubId).subscribe({
            next: (data) => {
              this.publicacionModal = data;
              this.cargandoModal = false;
              this.cdr.detectChanges();
            },
            error: (err) => {
              this.cargandoModal = false;
              this.publicacionModal = null;
              this.notificacion.showWarning('No se encontró la publicación solicitada');
              this.cerrarModal();
              this.cdr.detectChanges();
              console.error('Error al cargar publicación:', err);
            },
          });
        }
      } else {
        this.publicacionModal = null;
        this.cargandoModal = false;
        this.cdr.detectChanges();
      }
    });
  }

  ngOnDestroy(): void {
    this.routeSub?.unsubscribe();
  }

  cerrarModal(): void {
    this.router.navigate(['/publicaciones'], {
      queryParams: { id: null },
      queryParamsHandling: 'merge',
    });
  }

  cambiarOrden(nuevoOrden: 'fecha' | 'likes'): void {
    if (this.criterioOrden === nuevoOrden) return;
    this.criterioOrden = nuevoOrden;
    this.paginaActual = 1;
    this.cargarPublicaciones();
  }

  cargarPublicaciones(): void {
    this.cargando = true;
    const offset = (this.paginaActual - 1) * this.limitePorPagina;
    const orderBy = this.criterioOrden === 'likes' ? 'likes' : undefined;

    this.publicacionesService
      .getPublicaciones({
        offset,
        limit: this.limitePorPagina,
        orderBy,
      })
      .subscribe({
        next: (data) => {
          this.publicaciones = data || [];
          this.hayMasPublicaciones = this.publicaciones.length === this.limitePorPagina;
          this.cargando = false;
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.cargando = false;
          this.cdr.detectChanges();
          console.error('Error al cargar publicaciones:', err);
        },
      });
  }

  paginaAnterior(): void {
    if (this.paginaActual > 1 && !this.cargando) {
      this.paginaActual--;
      this.cargarPublicaciones();
    }
  }

  paginaSiguiente(): void {
    if (this.hayMasPublicaciones && !this.cargando) {
      this.paginaActual++;
      this.cargarPublicaciones();
    }
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
        const enLista = this.publicaciones.find((p) => p._id === pub._id);
        if (enLista && enLista !== pub) {
          enLista.likes = pub.likes;
        }
        if (this.publicacionModal && this.publicacionModal._id === pub._id && this.publicacionModal !== pub) {
          this.publicacionModal.likes = pub.likes;
        }
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
        const enLista = this.publicaciones.find((p) => p._id === pub._id);
        if (enLista && enLista !== pub) {
          enLista.likes = pub.likes;
        }
        if (this.publicacionModal && this.publicacionModal._id === pub._id && this.publicacionModal !== pub) {
          this.publicacionModal.likes = pub.likes;
        }
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
        if (this.publicacionModal?._id === pub._id) {
          this.cerrarModal();
        }
        if (this.publicaciones.length === 0 && this.paginaActual > 1) {
          this.paginaActual--;
          this.cargarPublicaciones();
        } else if (this.publicaciones.length === 0) {
          this.cargarPublicaciones();
        } else {
          this.cdr.detectChanges();
        }
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
