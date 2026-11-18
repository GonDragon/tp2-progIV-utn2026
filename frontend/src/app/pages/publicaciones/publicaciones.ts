import {
  Component,
  OnInit,
  AfterViewInit,
  OnDestroy,
  inject,
  ChangeDetectorRef,
  HostListener,
  ElementRef,
} from '@angular/core';
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
export class Publicaciones implements OnInit, AfterViewInit, OnDestroy {
  private publicacionesService = inject(PublicacionesService);
  private authService = inject(AutenticacionService);
  private notificacion = inject(Notificacion);
  private cdr = inject(ChangeDetectorRef);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private elementRef = inject(ElementRef);

  publicaciones: PublicacionItem[] = [];
  cargando = false;
  limitePorPagina = 32;
  hayMasPublicaciones = true;
  criterioOrden: 'fecha' | 'likes' = 'fecha';

  usuarioActual: UsuarioToken | null = null;
  likesLocales: Set<string> = new Set<string>();

  publicacionModal: PublicacionItem | null = null;
  cargandoModal = false;
  private routeSub?: Subscription;
  private scrollCleanups: Array<() => void> = [];

  @HostListener('document:keydown.escape')
  onEscapePress(): void {
    if (this.publicacionModal || this.cargandoModal) {
      this.cerrarModal();
    }
  }

  @HostListener('window:resize')
  onWindowResize(): void {
    this.verificarYLlenarScroll();
  }

  @HostListener('window:scroll')
  onWindowScroll(): void {
    this.comprobarScrollFinal();
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

  ngAfterViewInit(): void {
    const container = this.getScrollContainer();
    if (container) {
      const scrollHandler = () => this.comprobarScrollFinal();
      container.addEventListener('scroll', scrollHandler, { passive: true });
      this.scrollCleanups.push(() => container.removeEventListener('scroll', scrollHandler));
    }
  }

  ngOnDestroy(): void {
    this.routeSub?.unsubscribe();
    this.scrollCleanups.forEach((cleanup) => cleanup());
    this.scrollCleanups = [];
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
    this.cargarPublicaciones();
  }

  cargarPublicaciones(): void {
    this.publicaciones = [];
    this.hayMasPublicaciones = true;
    this.cargarMasPublicaciones();
  }

  cargarMasPublicaciones(): void {
    if (this.cargando || !this.hayMasPublicaciones) return;

    this.cargando = true;
    const offset = this.publicaciones.length;
    const orderBy = this.criterioOrden === 'likes' ? 'likes' : undefined;

    this.publicacionesService
      .getPublicaciones({
        offset,
        limit: this.limitePorPagina,
        orderBy,
      })
      .subscribe({
        next: (data) => {
          const nuevas = data || [];
          this.publicaciones = [...this.publicaciones, ...nuevas];
          if (nuevas.length < this.limitePorPagina) {
            this.hayMasPublicaciones = false;
          }
          this.cargando = false;
          this.cdr.detectChanges();

          setTimeout(() => {
            this.verificarYLlenarScroll();
          }, 50);
        },
        error: (err) => {
          this.cargando = false;
          this.cdr.detectChanges();
          console.error('Error al cargar publicaciones:', err);
        },
      });
  }

  private getScrollContainer(): HTMLElement | null {
    const layoutMain = document.querySelector<HTMLElement>('.layout-main');
    if (layoutMain) {
      return layoutMain;
    }
    let el = this.elementRef.nativeElement.parentElement;
    while (el && el !== document.body) {
      const style = window.getComputedStyle(el);
      if (style.overflowY === 'auto' || style.overflowY === 'scroll') {
        return el;
      }
      el = el.parentElement;
    }
    return null;
  }

  private tieneScroll(): boolean {
    const container = this.getScrollContainer();
    if (container) {
      return container.scrollHeight > container.clientHeight;
    }
    return document.documentElement.scrollHeight > window.innerHeight;
  }

  private verificarYLlenarScroll(): void {
    if (this.cargando || !this.hayMasPublicaciones) return;
    if (!this.tieneScroll()) {
      this.cargarMasPublicaciones();
    }
  }

  private comprobarScrollFinal(): void {
    if (this.cargando || !this.hayMasPublicaciones) return;

    const container = this.getScrollContainer();
    if (container) {
      if (container.scrollHeight <= container.clientHeight) {
        return;
      }
      const scrollPos = container.scrollTop + container.clientHeight;
      if (scrollPos >= container.scrollHeight - 100) {
        this.cargarMasPublicaciones();
      }
    } else {
      if (document.documentElement.scrollHeight <= window.innerHeight) {
        return;
      }
      const scrollPos = (window.scrollY || document.documentElement.scrollTop) + window.innerHeight;
      if (scrollPos >= document.documentElement.scrollHeight - 100) {
        this.cargarMasPublicaciones();
      }
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
        if (this.publicaciones.length === 0) {
          this.cargarPublicaciones();
        } else {
          this.cdr.detectChanges();
          setTimeout(() => {
            this.verificarYLlenarScroll();
          }, 50);
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
