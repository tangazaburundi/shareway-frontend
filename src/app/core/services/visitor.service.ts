import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class VisitorService {
  private apiUrl = `${environment.apiUrl}`;

  constructor(private http: HttpClient) {}

  recordVisit(data: {
    anonymousId: string;
    pageUrl: string;
    referrer?: string;
    userAgent?: string;
    acceptedCookies?: boolean;
  }) {
    return this.http.post(`${this.apiUrl}/visits`, data);
  }

  updateCookies(anonymousId: string, accepted: boolean) {
    return this.http.patch(`${this.apiUrl}/visits/cookies`, { anonymousId, acceptedCookies: accepted });
  }

  getStats() {
    return this.http.get<any>(`${this.apiUrl}/admin/visitors/stats`);
  }

  getVisitors(page = 0, size = 20, search = '') {
    return this.http.get<any>(`${this.apiUrl}/admin/visitors`, { params: { page, size, search } as any });
  }
}
