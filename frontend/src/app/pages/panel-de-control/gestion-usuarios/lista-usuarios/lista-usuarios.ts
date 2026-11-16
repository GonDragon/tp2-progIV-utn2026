import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UsuarioService, Usuario } from '../../../../services/usuario';
import { Notificacion } from '../../../../services/notificacion';

@Component({
  selector: 'app-lista-usuarios',
  imports: [CommonModule],
  templateUrl: './lista-usuarios.html',
  styleUrl: './lista-usuarios.css',
})
export class ListaUsuarios implements OnInit {
  private usuarioService = inject(UsuarioService);
  private notificacion = inject(Notificacion);
  private cdr = inject(ChangeDetectorRef);

  usuarios: Usuario[] = [];
  cargando: boolean = false;
  pagina: number = 1;
  limite: number = 10;
  togglingUsernames: Set<string> = new Set<string>();
  failedImages: Set<string> = new Set<string>();

  ngOnInit(): void {
    this.cargarUsuarios();
  }

  cargarUsuarios(): void {
    this.cargando = true;
    this.cdr.detectChanges();
    const inicial = (this.pagina - 1) * this.limite;
    this.usuarioService.getUsuarios(this.limite, inicial).subscribe({
      next: (data) => {
        this.usuarios = data || [];
        this.cargando = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.cargando = false;
        this.cdr.detectChanges();
      },
    });
  }

  paginaAnterior(): void {
    if (this.pagina > 1) {
      this.pagina--;
      this.cargarUsuarios();
    }
  }

  paginaSiguiente(): void {
    if (this.usuarios.length >= this.limite) {
      this.pagina++;
      this.cargarUsuarios();
    }
  }

  isHabilitado(usuario: Usuario): boolean {
    return usuario.habilitado !== false;
  }

  toggleHabilitado(usuario: Usuario): void {
    if (this.togglingUsernames.has(usuario.username)) {
      return;
    }

    const actualmenteHabilitado = this.isHabilitado(usuario);
    this.togglingUsernames.add(usuario.username);
    this.cdr.detectChanges();

    if (actualmenteHabilitado) {
      this.usuarioService.deshabilitar(usuario.username).subscribe({
        next: () => {
          usuario.habilitado = false;
          this.togglingUsernames.delete(usuario.username);
          this.notificacion.showInfo(`Usuario @${usuario.username} deshabilitado.`);
          this.cdr.detectChanges();
        },
        error: () => {
          this.togglingUsernames.delete(usuario.username);
          this.cdr.detectChanges();
        },
      });
    } else {
      this.usuarioService.habilitar(usuario.username).subscribe({
        next: () => {
          usuario.habilitado = true;
          this.togglingUsernames.delete(usuario.username);
          this.notificacion.showInfo(`Usuario @${usuario.username} habilitado.`);
          this.cdr.detectChanges();
        },
        error: () => {
          this.togglingUsernames.delete(usuario.username);
          this.cdr.detectChanges();
        },
      });
    }
  }

  getNombreCompleto(usuario: Usuario): string {
    const nombres = [usuario.nombre, usuario.apellido].filter(Boolean).join(' ').trim();
    return nombres || 'Sin nombre';
  }

  getIniciales(usuario: Usuario): string {
    if (usuario.nombre && usuario.apellido) {
      return (usuario.nombre[0] + usuario.apellido[0]).toUpperCase();
    }
    if (usuario.nombre) {
      return usuario.nombre.slice(0, 2).toUpperCase();
    }
    if (usuario.username) {
      return usuario.username.slice(0, 2).toUpperCase();
    }
    return 'U';
  }

  onImageError(username: string): void {
    this.failedImages.add(username);
    this.cdr.detectChanges();
  }
}
