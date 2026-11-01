import { Injectable, inject } from '@angular/core';
import { Backend } from './backend';
import { Observable, tap } from 'rxjs';

export interface LoginPayload {
  username: string;
  password: string;
}

export interface RegistroPayload {
  username: string;
  email: string;
  password: string;
  nombre: string;
  apellido: string;
  fechaNacimiento: string;
  descripcion: string;
  urlFoto: string;
  perfil: string;
}

export interface UsuarioToken {
  sub: string;
  username: string;
  rol?: string;
  exp?: number;
  iat?: number;
}

export interface AuthResponse {
  token: string;
}

@Injectable({
  providedIn: 'root',
})
export class AutenticacionService {
  private backend = inject(Backend);
  private readonly TOKEN_KEY = 'jwt_token';

  public login(credenciales: LoginPayload): Observable<AuthResponse> {
    return this.backend.post<AuthResponse>('/auth/login', credenciales).pipe(
      tap((response) => {
        if (response && response.token) {
          this.guardarToken(response.token);
        }
      }),
    );
  }

  public registro(datos: RegistroPayload): Observable<AuthResponse> {
    return this.backend.post<AuthResponse>('/auth/register', datos).pipe(
      tap((response) => {
        if (response && response.token) {
          this.guardarToken(response.token);
        }
      }),
    );
  }

  public logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
  }

  public getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  public getUsuarioActual(): UsuarioToken | null {
    const token = this.getToken();
    if (!token) return null;

    try {
      const payloadBase64 = token.split('.')[1];
      if (!payloadBase64) return null;

      const base64 = payloadBase64.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload) as UsuarioToken;
    } catch {
      return null;
    }
  }

  public getUsuarioId(): string | null {
    const user = this.getUsuarioActual();
    return user ? user.sub : null;
  }

  public isLoggedIn(): boolean {
    const user = this.getUsuarioActual();
    if (!user) return false;
    if (user.exp && user.exp * 1000 < Date.now()) {
      this.logout();
      return false;
    }
    return true;
  }

  private guardarToken(token: string): void {
    localStorage.setItem(this.TOKEN_KEY, token);
  }
}
