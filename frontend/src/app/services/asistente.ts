import { Injectable, signal } from '@angular/core';

const MENSAJES_ASISTENTE: Record<string, string> = {
  'campo-comentario': 'Recuerda que todos van a poder leer lo que escribas aquí.',
  'contraseña': 'Hint: Si olvidaste tu contraseña, puedes ir olvidándote también de tu cuenta.',
  'boton-enviar': '¿No te vas a arrepentir?'
};

@Injectable({
  providedIn: 'root',
})
export class AsistenteService {
  private visibleState = signal(false);
  private mensajeState = signal('');

  readonly visible = this.visibleState.asReadonly();
  readonly mensaje = this.mensajeState.asReadonly();

  mostrarHint(clave: string): void {
    const texto = MENSAJES_ASISTENTE[clave];
    if (!texto) {
      this.mensajeState.set('No tengo comentarios al respecto...');
      this.visibleState.set(true);
      return;
    }

    this.mensajeState.set(texto);
    this.visibleState.set(true);
  }

  ocultarHint(): void {
    this.visibleState.set(false);
  }
}
