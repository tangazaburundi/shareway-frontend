import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import { Partenaire, CreatePartenaireCommand } from '../models/partenaire.model';

@Injectable({ providedIn: 'root' })
export class PartenaireService {
  private readonly API = `${environment.apiUrl}/partenaires`;

  constructor(private http: HttpClient) {}

  private unwrap<T>(obs: Observable<ApiResponse<T>>): Observable<T> {
    return obs.pipe(map(r => r.data));
  }

  getAllActive(): Observable<Partenaire[]> {
    return this.unwrap(this.http.get<ApiResponse<Partenaire[]>>(`${this.API}/active`));
  }

  getAll(): Observable<Partenaire[]> {
    return this.unwrap(this.http.get<ApiResponse<Partenaire[]>>(`${this.API}/admin`));
  }

  getById(id: string): Observable<Partenaire> {
    return this.unwrap(this.http.get<ApiResponse<Partenaire>>(`${this.API}/admin/${id}`));
  }

  create(req: CreatePartenaireCommand): Observable<Partenaire> {
    return this.unwrap(this.http.post<ApiResponse<Partenaire>>(`${this.API}/admin`, req));
  }

  update(id: string, req: CreatePartenaireCommand): Observable<Partenaire> {
    return this.unwrap(this.http.put<ApiResponse<Partenaire>>(`${this.API}/admin/${id}`, req));
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.API}/admin/${id}`);
  }

  toggleActive(id: string): Observable<Partenaire> {
    return this.unwrap(this.http.patch<ApiResponse<Partenaire>>(`${this.API}/admin/${id}/toggle-active`, {}));
  }

  uploadImage(id: string, file: File): Observable<string> {
    const formData = new FormData();
    formData.append('file', file);
    return this.unwrap(this.http.post<ApiResponse<string>>(`${this.API}/admin/${id}/image`, formData));
  }
}
