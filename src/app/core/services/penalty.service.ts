import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse } from '../models/api-response.model';
import { environment } from '../../../environments/environment';

export interface Penalty {
  id: string;
  userId: string;
  bookingId: string;
  tripId: string;
  type: 'LATE_CANCELLATION' | 'NO_SHOW' | 'DRIVER_NO_SHOW';
  amount: number;
  currency: string;
  reason: string;
  paid: boolean;
  paidAt?: string;
  createdAt: string;
}

@Injectable({ providedIn: 'root' })
export class PenaltyService {
  private readonly API = `${environment.apiUrl}/penalties`;

  constructor(private http: HttpClient) {}

  getMyPenalties(): Observable<ApiResponse<Penalty[]>> {
    return this.http.get<ApiResponse<Penalty[]>>(`${this.API}/mine`);
  }

  getUnpaidPenalties(): Observable<ApiResponse<Penalty[]>> {
    return this.http.get<ApiResponse<Penalty[]>>(`${this.API}/unpaid`);
  }

  payPenalty(id: string): Observable<ApiResponse<void>> {
    return this.http.post<ApiResponse<void>>(`${this.API}/${id}/pay`, {});
  }
}
