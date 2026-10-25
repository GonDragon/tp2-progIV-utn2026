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
    return this.backend.post<AuthResponse>('/auth/registro', datos).pipe(
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

  private guardarToken(token: string): void {
    localStorage.setItem(this.TOKEN_KEY, token);
  }
}
