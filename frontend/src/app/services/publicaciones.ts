import { Injectable, inject } from '@angular/core';
import { Backend } from './backend';
import { Observable } from 'rxjs';

export interface AutorPublicacion {
  _id: string;
  username: string;
  nombre?: string;
  email?: string;
}

export interface PublicacionItem {
  _id: string;
  titulo: string;
  contenido: string;
  url_imagen?: string;
  createdAt: string;
  likes: number;
  autor: AutorPublicacion;
}

export interface GetPublicacionesQuery {
  orderBy?: string;
  autor?: string;
  offset?: number;
  limit?: number;
}

@Injectable({
  providedIn: 'root',
})
export class PublicacionesService {
  private backend = inject(Backend);

  public getPublicaciones(query: GetPublicacionesQuery = {}): Observable<PublicacionItem[]> {
    const params = new URLSearchParams();
    if (query.orderBy) {
      params.append('orderBy', query.orderBy);
    }
    if (query.autor) {
      params.append('autor', query.autor);
    }
    if (query.offset !== undefined && query.offset !== null) {
      params.append('offset', query.offset.toString());
    }
    if (query.limit !== undefined && query.limit !== null) {
      params.append('limit', query.limit.toString());
    }

    const queryString = params.toString();
    const endpoint = queryString ? `/pubs/publicaciones?${queryString}` : '/pubs/publicaciones';
    return this.backend.get<PublicacionItem[]>(endpoint);
  }

  public getPublicacion(id: string): Observable<PublicacionItem> {
    return this.backend.get<PublicacionItem>(`/pubs/publicacion/${id}`);
  }

  public darLike(id: string): Observable<any> {
    return this.backend.post<any>(`/pubs/like/${id}`, {});
  }

  public quitarLike(id: string): Observable<any> {
    return this.backend.delete<any>(`/pubs/like/${id}`);
  }

  public borrar(id: string): Observable<any> {
    return this.backend.delete<any>(`/pubs/borrar/${id}`);
  }

  public publicar(data: { titulo: string; contenido?: string; url_imagen?: string }): Observable<PublicacionItem> {
    return this.backend.post<PublicacionItem>('/pubs/publicar', data);
  }
}
