import { Pipe, PipeTransform } from '@angular/core';

const PALABRAS_CENSURADAS = ['ipsum', 'avestruz', 'censura'];

@Pipe({
  name: 'censura',
})
export class CensuraPipe implements PipeTransform {

  transform(value: string): string {
    if (!value) {
      return '';
    }

    let resultado = value;
    for (const palabra of PALABRAS_CENSURADAS) {
      const regex = new RegExp(palabra, 'gi');
      resultado = resultado.replace(regex, '███████');
    }

    return resultado;
  }
}
