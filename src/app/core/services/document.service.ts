import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse } from '../models/api-response.model';
import { environment } from '../../../environments/environment';

export interface UserDocument {
  id: string;
  type: 'IDENTITY_CARD' | 'DRIVER_LICENSE' | 'VEHICLE_REGISTRATION' | 'INSURANCE' | 'OTHER';
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  fileName: string;
  fileUrl: string;
  rejectReason?: string;
  createdAt: string;
  updatedAt: string;
}

@Injectable({ providedIn: 'root' })
export class DocumentService {
  private readonly API = `${environment.apiUrl}/documents`;

  constructor(private http: HttpClient) {}

  upload(file: File, type: string): Observable<ApiResponse<UserDocument>> {
    const fd = new FormData();
    fd.append('file', file);
    fd.append('type', type);
    return this.http.post<ApiResponse<UserDocument>>(this.API, fd);
  }

  getMyDocuments(): Observable<ApiResponse<UserDocument[]>> {
    return this.http.get<ApiResponse<UserDocument[]>>(this.API);
  }

  deleteDocument(id: string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.API}/${id}`);
  }

  approveDocument(id: string): Observable<ApiResponse<UserDocument>> {
    return this.http.patch<ApiResponse<UserDocument>>(`${this.API}/${id}/approve`, {});
  }

  rejectDocument(id: string, reason: string): Observable<ApiResponse<UserDocument>> {
    return this.http.patch<ApiResponse<UserDocument>>(`${this.API}/${id}/reject`, { reason });
  }

  getPendingDocuments(): Observable<ApiResponse<UserDocument[]>> {
    return this.http.get<ApiResponse<UserDocument[]>>(`${this.API}/pending`);
  }
}
