import { Directive, ElementRef, inject } from '@angular/core';

const REGEX_CARACTER_VALIDO = /^[a-zA-Z0-9áéíóúÁÉÍÓÚñÑüÜ .;:()\-_!#]$/;
const REGEX_LIMPIAR_TEXTO = /[^a-zA-Z0-9áéíóúÁÉÍÓÚñÑüÜ .;:()\-_!#]/g;

@Directive({
  selector: '[appControlInput]',
  host: {
    '(beforeinput)': 'onBeforeInput($event)',
    '(input)': 'onInput($event)',
  },
})
export class ControlInput {
  private el = inject(ElementRef<HTMLInputElement | HTMLTextAreaElement>);

  // 1. Intercepta antes de que el carácter se escriba en el DOM
  protected onBeforeInput(event: InputEvent): void {
    // Si es borrado, salto de línea o no trae texto insertado (ej. Ctrl+Z), dejamos pasar
    if (!event.data) return;

    // Si alguno de los caracteres que intenta entrar no cumple la regex, cancelamos el evento
    for (const char of event.data) {
      if (!REGEX_CARACTER_VALIDO.test(char)) {
        event.preventDefault();
        return;
      }
    }
  }

  // 2. Red de seguridad: limpia el valor si el usuario pegó texto (Ctrl+V) o usó autocompletado
  protected onInput(event: Event): void {
    const input = this.el.nativeElement;
    const valorOriginal = input.value;
    const valorLimpio = valorOriginal.replace(REGEX_LIMPIAR_TEXTO, '');

    if (valorOriginal !== valorLimpio) {
      const posicionCursor = input.selectionStart;
      input.value = valorLimpio;

      // Restaura la posición del cursor para que no salte al final
      if (posicionCursor !== null) {
        const diferencia = valorOriginal.length - valorLimpio.length;
        input.setSelectionRange(posicionCursor - diferencia, posicionCursor - diferencia);
      }

      // Dispara el evento 'input' nuevamente para que Angular se entere del valor limpio
      input.dispatchEvent(new Event('input', { bubbles: true }));
    }
  }
}
