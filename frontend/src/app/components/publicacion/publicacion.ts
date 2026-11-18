import {
  Component,
  EventEmitter,
  Input,
  Output,
  OnInit,
  OnChanges,
  SimpleChanges,
  inject,
  ChangeDetectorRef,
} from '@angular/core';
import { DatePipe, NgClass, NgIf, NgFor } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  ComentarioItem,
  PublicacionesService,
  PublicacionItem,
} from '../../services/publicaciones';
import { AutenticacionService, UsuarioToken } from '../../services/autenticacion';
import { CensuraPipe } from '../../pipes/censura-pipe';
import { ControlInput } from '../../directivas/control-input';
import { HintAsistente } from '../../directivas/hint-asistente';

@Component({
  selector: 'app-publicacion',
  standalone: true,
  imports: [DatePipe, NgIf, NgFor, NgClass, FormsModule, CensuraPipe, ControlInput, HintAsistente],
  templateUrl: './publicacion.html',
  styleUrl: './publicacion.css',
})
export class PublicacionComponent implements OnInit, OnChanges {
  private publicacionesService = inject(PublicacionesService);
  private authService = inject(AutenticacionService);
  private cdr = inject(ChangeDetectorRef);

  @Input({ required: true }) publicacion!: PublicacionItem;
  @Input() usuarioActual: UsuarioToken | null = null;
  @Input() leGusta: boolean = false;

  @Output() like = new EventEmitter<PublicacionItem>();
  @Output() quitarLike = new EventEmitter<PublicacionItem>();
  @Output() cerrar = new EventEmitter<void>();

  // Estado de comentarios
  comentarios: ComentarioItem[] = [];
  cargandoComentarios: boolean = false;
  cargandoMasComentarios: boolean = false;
  paginaActualComentarios: number = 1;
  limiteComentarios: number = 10;
  hayMasComentarios: boolean = false;

  // Estado de nuevo comentario
  nuevoComentarioTexto: string = '';
  enviandoComentario: boolean = false;

  // Estado de edición de comentario
  comentarioEditandoId: string | null = null;
  textoEdicion: string = '';
  guardandoEdicion: boolean = false;

  ngOnInit(): void {
    this.cargarComentarios();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['publicacion'] && !changes['publicacion'].firstChange) {
      this.paginaActualComentarios = 1;
      this.comentarioEditandoId = null;
      this.textoEdicion = '';
      this.nuevoComentarioTexto = '';
      this.cargarComentarios();
      this.cdr.detectChanges();
    }
  }

  get autorNombre(): string {
    if (typeof this.publicacion.autor === 'object' && this.publicacion.autor !== null) {
      return this.publicacion.autor.nombre || this.publicacion.autor.username || 'Usuario';
    }
    return 'Usuario';
  }

  get autorUsername(): string {
    if (typeof this.publicacion.autor === 'object' && this.publicacion.autor !== null) {
      return this.publicacion.autor.username || '';
    }
    return '';
  }

  get estaLogueado(): boolean {
    return this.authService.isLoggedIn();
  }

  getUsuarioIdActual(): string | null {
    if (this.usuarioActual?.sub) return this.usuarioActual.sub;
    const user = this.authService.getUsuarioActual();
    return user?.sub || null;
  }

  getIdUsuarioComentario(comentario: ComentarioItem): string {
    if (!comentario.id_usuario) return '';
    if (typeof comentario.id_usuario === 'object' && comentario.id_usuario !== null) {
      return comentario.id_usuario._id || '';
    }
    return String(comentario.id_usuario);
  }

  esMiComentario(comentario: ComentarioItem): boolean {
    const miId = this.getUsuarioIdActual();
    if (!miId) return false;
    const autorId = this.getIdUsuarioComentario(comentario);
    return miId.toString() === autorId.toString();
  }

  getUsernameUsuario(comentario: ComentarioItem): string {
    if (typeof comentario.id_usuario === 'object' && comentario.id_usuario !== null) {
      return comentario.id_usuario.username || comentario.id_usuario.nombre || 'Usuario';
    }
    return 'Usuario';
  }

  getFotoUsuario(comentario: ComentarioItem): string | null {
    if (typeof comentario.id_usuario === 'object' && comentario.id_usuario !== null) {
      return comentario.id_usuario.urlFoto || null;
    }
    return null;
  }

  getInicialesUsuario(comentario: ComentarioItem): string {
    const username = this.getUsernameUsuario(comentario);
    return username ? username.charAt(0).toUpperCase() : 'U';
  }

  cargarComentarios(): void {
    if (!this.publicacion || !this.publicacion._id) return;
    this.cargandoComentarios = true;
    this.paginaActualComentarios = 1;
    this.cdr.detectChanges();
    this.publicacionesService
      .getComentarios(this.publicacion._id, {
        page: 1,
        limit: this.limiteComentarios,
      })
      .subscribe({
        next: (comentarios) => {
          this.comentarios = comentarios || [];
          this.hayMasComentarios = (comentarios?.length || 0) === this.limiteComentarios;
          this.cargandoComentarios = false;
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Error al cargar comentarios:', err);
          this.cargandoComentarios = false;
          this.cdr.detectChanges();
        },
      });
  }

  cargarMasComentarios(): void {
    if (
      !this.publicacion ||
      !this.publicacion._id ||
      this.cargandoMasComentarios ||
      !this.hayMasComentarios
    ) {
      return;
    }

    this.cargandoMasComentarios = true;
    this.cdr.detectChanges();
    const siguientePagina = this.paginaActualComentarios + 1;
    this.publicacionesService
      .getComentarios(this.publicacion._id, {
        page: siguientePagina,
        limit: this.limiteComentarios,
      })
      .subscribe({
        next: (nuevosComentarios) => {
          const batch = nuevosComentarios || [];
          this.comentarios = [...this.comentarios, ...batch];
          this.paginaActualComentarios = siguientePagina;
          this.hayMasComentarios = batch.length === this.limiteComentarios;
          this.cargandoMasComentarios = false;
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Error al cargar más comentarios:', err);
          this.cargandoMasComentarios = false;
          this.cdr.detectChanges();
        },
      });
  }

  enviarComentario(): void {
    const texto = this.nuevoComentarioTexto.trim();
    if (!texto || this.enviandoComentario || !this.publicacion?._id) return;

    this.enviandoComentario = true;
    this.cdr.detectChanges();
    this.publicacionesService.agregarComentario(this.publicacion._id, texto).subscribe({
      next: () => {
        this.nuevoComentarioTexto = '';
        this.enviandoComentario = false;
        this.paginaActualComentarios = 1;
        this.cargarComentarios();
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error al enviar comentario:', err);
        this.enviandoComentario = false;
        this.cdr.detectChanges();
      },
    });
  }

  activarEdicion(comentario: ComentarioItem): void {
    this.comentarioEditandoId = comentario._id;
    this.textoEdicion = comentario.contenido;
    this.cdr.detectChanges();
  }

  guardarEdicion(comentario: ComentarioItem): void {
    const texto = this.textoEdicion.trim();
    if (!texto || this.guardandoEdicion) return;

    this.guardandoEdicion = true;
    this.cdr.detectChanges();
    this.publicacionesService.modificarComentario(comentario._id, texto).subscribe({
      next: () => {
        comentario.contenido = texto;
        comentario.modificado = true;
        this.comentarioEditandoId = null;
        this.textoEdicion = '';
        this.guardandoEdicion = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error al modificar comentario:', err);
        this.guardandoEdicion = false;
        this.cdr.detectChanges();
      },
    });
  }

  toggleLike(): void {
    if (this.leGusta) {
      this.quitarLike.emit(this.publicacion);
    } else {
      this.like.emit(this.publicacion);
    }
  }

  cerrarModal(): void {
    this.cerrar.emit();
  }
}
