import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-gestion-usuarios',
  imports: [CommonModule],
  templateUrl: './gestion-usuarios.html',
  styleUrl: './gestion-usuarios.css',
})
export class GestionUsuarios {
  @Output() cerrar = new EventEmitter<void>();

  cerrarVentana(): void {
    this.cerrar.emit();
  }
}
