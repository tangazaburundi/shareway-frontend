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
  private readonly USER_KEY = 'shareway_user';

  private _currentUser = signal<User | null>(this.loadUser());
      currentUser = this._currentUser.asReadonly();
  isAuthenticated = computed(() => !!this._currentUser());

  constructor(private http: HttpClient, private router: Router) {}

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
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    localStorage.removeItem("admin_token");
    localStorage.removeItem("admin_user");
    this._currentUser.set(null);
    this.router.navigate(['/']);
  }

  getToken(): string | null {
    const token = localStorage.getItem("admin_token");

    if (!token || token.trim() === '') {
      return localStorage.getItem(this.TOKEN_KEY);
    }
    return token;
  }

  updateCurrentUser(user: User): void {
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
    this._currentUser.set(user);
  }

  private saveSession(data: AuthResponse): void {

     if(data?.user?.systemRole){
         localStorage.setItem('admin_token', data.token);
         localStorage.setItem('admin_user', JSON.stringify(data.user));
     }else{

        localStorage.setItem(this.TOKEN_KEY, data.token);
        localStorage.setItem(this.USER_KEY, JSON.stringify(data.user));
     }

     this._currentUser.set(data.user);
  }

   private loadUser(): User | null {
    try {
        const raw = localStorage.getItem("admin_user");
        if(raw === null){
          const raw = localStorage.getItem(this.USER_KEY);
          return raw ? JSON.parse(raw) : null;
        }
        return raw ? JSON.parse(raw) : null;
     } catch (error) {
      console.error('Erreur lors du parsing du user :', error);
      return null;
    }
  }

}
