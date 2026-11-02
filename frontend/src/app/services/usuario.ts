import { Injectable, inject } from '@angular/core';
import { Backend } from './backend';
import { Observable } from 'rxjs';

export interface Usuario {
  _id?: string;
  username: string;
  email: string;
  nombre: string;
  apellido: string;
  fechaNacimiento: string;
  descripcion: string;
  urlFoto?: string;
  rol?: string;
}

@Injectable({
  providedIn: 'root',
})
export class UsuarioService {
  private backend = inject(Backend);

  public getById(id: string): Observable<Usuario> {
    return this.backend.get<Usuario>(`/usuario/id/${id}`);
  }

  public getByUsername(username: string): Observable<Usuario> {
    return this.backend.get<Usuario>(`/usuario/username/${username}`);
  }
}
