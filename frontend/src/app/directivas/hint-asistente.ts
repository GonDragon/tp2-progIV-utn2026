import { Directive, inject, input } from '@angular/core';
import { AsistenteService } from '../services/asistente'; // Ajusta la ruta

@Directive({
  selector: '[appHintAsistente]',
  host: {
    '(mouseenter)': 'onMouseEnter()',
    '(mouseleave)': 'onMouseLeave()',
  },
})
export class HintAsistente {
  private asistenteService = inject(AsistenteService);

  // Recibe el identificador pasado al atributo: appHintAsistente="campo-texto"
  claveHint = input.required<string>({ alias: 'appHintAsistente' });

  protected onMouseEnter(): void {
    this.asistenteService.mostrarHint(this.claveHint());
  }

  protected onMouseLeave(): void {
    this.asistenteService.ocultarHint();
  }
}
