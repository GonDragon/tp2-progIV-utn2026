import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ListaUsuarios } from './lista-usuarios/lista-usuarios';
import { AltaUsuario } from './alta-usuario/alta-usuario';

@Component({
  selector: 'app-gestion-usuarios',
  imports: [CommonModule, ListaUsuarios, AltaUsuario],
  templateUrl: './gestion-usuarios.html',
  styleUrl: './gestion-usuarios.css',
})
export class GestionUsuarios {
  @Output() cerrar = new EventEmitter<void>();

  tabActiva: 'lista' | 'alta' = 'lista';

  cambiarTab(tab: 'lista' | 'alta'): void {
    this.tabActiva = tab;
  }

  cerrarVentana(): void {
    this.cerrar.emit();
  }
}
