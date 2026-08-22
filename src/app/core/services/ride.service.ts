import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse } from '../models/api-response.model';
import {
  Ride, RideEstimate, DriverAvailability, NearbyDriver, CreateRideRequest, RideRating,
  PricingConfig, SmsConfig
} from '../models/ride.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class RideService {
  private readonly API = `${environment.apiUrl}/rides`;

  constructor(private http: HttpClient) {}

  // ── Public ──────────────────────────────────────────────────────

  getEstimate(pickupLat: number, pickupLng: number, destLat: number, destLng: number, currency?: string): Observable<ApiResponse<RideEstimate>> {
    let params = new HttpParams()
      .set('pickupLat', pickupLat)
      .set('pickupLng', pickupLng)
      .set('destinationLat', destLat)
      .set('destinationLng', destLng);
    if (currency) params = params.set('currency', currency);
    return this.http.get<ApiResponse<RideEstimate>>(`${this.API}/estimate`, { params });
  }

  getNearbyDrivers(lat: number, lng: number, max: number = 10): Observable<ApiResponse<NearbyDriver[]>> {
    const params = new HttpParams().set('lat', lat).set('lng', lng).set('max', max);
    return this.http.get<ApiResponse<NearbyDriver[]>>(`${this.API}/nearby`, { params });
  }

  // ── Passenger ───────────────────────────────────────────────────

  createRide(req: CreateRideRequest): Observable<ApiResponse<Ride>> {
    return this.http.post<ApiResponse<Ride>>(this.API, req);
  }

  getActiveRide(): Observable<ApiResponse<Ride | null>> {
    return this.http.get<ApiResponse<Ride | null>>(`${this.API}/my-active`);
  }

  getMyHistory(): Observable<ApiResponse<Ride[]>> {
    return this.http.get<ApiResponse<Ride[]>>(`${this.API}/my-history`);
  }

  getRideById(id: string): Observable<ApiResponse<Ride>> {
    return this.http.get<ApiResponse<Ride>>(`${this.API}/${id}`);
  }

  cancelRide(id: string, reason?: string): Observable<ApiResponse<void>> {
    return this.http.post<ApiResponse<void>>(`${this.API}/${id}/cancel`, { reason: reason || '' });
  }

  rateRide(id: string, rating: number, comment?: string): Observable<ApiResponse<RideRating>> {
    return this.http.post<ApiResponse<RideRating>>(`${this.API}/${id}/rate`, { rating, comment });
  }

  // ── Driver ──────────────────────────────────────────────────────

  acceptRide(id: string): Observable<ApiResponse<Ride>> {
    return this.http.post<ApiResponse<Ride>>(`${this.API}/${id}/accept`, {});
  }

  rejectRide(id: string, reason?: string): Observable<ApiResponse<void>> {
    return this.http.post<ApiResponse<void>>(`${this.API}/${id}/reject`, { reason: reason || '' });
  }

  driverEnRoute(id: string): Observable<ApiResponse<Ride>> {
    return this.http.post<ApiResponse<Ride>>(`${this.API}/${id}/driver-en-route`, {});
  }

  driverArrived(id: string): Observable<ApiResponse<Ride>> {
    return this.http.post<ApiResponse<Ride>>(`${this.API}/${id}/driver-arrived`, {});
  }

  startRide(id: string): Observable<ApiResponse<Ride>> {
    return this.http.post<ApiResponse<Ride>>(`${this.API}/${id}/start`, {});
  }

  completeRide(id: string): Observable<ApiResponse<Ride>> {
    return this.http.post<ApiResponse<Ride>>(`${this.API}/${id}/complete`, {});
  }

  driverCancelRide(id: string, reason?: string): Observable<ApiResponse<void>> {
    return this.http.post<ApiResponse<void>>(`${this.API}/${id}/driver-cancel`, { reason: reason || '' });
  }

  transferRide(id: string): Observable<ApiResponse<Ride>> {
    return this.http.post<ApiResponse<Ride>>(`${this.API}/${id}/transfer`, {});
  }

  // ── Driver Availability ─────────────────────────────────────────

  toggleAvailability(): Observable<ApiResponse<DriverAvailability>> {
    return this.http.put<ApiResponse<DriverAvailability>>(`${this.API}/driver/availability`, {});
  }

  getAvailability(): Observable<ApiResponse<DriverAvailability>> {
    return this.http.get<ApiResponse<DriverAvailability>>(`${this.API}/driver/availability`);
  }

  updateLocation(lat: number, lng: number, heading?: number): Observable<ApiResponse<void>> {
    return this.http.put<ApiResponse<void>>(`${this.API}/driver/location`, { lat, lng, heading });
  }

  getDriverActiveRide(): Observable<ApiResponse<Ride | null>> {
    return this.http.get<ApiResponse<Ride | null>>(`${this.API}/driver/active`);
  }

  getDriverHistory(): Observable<ApiResponse<Ride[]>> {
    return this.http.get<ApiResponse<Ride[]>>(`${this.API}/driver/history`);
  }

  // ── Admin — Pricing Config ─────────────────────────────────────

  getAllPricingConfigs(): Observable<ApiResponse<PricingConfig[]>> {
    return this.http.get<ApiResponse<PricingConfig[]>>(`${this.API}/admin/pricing-config`);
  }

  getPricingConfig(id: string): Observable<ApiResponse<PricingConfig>> {
    return this.http.get<ApiResponse<PricingConfig>>(`${this.API}/admin/pricing-config/${id}`);
  }

  createPricingConfig(config: PricingConfig): Observable<ApiResponse<PricingConfig>> {
    return this.http.post<ApiResponse<PricingConfig>>(`${this.API}/admin/pricing-config`, config);
  }

  updatePricingConfig(id: string, config: PricingConfig): Observable<ApiResponse<PricingConfig>> {
    return this.http.put<ApiResponse<PricingConfig>>(`${this.API}/admin/pricing-config/${id}`, config);
  }

  deletePricingConfig(id: string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.API}/admin/pricing-config/${id}`);
  }

  // ── Admin — SMS Config ─────────────────────────────────────────

  getSmsConfig(): Observable<ApiResponse<SmsConfig>> {
    return this.http.get<ApiResponse<SmsConfig>>(`${this.API}/admin/sms-config`);
  }

  updateSmsConfig(config: SmsConfig): Observable<ApiResponse<SmsConfig>> {
    return this.http.put<ApiResponse<SmsConfig>>(`${this.API}/admin/sms-config`, config);
  }

  // ── Admin — System Settings ──────────────────────────────────

  getSystemSettings(): Observable<ApiResponse<Record<string, string>>> {
    return this.http.get<ApiResponse<Record<string, string>>>(`${this.API}/admin/settings`);
  }

  updateSystemSetting(key: string, value: string): Observable<ApiResponse<void>> {
    return this.http.post<ApiResponse<void>>(`${this.API}/admin/settings/${key}`, { value });
  }

  // ── SOS ───────────────────────────────────────────────────────

  sosAlert(rideId: string): Observable<ApiResponse<void>> {
    return this.http.post<ApiResponse<void>>(`${this.API}/${rideId}/sos`, {});
  }

  // ── Chat (in-ride) ────────────────────────────────────────────

  getRideMessages(rideId: string): Observable<ApiResponse<any[]>> {
    return this.http.get<ApiResponse<any[]>>(`${this.API}/${rideId}/messages`);
  }

  sendRideMessage(rideId: string, content: string): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${this.API}/${rideId}/messages`, { content });
  }

  // ── Promo Code ────────────────────────────────────────────────

  validatePromo(code: string): Observable<ApiResponse<any>> {
    return this.http.get<ApiResponse<any>>(`${environment.apiUrl}/promo/validate`, {
      params: { code }
    });
  }

  // ── Earnings Stats ────────────────────────────────────────────

  getDriverEarnings(): Observable<ApiResponse<any>> {
    return this.http.get<ApiResponse<any>>(`${this.API}/driver/earnings`);
  }

  getDriverEarningsWeekly(): Observable<ApiResponse<any>> {
    return this.http.get<ApiResponse<any>>(`${this.API}/driver/earnings/weekly`);
  }

  // ── Favorites ─────────────────────────────────────────────────

  getFavoriteAddresses(): Observable<ApiResponse<any[]>> {
    return this.http.get<ApiResponse<any[]>>(`${environment.apiUrl}/favorites`);
  }

  addFavoriteAddress(label: string, address: string, lat: number, lng: number): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${environment.apiUrl}/favorites`, {
      label, address, lat, lng
    });
  }

  removeFavoriteAddress(id: string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${environment.apiUrl}/favorites/${id}`);
  }

  // ── Ride Delete (soft) ──────────────────────────────────────

  deleteRide(id: string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.API}/${id}`);
  }

  // ── Invoice PDF ────────────────────────────────────────────

  downloadInvoice(rideId: string): Observable<Blob> {
    return this.http.get(`${this.API}/${rideId}/invoice`, {
      responseType: 'blob'
    });
  }

  downloadReceipt(rideId: string): Observable<Blob> {
    return this.http.get(`${this.API}/${rideId}/receipt`, {
      responseType: 'blob'
    });
  }
}
