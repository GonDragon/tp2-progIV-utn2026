import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { Router } from '@angular/router';
import { PublicacionItem } from '../../services/publicaciones';
import { UsuarioToken } from '../../services/autenticacion';
import { NombreArchivoPipe } from '../../pipes/nombre-archivo-pipe';
import { CensuraPipe } from '../../pipes/censura-pipe';

@Component({
  selector: 'app-icono',
  templateUrl: './icono.html',
  styleUrl: './icono.css',
  imports: [NombreArchivoPipe, CensuraPipe],
  host: {
    '[title]': 'publicacion?.contenido || ""',
  },
})
export class IconoComponent {
  private router = inject(Router);

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

  abrirPublicacion(): void {
    this.router.navigate(['/publicaciones'], {
      queryParams: { id: this.publicacion._id },
    });
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
