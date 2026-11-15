import { Component, EventEmitter, Input, Output } from '@angular/core';
import { PublicacionItem } from '../../services/publicaciones';
import { UsuarioToken } from '../../services/autenticacion';

@Component({
  selector: 'app-icono',
  templateUrl: './icono.html',
  styleUrl: './icono.css',
})
export class IconoComponent {
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
    const esAdmin = this.usuarioActual.rol === 'admin';

    return esAutor || esAdmin;
  }

  toggleLike(event?: Event): void {
    event?.stopPropagation();
    if (this.leGusta) {
      this.quitarLike.emit(this.publicacion);
    } else {
      this.like.emit(this.publicacion);
    }
  }

  confirmarEliminar(event?: Event): void {
    event?.stopPropagation();
    if (confirm('¿Estás seguro de que deseas eliminar esta publicación?')) {
      this.eliminar.emit(this.publicacion);
    }
  }
}
