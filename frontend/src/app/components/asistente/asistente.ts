import { Component, inject } from '@angular/core';
import { AsistenteService } from '../../services/asistente';

@Component({
  selector: 'app-asistente',
  standalone: true,
  imports: [],
  templateUrl: './asistente.html',
  styleUrl: './asistente.css',
})
export class Asistente {
  protected asistente = inject(AsistenteService);
}
