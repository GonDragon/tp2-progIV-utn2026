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
  @Output() cerrar = new EventEmitter<void>();

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

  cerrarModal(): void {
    this.cerrar.emit();
  }
}
