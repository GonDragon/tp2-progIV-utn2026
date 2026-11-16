import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EstPublicaciones } from './est-publicaciones/est-publicaciones';
import { EstComentarios } from './est-comentarios/est-comentarios';
import { EstComentariosPorPub } from './est-comentarios-por-pub/est-comentarios-por-pub';

@Component({
  selector: 'app-estadisticas',
  imports: [CommonModule, EstPublicaciones, EstComentarios, EstComentariosPorPub],
  templateUrl: './estadisticas.html',
  styleUrl: './estadisticas.css',
})
export class Estadisticas {
  @Output() cerrar = new EventEmitter<void>();

  tabActiva: 'publicaciones' | 'comentarios' | 'comentarios-por-pub' = 'publicaciones';

  cambiarTab(tab: 'publicaciones' | 'comentarios' | 'comentarios-por-pub'): void {
    this.tabActiva = tab;
  }

  cerrarVentana(): void {
    this.cerrar.emit();
  }
}
