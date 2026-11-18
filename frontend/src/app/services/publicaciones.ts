import { Injectable, inject } from '@angular/core';
import { Backend } from './backend';
import { Observable } from 'rxjs';

export interface AutorPublicacion {
  _id: string;
  username: string;
  nombre?: string;
  email?: string;
  urlFoto?: string;
}

export interface UsuarioComentario {
  _id: string;
  username: string;
  nombre?: string;
  apellido?: string;
  urlFoto?: string;
}

export interface ComentarioItem {
  _id: string;
  id_usuario: UsuarioComentario | string;
  id_publicacion: string;
  contenido: string;
  modificado: boolean;
  createdAt: string;
  updatedAt: string;
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

  public getCantidadPublicaciones(query: {
    fecha_inicio?: string;
    fecha_fin?: string;
    usuario?: string;
  } = {}): Observable<{ cantidad: number }> {
    const params = new URLSearchParams();
    if (query.fecha_inicio) {
      params.append('fecha_inicio', query.fecha_inicio);
    }
    if (query.fecha_fin) {
      params.append('fecha_fin', query.fecha_fin);
    }
    if (query.usuario) {
      params.append('usuario', query.usuario);
    }

    const queryString = params.toString();
    const endpoint = queryString ? `/pubs/cantidadpubs?${queryString}` : '/pubs/cantidadpubs';
    return this.backend.get<{ cantidad: number }>(endpoint);
  }

  public getCantidadComentarios(query: {
    fecha_inicio?: string;
    fecha_fin?: string;
    usuario?: string;
    id_publicacion?: string;
  } = {}): Observable<{ cantidad: number }> {
    const params = new URLSearchParams();
    if (query.fecha_inicio) {
      params.append('fecha_inicio', query.fecha_inicio);
    }
    if (query.fecha_fin) {
      params.append('fecha_fin', query.fecha_fin);
    }
    if (query.usuario) {
      params.append('usuario', query.usuario);
    }
    if (query.id_publicacion) {
      params.append('id_publicacion', query.id_publicacion);
    }

    const queryString = params.toString();
    const endpoint = queryString ? `/pubs/cantidadcomments?${queryString}` : '/pubs/cantidadcomments';
    return this.backend.get<{ cantidad: number }>(endpoint);
  }

  public getTopUsuariosComentarios(query: {
    fecha_inicio?: string;
    fecha_fin?: string;
    limite?: number;
  } = {}): Observable<{ id_usuario: string; username: string; nombre?: string; cantidad: number }[]> {
    const params = new URLSearchParams();
    if (query.fecha_inicio) {
      params.append('fecha_inicio', query.fecha_inicio);
    }
    if (query.fecha_fin) {
      params.append('fecha_fin', query.fecha_fin);
    }
    if (query.limite !== undefined && query.limite !== null) {
      params.append('limite', query.limite.toString());
    }

    const queryString = params.toString();
    const endpoint = queryString ? `/pubs/topcommentsusers?${queryString}` : '/pubs/topcommentsusers';
    return this.backend.get<{ id_usuario: string; username: string; nombre?: string; cantidad: number }[]>(endpoint);
  }

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

  public getComentarios(
    publicacionId: string,
    query: { offset?: number; limit?: number; page?: number } = {},
  ): Observable<ComentarioItem[]> {
    const params = new URLSearchParams();
    if (query.offset !== undefined && query.offset !== null) {
      params.append('offset', query.offset.toString());
    }
    if (query.limit !== undefined && query.limit !== null) {
      params.append('limit', query.limit.toString());
    }
    if (query.page !== undefined && query.page !== null) {
      params.append('page', query.page.toString());
    }

    const queryString = params.toString();
    const endpoint = queryString
      ? `/pubs/publicacion/${publicacionId}/comentarios?${queryString}`
      : `/pubs/publicacion/${publicacionId}/comentarios`;
    return this.backend.get<ComentarioItem[]>(endpoint);
  }

  public agregarComentario(
    publicacionId: string,
    contenido: string,
  ): Observable<ComentarioItem> {
    return this.backend.post<ComentarioItem>(
      `/pubs/publicacion/${publicacionId}/comentario`,
      {
        contenido,
        id_publicacion: publicacionId,
      },
    );
  }

  public modificarComentario(
    comentarioId: string,
    contenido: string,
  ): Observable<ComentarioItem> {
    return this.backend.put<ComentarioItem>(`/pubs/comentario/${comentarioId}`, {
      contenido,
    });
  }
}
