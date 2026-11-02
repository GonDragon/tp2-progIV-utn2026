import { Component, EventEmitter, Input, Output } from '@angular/core';
import { DatePipe, NgClass, NgIf } from '@angular/common';
import { PublicacionItem } from '../../services/publicaciones';
import { UsuarioToken } from '../../services/autenticacion';

@Component({
  selector: 'app-publicacion',
  standalone: true,
  imports: [DatePipe, NgIf, NgClass],
  templateUrl: './publicacion.html',
  styleUrl: './publicacion.css',
})
export class PublicacionComponent {
  @Input({ required: true }) publicacion!: PublicacionItem;
  @Input() usuarioActual: UsuarioToken | null = null;
  @Input() leGusta: boolean = false;

  @Output() like = new EventEmitter<PublicacionItem>();
  @Output() quitarLike = new EventEmitter<PublicacionItem>();
  @Output() eliminar = new EventEmitter<PublicacionItem>();

  get puedeEliminar(): boolean {
    if (!this.usuarioActual) return false;
    const autorId =
      typeof this.publicacion.autor === 'object' && this.publicacion.autor !== null
        ? this.publicacion.autor._id
        : (this.publicacion.autor as string);

    const esAutor = autorId?.toString() === this.usuarioActual.sub?.toString();
    const esAdmin =
      this.usuarioActual.rol === 'administrador' || this.usuarioActual.rol === 'admin';

    return esAutor || esAdmin;
  }

  get autorNombre(): string {
    if (typeof this.publicacion.autor === 'object' && this.publicacion.autor !== null) {
      return (
        this.publicacion.autor.nombre ||
        this.publicacion.autor.username ||
        'Usuario'
      );
    }
    return 'Usuario';
  }

  get autorUsername(): string {
    if (typeof this.publicacion.autor === 'object' && this.publicacion.autor !== null) {
      return this.publicacion.autor.username || '';
    }
    return '';
  }

  toggleLike(): void {
    if (this.leGusta) {
      this.quitarLike.emit(this.publicacion);
    } else {
      this.like.emit(this.publicacion);
    }
  }

  confirmarEliminar(): void {
    if (confirm('¿Estás seguro de que deseas eliminar esta publicación?')) {
      this.eliminar.emit(this.publicacion);
    }
  }
}
