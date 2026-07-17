import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface AuthUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
}

export interface LoginRequest { email: string; password: string; }
export interface LoginResponse { token: string; user: AuthUser; }

@Injectable({ providedIn: 'root' })
export class AdminAuthService {
  private tokenKey = 'sw_admin_token';
  currentUser = signal<AuthUser | null>(null);

  constructor(private http: HttpClient, private router: Router) {
    const stored = localStorage.getItem('sw_admin_user');
    if (stored) this.currentUser.set(JSON.parse(stored));
  }

  login(req: LoginRequest) {
    return this.http.post<{ data: LoginResponse }>(`${environment.apiUrl}/auth/login`, req).pipe(
      tap(res => {
        localStorage.setItem(this.tokenKey, res.data.token);
        localStorage.setItem('sw_admin_user', JSON.stringify(res.data.user));
        this.currentUser.set(res.data.user);
      })
    );
  }

  logout() {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem('sw_admin_user');
    this.currentUser.set(null);
    this.router.navigate(['/auth/login']);
  }

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  hasRole(...roles: string[]): boolean {
    const user = this.currentUser();
    return user ? roles.includes(user.role) : false;
  }
}