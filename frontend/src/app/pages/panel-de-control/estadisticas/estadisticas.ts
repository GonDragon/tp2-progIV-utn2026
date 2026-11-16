import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-estadisticas',
  imports: [CommonModule],
  templateUrl: './estadisticas.html',
  styleUrl: './estadisticas.css',
})
export class Estadisticas {
  @Output() cerrar = new EventEmitter<void>();

  cerrarVentana(): void {
    this.cerrar.emit();
  }
}
