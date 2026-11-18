import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'nombreArchivo',
})
export class NombreArchivoPipe implements PipeTransform {
  transform(value: string): string {
    if (!value) {
      return '';
    }
    return value.toLowerCase().replace(/ /g, '_') + '.jpg';
  }
}
