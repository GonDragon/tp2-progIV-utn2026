import { Directive, inject, input, computed } from '@angular/core';
import { AutenticacionService } from '../services/autenticacion';

export type TipoRol = 'anonimo' | 'usuario' | 'admin';

@Directive({
  selector: '[appControlRol]',
  host: {
    '[hidden]': '!tienePermiso()',
    '[style.display]': 'tienePermiso() ? null : "none"',
  },
})
export class ControlRol {
  private authService = inject(AutenticacionService);

  rolesPermitidos = input.required<TipoRol | TipoRol[]>({ alias: 'appControlRol' });

  private rolActual = computed<TipoRol>(() => {
    const usuario = this.authService.getUsuarioActual();

    if (!usuario) return 'anonimo';
    if (usuario.rol === 'admin') return 'admin';
    return 'usuario';
  });

  protected tienePermiso = computed(() => {
    const permitidos = this.rolesPermitidos();
    const actual = this.rolActual();

    return Array.isArray(permitidos) ? permitidos.includes(actual) : permitidos === actual;
  });
}
