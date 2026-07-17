import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { ApiResponse, PageResponse } from '../models/api-response.model';
import {
  Advertising,
  CreateAdvertisingRequest,
  UpdateAdvertisingRequest
} from '../models/advertising.model';

@Injectable({ providedIn: 'root' })
export class AdvertisingService {
  private readonly API = `${environment.apiUrl}`;

  constructor(private http: HttpClient) {}

  private unwrap<T>(obs: Observable<ApiResponse<T>>): Observable<T> {
    return obs.pipe(map(r => r.data));
  }

  // ─── Public ─────────────────────────────────────────────────────────────

  getActiveAds(): Observable<Advertising[]> {
    return this.unwrap(this.http.get<ApiResponse<Advertising[]>>(`${this.API}/public/ads`));
  }

  getActiveAdsByPosition(position: string): Observable<Advertising[]> {
    return this.unwrap(this.http.get<ApiResponse<Advertising[]>>(`${this.API}/public/ads/${position}`));
  }

  recordClick(id: string): Observable<void> {
    return this.http.post<void>(`${this.API}/public/ads/${id}/click`, {});
  }

  // ─── Admin ──────────────────────────────────────────────────────────────

  getAll(page = 0, size = 20): Observable<PageResponse<Advertising>> {
    const params = new HttpParams().set('page', page).set('size', size);
    return this.unwrap(this.http.get<ApiResponse<PageResponse<Advertising>>>(`${this.API}/admin/ads`, { params }));
  }

  getById(id: string): Observable<Advertising> {
    return this.unwrap(this.http.get<ApiResponse<Advertising>>(`${this.API}/admin/ads/${id}`));
  }

  create(req: CreateAdvertisingRequest): Observable<Advertising> {
    return this.unwrap(this.http.post<ApiResponse<Advertising>>(`${this.API}/admin/ads`, req));
  }

  update(id: string, req: UpdateAdvertisingRequest): Observable<Advertising> {
    return this.unwrap(this.http.put<ApiResponse<Advertising>>(`${this.API}/admin/ads/${id}`, req));
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.API}/admin/ads/${id}`);
  }

  activate(id: string): Observable<Advertising> {
    return this.unwrap(this.http.post<ApiResponse<Advertising>>(`${this.API}/admin/ads/${id}/activate`, {}));
  }

  deactivate(id: string): Observable<Advertising> {
    return this.unwrap(this.http.post<ApiResponse<Advertising>>(`${this.API}/admin/ads/${id}/deactivate`, {}));
  }

  getStats(): Observable<Record<string, number>> {
    return this.unwrap(this.http.get<ApiResponse<Record<string, number>>>(`${this.API}/admin/ads/stats`));
  }
}
