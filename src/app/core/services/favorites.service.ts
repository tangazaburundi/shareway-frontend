import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse } from '../models/api-response.model';
import { environment } from '../../../environments/environment';

export interface FavoriteDriver {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  avatarUrl?: string;
  rating?: number;
  createdAt: string;
}

export interface BlacklistedUser {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  reason?: string;
  createdAt: string;
}

@Injectable({ providedIn: 'root' })
export class FavoritesService {
  private readonly API = `${environment.apiUrl}/favorites`;

  constructor(private http: HttpClient) {}

  getFavorites(): Observable<ApiResponse<FavoriteDriver[]>> {
    return this.http.get<ApiResponse<FavoriteDriver[]>>(this.API);
  }

  addFavorite(driverId: string): Observable<ApiResponse<void>> {
    return this.http.post<ApiResponse<void>>(this.API, { driverId });
  }

  removeFavorite(driverId: string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.API}/${driverId}`);
  }

  isFavorite(driverId: string): Observable<ApiResponse<boolean>> {
    return this.http.get<ApiResponse<boolean>>(`${this.API}/check/${driverId}`);
  }
}
