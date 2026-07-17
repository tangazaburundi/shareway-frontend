import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse } from '../models/api-response.model';
import { environment } from '../../../environments/environment';

export interface ReferralStats {
  referralCount: number;
  totalRewards: number;
  rewardCurrency: string;
  referralCode?: string;
}

@Injectable({ providedIn: 'root' })
export class ReferralService {
  private readonly API = `${environment.apiUrl}/referrals`;

  constructor(private http: HttpClient) {}

  generateCode(): Observable<ApiResponse<{ referralCode: string }>> {
    return this.http.post<ApiResponse<{ referralCode: string }>>(`${this.API}/generate`, {});
  }

  applyCode(code: string): Observable<ApiResponse<void>> {
    return this.http.post<ApiResponse<void>>(`${this.API}/apply`, { code });
  }

  getStats(): Observable<ApiResponse<ReferralStats>> {
    return this.http.get<ApiResponse<ReferralStats>>(`${this.API}/stats`);
  }
}
