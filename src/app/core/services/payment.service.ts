import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse } from '../models/api-response.model';
import { environment } from '../../../environments/environment';

export interface PaymentIntentResponse {
  clientSecret: string;
  paymentIntentId: string;
  amount: string;
  currency: string;
}

export interface Payment {
  id: string;
  bookingId: string;
  amount: number;
  currency: string;
  status: 'PENDING' | 'PROCESSING' | 'SUCCEEDED' | 'FAILED' | 'REFUNDED';
  stripePaymentIntentId: string;
  createdAt: string;
}

@Injectable({ providedIn: 'root' })
export class PaymentService {
  private readonly API = `${environment.apiUrl}/payments`;

  constructor(private http: HttpClient) {}

  createPaymentIntent(bookingId: string): Observable<ApiResponse<PaymentIntentResponse>> {
    return this.http.post<ApiResponse<PaymentIntentResponse>>(`${this.API}/create-intent`, { bookingId });
  }

  createEscrowPaymentIntent(bookingId: string): Observable<ApiResponse<{ paymentIntentId: string }>> {
    return this.http.post<ApiResponse<{ paymentIntentId: string }>>(`${this.API}/escrow/create`, { bookingId });
  }

  capturePayment(paymentIntentId: string): Observable<ApiResponse<void>> {
    return this.http.post<ApiResponse<void>>(`${this.API}/escrow/capture`, { paymentIntentId });
  }

  cancelPayment(paymentIntentId: string): Observable<ApiResponse<void>> {
    return this.http.post<ApiResponse<void>>(`${this.API}/escrow/cancel`, { paymentIntentId });
  }

  refund(bookingId: string, amount: number, reason: string): Observable<ApiResponse<void>> {
    return this.http.post<ApiResponse<void>>(`${this.API}/refund`, { bookingId, amount, reason });
  }

  getPayments(bookingId: string): Observable<ApiResponse<Payment[]>> {
    return this.http.get<ApiResponse<Payment[]>>(`${this.API}/booking/${bookingId}`);
  }
}
