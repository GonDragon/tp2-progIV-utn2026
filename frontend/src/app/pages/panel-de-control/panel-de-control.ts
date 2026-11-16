import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Estadisticas } from './estadisticas/estadisticas';
import { GestionUsuarios } from './gestion-usuarios/gestion-usuarios';

@Component({
  selector: 'app-panel-de-control',
  imports: [CommonModule, Estadisticas, GestionUsuarios],
  templateUrl: './panel-de-control.html',
  styleUrl: './panel-de-control.css',
})
export class PanelDeControl {
  modalActivo: 'usuarios' | 'estadisticas' | null = null;

  abrirModalUsuarios(): void {
    this.modalActivo = 'usuarios';
  }

  abrirModalEstadisticas(): void {
    this.modalActivo = 'estadisticas';
  }

  cerrarModal(): void {
    this.modalActivo = null;
  }
}
