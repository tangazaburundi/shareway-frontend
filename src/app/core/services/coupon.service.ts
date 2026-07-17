import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse } from '../models/api-response.model';
import { environment } from '../../../environments/environment';

export interface Coupon {
  id: string;
  code: string;
  type: 'PERCENTAGE' | 'FIXED';
  value: number;
  currency?: string;
  maxUses?: number;
  currentUses: number;
  expiresAt?: string;
  active: boolean;
}

export interface CouponValidationResult {
  valid: boolean;
  coupon?: Coupon;
  discountAmount: number;
  finalAmount: number;
  message?: string;
}

@Injectable({ providedIn: 'root' })
export class CouponService {
  private readonly API = `${environment.apiUrl}/coupons`;

  constructor(private http: HttpClient) {}

  validate(code: string, amount: number, currency: string): Observable<ApiResponse<CouponValidationResult>> {
    return this.http.get<ApiResponse<CouponValidationResult>>(`${this.API}/validate`, {
      params: { code, amount, currency }
    });
  }

  getMyCoupons(): Observable<ApiResponse<Coupon[]>> {
    return this.http.get<ApiResponse<Coupon[]>>(`${this.API}/mine`);
  }

  getAllCoupons(): Observable<ApiResponse<Coupon[]>> {
    return this.http.get<ApiResponse<Coupon[]>>(this.API);
  }

  createCoupon(coupon: Partial<Coupon>): Observable<ApiResponse<Coupon>> {
    return this.http.post<ApiResponse<Coupon>>(this.API, coupon);
  }

  deactivateCoupon(id: string): Observable<ApiResponse<void>> {
    return this.http.patch<ApiResponse<void>>(`${this.API}/${id}/deactivate`, {});
  }
}
