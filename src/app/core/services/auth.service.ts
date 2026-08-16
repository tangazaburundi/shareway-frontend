// src/app/core/services/auth.service.ts
import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { AuthResponse, LoginRequest, RegisterRequest, User } from '../models/user.model';
import { ApiResponse } from '../models/api-response.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly API = `${environment.apiUrl}/auth`;
  private readonly TOKEN_KEY = 'shareway_token';
  private readonly REFRESH_TOKEN_KEY = 'shareway_refresh_token';
  private readonly USER_KEY = 'shareway_user';
  private readonly ADMIN_TOKEN_KEY = 'admin_token';
  private readonly ADMIN_USER_KEY = 'admin_user';

  private _currentUser = signal<User | null>(this.loadUser());
      currentUser = this._currentUser.asReadonly();
  isAuthenticated = computed(() => {
    const user = this._currentUser();
    if (!user) return false;
    const token = this.getActiveToken();
    return !!token && !AuthService.isTokenExpired(token);
  });

  private expiryTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(private http: HttpClient, private router: Router) {
    this.armSessionExpiryReload();
  }

  /** Programme un rechargement de la page à l'expiration exacte du token. */
  armSessionExpiryReload(): void {
    if (this.expiryTimer !== null) {
      clearTimeout(this.expiryTimer);
      this.expiryTimer = null;
    }
    const ms = this.msUntilTokenExpiry();
    if (ms === null || ms <= 0) return;
    this.expiryTimer = setTimeout(() => {
      if (this.hasStoredSession()) {
        this.purgeSession();
        window.location.reload();
      }
    }, ms + 1000);
  }

  login(credentials: LoginRequest): Observable<ApiResponse<AuthResponse>> {
    return this.http.post<ApiResponse<AuthResponse>>(`${this.API}/login`, credentials).pipe(
      tap(res => {
        if (res.success && res.data) {
          this.saveSession(res.data);
        }
      })
    );
  }

  register(data: RegisterRequest): Observable<ApiResponse<AuthResponse>> {
    return this.http.post<ApiResponse<AuthResponse>>(`${this.API}/register`, data).pipe(
      tap(res => {
        if (res.success && res.data) {
          this.saveSession(res.data);
        }
      })
    );
  }

  logout(): void {
    this.purgeSession();
    this.router.navigate(['/']);
  }

  /** Vide la session (localStorage + signal) sans rediriger. */
  purgeSession(): void {
    if (this.expiryTimer !== null) {
      clearTimeout(this.expiryTimer);
      this.expiryTimer = null;
    }
    this.clearStoredSession();
    this._currentUser.set(null);
  }

  getToken(): string | null {
    const token = this.getActiveToken();
    if (!token) return null;
    if (AuthService.isTokenExpired(token)) {
      this.purgeSession();
      return null;
    }
    return token;
  }

  getRefreshToken(): string | null {
    return localStorage.getItem(this.REFRESH_TOKEN_KEY);
  }

  /** Millisecondes restantes avant expiration du token, ou null si non connecté. */
  msUntilTokenExpiry(): number | null {
    const token = this.getActiveToken();
    if (!token) return null;
    const exp = AuthService.extractExp(token);
    if (exp === null) return null;
    return exp * 1000 - Date.now();
  }

  hasStoredSession(): boolean {
    return !!this.getActiveToken()
      || !!localStorage.getItem(this.USER_KEY)
      || !!localStorage.getItem(this.ADMIN_USER_KEY);
  }

  refreshToken(): Observable<ApiResponse<AuthResponse>> {
    const refreshToken = this.getRefreshToken();
    return this.http.post<ApiResponse<AuthResponse>>(`${this.API}/refresh-token`, { refreshToken }).pipe(
      tap(res => {
        if (res.success && res.data) {
          this.saveSession(res.data);
        }
      })
    );
  }

  forgotPassword(email: string): Observable<ApiResponse<void>> {
    return this.http.post<ApiResponse<void>>(`${this.API}/forgot-password`, { email });
  }

  resetPassword(token: string, newPassword: string): Observable<ApiResponse<void>> {
    return this.http.post<ApiResponse<void>>(`${this.API}/reset-password`, { token, newPassword });
  }

  verifyEmail(token: string): Observable<ApiResponse<void>> {
    return this.http.get<ApiResponse<void>>(`${this.API}/verify-email/${token}`);
  }

  updateCurrentUser(user: User): void {
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
    this._currentUser.set(user);
  }

  static isTokenExpired(token: string): boolean {
    const exp = AuthService.extractExp(token);
    return exp === null ? true : exp * 1000 <= Date.now();
  }

  private static extractExp(token: string): number | null {
    try {
      const payload = token.split('.')[1];
      if (!payload) return null;
      const decoded = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
      return typeof decoded?.exp === 'number' ? decoded.exp : null;
    } catch {
      return null;
    }
  }

  private getActiveToken(): string | null {
    const adminToken = localStorage.getItem(this.ADMIN_TOKEN_KEY);
    const token = (adminToken && adminToken.trim() !== '')
      ? adminToken
      : localStorage.getItem(this.TOKEN_KEY);
    return (token && token.trim() !== '') ? token : null;
  }

  private clearStoredSession(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    localStorage.removeItem(this.ADMIN_TOKEN_KEY);
    localStorage.removeItem(this.ADMIN_USER_KEY);
  }

  private saveSession(data: AuthResponse): void {

     if(data?.user?.systemRole){
         localStorage.setItem(this.ADMIN_TOKEN_KEY, data.token);
         localStorage.setItem(this.ADMIN_USER_KEY, JSON.stringify(data.user));
     }else{
        localStorage.removeItem(this.ADMIN_TOKEN_KEY);
        localStorage.removeItem(this.ADMIN_USER_KEY);
        localStorage.setItem(this.TOKEN_KEY, data.token);
        localStorage.setItem(this.USER_KEY, JSON.stringify(data.user));
     }

     if (data.refreshToken) {
       localStorage.setItem(this.REFRESH_TOKEN_KEY, data.refreshToken);
     }

     this._currentUser.set(data.user);
     this.armSessionExpiryReload();
  }

   private loadUser(): User | null {
    try {
        const token = this.getActiveToken();
        if (!token || AuthService.isTokenExpired(token)) {
          this.clearStoredSession();
          return null;
        }
        const raw = localStorage.getItem(this.ADMIN_USER_KEY);
        if(raw === null){
          const rawUser = localStorage.getItem(this.USER_KEY);
          return rawUser ? JSON.parse(rawUser) : null;
        }
        return raw ? JSON.parse(raw) : null;
     } catch (error) {
      console.error('Erreur lors du parsing du user :', error);
      return null;
    }
  }

}
