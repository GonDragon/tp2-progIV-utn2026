import { Injectable, inject, signal } from '@angular/core';
import { Backend } from './backend';
import { Observable, tap } from 'rxjs';
import { Notificacion } from './notificacion';

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
  private notificacion = inject(Notificacion);
  private readonly TOKEN_KEY = 'jwt_token';

  private timerInterval: ReturnType<typeof setInterval> | null = null;
  private ignoradoSesion = false;

  // Signal para cambios de usuario
  private usuarioState = signal<UsuarioToken | null>(this._getUsuarioActual());
  readonly usuarioActual = this.usuarioState.asReadonly();

  public login(credenciales: LoginPayload): Observable<AuthResponse> {
    return this.backend.post<AuthResponse>('/auth/login', credenciales).pipe(
      tap((response) => {
        if (response && response.token) {
          this.guardarToken(response.token);
          this.iniciarTimerSesion();
        }
      }),
    );
  }

  public registro(datos: RegistroPayload): Observable<AuthResponse> {
    return this.backend.post<AuthResponse>('/auth/register', datos).pipe(
      tap((response) => {
        if (response && response.token) {
          this.guardarToken(response.token);
          this.iniciarTimerSesion();
        }
      }),
    );
  }

  public refrescar(): Observable<AuthResponse> {
    const token = this.getToken();
    return this.backend.post<AuthResponse>('/auth/refrescar', { token }).pipe(
      tap((response) => {
        if (response && response.token) {
          this.guardarToken(response.token);
          this.iniciarTimerSesion();
        }
      }),
    );
  }

  public validateToken(id: string): Observable<any> {
    return this.backend.get<any>(`/auth/perfil/${id}`);
  }

  public logout(): void {
    this.detenerTimerSesion();
    localStorage.removeItem(this.TOKEN_KEY);
  }

  public getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  public getUsuarioActual(): UsuarioToken | null {
    return this.usuarioState();
  }

  private _getUsuarioActual(): UsuarioToken | null {
    const token = this.getToken();
    if (!token) return null;

    try {
      const parts = token.split('.');
      if (parts.length < 2) return null;

      let base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
      const pad = base64.length % 4;
      if (pad) {
        base64 += '='.repeat(4 - pad);
      }

      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join(''),
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

  public iniciarTimerSesion(): void {
    this.detenerTimerSesion();
    this.ignoradoSesion = false;

    const user = this.getUsuarioActual();
    if (!user || !user.exp) {
      return;
    }

    this.verificarTiempoSesion();
    this.timerInterval = setInterval(() => {
      this.verificarTiempoSesion();
    }, 1000);
  }

  public detenerTimerSesion(): void {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
    this.notificacion.cerrarSiEsSesion();
  }

  private verificarTiempoSesion(): void {
    const user = this.getUsuarioActual();
    if (!user || !user.exp) {
      this.detenerTimerSesion();
      return;
    }

    const now = Math.floor(Date.now() / 1000);
    const segundosRestantes = user.exp - now;

    if (segundosRestantes <= 0) {
      this.detenerTimerSesion();
      // Cuando el contador llega a cero, el toast simplemente se cierra, sin hacer nada.
      return;
    }

    if (segundosRestantes <= 20) {
      if (!this.ignoradoSesion) {
        this.mostrarToastExpiracion(segundosRestantes);
      }
    } else {
      this.notificacion.cerrarSiEsSesion();
    }
  }

  private mostrarToastExpiracion(segundos: number): void {
    const mensaje = `Tu sesión está por expirar en ${segundos} segundos.`;
    this.notificacion.showSessionTimer(
      mensaje,
      () => {
        this.ignoradoSesion = true;
        this.notificacion.close();
      },
      () => {
        this.refrescar().subscribe({
          error: (err) => {
            console.error('Error al extender la sesión:', err);
          },
        });
      },
    );
  }
}
