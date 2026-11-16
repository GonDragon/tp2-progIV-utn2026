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
  habilitado?: boolean;
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

  public getUsuarios(cantidad?: number, inicial?: number): Observable<Usuario[]> {
    const params: string[] = [];
    if (cantidad !== undefined) {
      params.push(`cantidad=${cantidad}`);
    }
    if (inicial !== undefined) {
      params.push(`inicial=${inicial}`);
    }
    const query = params.length > 0 ? `?${params.join('&')}` : '';
    return this.backend.get<Usuario[]>(`/usuario${query}`);
  }

  public habilitar(username: string): Observable<Usuario> {
    return this.backend.post<Usuario>(`/usuario/habilitar/${username}`, {});
  }

  public deshabilitar(username: string): Observable<Usuario> {
    return this.backend.delete<Usuario>(`/usuario/deshabilitar/${username}`);
  }
}
