/*
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Trip, CreateTripRequest, TripSearchParams, TripCancellation, BookingCancellation } from '../models/trip.model';
import { ApiResponse, PageResponse } from '../models/api-response.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class TripService {
  private readonly API = `${environment.apiUrl}/trips`;

  constructor(private http: HttpClient) {}

  search(params: TripSearchParams): Observable<ApiResponse<PageResponse<Trip>>> {
    let p = new HttpParams()
      .set('departureCity', params.departureCity)
      .set('arrivalCity', params.arrivalCity)
      .set('date', params.date);
    if (params.seats)            p = p.set('seats', params.seats);
    if (params.maxPrice)         p = p.set('maxPrice', params.maxPrice);
    if (params.currency)         p = p.set('currency', params.currency);
    if (params.minRating)        p = p.set('minRating', params.minRating);
    if (params.departureTimeFrom) p = p.set('departureTimeFrom', params.departureTimeFrom);
    if (params.departureTimeTo)   p = p.set('departureTimeTo', params.departureTimeTo);
    if (params.music !== undefined) p = p.set('music', params.music);
    if (params.smoking !== undefined) p = p.set('smoking', params.smoking);
    if (params.pets !== undefined)  p = p.set('pets', params.pets);
    return this.http.get<ApiResponse<PageResponse<Trip>>>(this.API, { params: p });
  }

  getById(id: string): Observable<ApiResponse<Trip>> {
    return this.http.get<ApiResponse<Trip>>(`${this.API}/${id}`);
  }

  getByShareToken(token: string): Observable<ApiResponse<Trip>> {
    return this.http.get<ApiResponse<Trip>>(`${this.API}/share/${token}`);
  }

  create(data: CreateTripRequest): Observable<ApiResponse<Trip>> {
    return this.http.post<ApiResponse<Trip>>(this.API, data);
  }

  update(id: string, data: Partial<CreateTripRequest>): Observable<ApiResponse<Trip>> {
    return this.http.put<ApiResponse<Trip>>(`${this.API}/${id}`, data);
  }

  join(tripId: string, currency?: string): Observable<ApiResponse<void>> {
    return this.http.post<ApiResponse<void>>(`${this.API}/${tripId}/join`, { currency });
  }

  leave(tripId: string, data: BookingCancellation): Observable<ApiResponse<void>> {
    return this.http.post<ApiResponse<void>>(`${this.API}/${tripId}/leave`, data);
  }

  cancel(tripId: string, data: TripCancellation): Observable<ApiResponse<void>> {
    return this.http.post<ApiResponse<void>>(`${this.API}/${tripId}/cancel`, data);
  }

  complete(tripId: string): Observable<ApiResponse<void>> {
    return this.http.patch<ApiResponse<void>>(`${this.API}/${tripId}/complete`, {});
  }

  getMyTrips(): Observable<ApiResponse<Trip[]>> {
    return this.http.get<ApiResponse<Trip[]>>(`${this.API}/my`);
  }

  getMyBookings(): Observable<ApiResponse<Trip[]>> {
    return this.http.get<ApiResponse<Trip[]>>(`${this.API}/my/bookings`);
  }

  generateShareLink(tripId: string): Observable<ApiResponse<{ token: string; url: string }>> {
    return this.http.post<ApiResponse<{ token: string; url: string }>>(`${this.API}/${tripId}/share`, {});
  }
}
 */


 import { Injectable } from '@angular/core';
 import { HttpClient, HttpParams } from '@angular/common/http';
 import { Observable } from 'rxjs';
 import {
   Trip, Booking, CreateTripRequest, UpdateTripRequest,
   BookTripRequest, RespondBookingRequest, TripSearchRequest,
   PassengerPublic,LeaveTripRequest
 } from '../models/trip.model';
 import { ApiResponse, PageResponse } from '../models/api-response.model';
 import { environment } from '../../../environments/environment';


 @Injectable({ providedIn: 'root' })
 export class TripService {

   private readonly API = `${environment.apiUrl}/trips`;

   constructor(private http: HttpClient) {}

   // ── Recherche (departureCity seul suffit) ─────────────────────────────
   search(req: TripSearchRequest, page = 0, size = 20): Observable<ApiResponse<PageResponse<Trip>>> {
     let params = new HttpParams().set('page', page).set('size', size);
     if (req.departureCity)  params = params.set('departureCity', req.departureCity);
     if (req.arrivalCity)    params = params.set('arrivalCity', req.arrivalCity);
     if (req.date)           params = params.set('date', req.date);
     if (req.seats)          params = params.set('seats', req.seats);
     if (req.maxPrice)       params = params.set('maxPrice', req.maxPrice);
     if (req.minRating)      params = params.set('minRating', req.minRating);
     if (req.pets     != null) params = params.set('pets', req.pets);
     if (req.smallLuggage != null) params = params.set('smallLuggage', req.smallLuggage);
     if (req.largeLuggage != null) params = params.set('largeLuggage', req.largeLuggage);
     return this.http.get<ApiResponse<PageResponse<Trip>>>(this.API, { params });
   }

   // ── Détails ───────────────────────────────────────────────────────────
   getById(id: string): Observable<ApiResponse<Trip>> {
     return this.http.get<ApiResponse<Trip>>(`${this.API}/${id}`);
   }

   getByShareToken(token: string): Observable<ApiResponse<Trip>> {
     return this.http.get<ApiResponse<Trip>>(`${this.API}/share/${token}`);
   }

   // ── Mes trajets ───────────────────────────────────────────────────────
   getMyTrips(): Observable<ApiResponse<Trip[]>> {
     return this.http.get<ApiResponse<Trip[]>>(`${this.API}/my`);
   }

   getMyBookings(): Observable<ApiResponse<Booking[]>> {
     return this.http.get<ApiResponse<Booking[]>>(`${this.API}/my/bookings`);
   }

   // ── Créer un trajet ───────────────────────────────────────────────────
   create(req: CreateTripRequest): Observable<ApiResponse<Trip>> {
     return this.http.post<ApiResponse<Trip>>(this.API, req);
   }

   // ── Modifier un trajet (conducteur) ───────────────────────────────────
   update(id: string, req: UpdateTripRequest): Observable<ApiResponse<Trip>> {
     return this.http.put<ApiResponse<Trip>>(`${this.API}/${id}`, req);
   }

   // ── Réserver ──────────────────────────────────────────────────────────
   book(tripId: string, req: BookTripRequest): Observable<ApiResponse<Booking>> {
     return this.http.post<ApiResponse<Booking>>(`${this.API}/${tripId}/join`, req);
   }

   // ── Passager annule sa réservation ────────────────────────────────────
   leave(tripId: string, payload: LeaveTripRequest): Observable<ApiResponse<void>> {
     return this.http.post<ApiResponse<void>>(
       `${this.API}/${tripId}/leave`,payload);
   }

   // ── Conducteur annule le trajet ───────────────────────────────────────
/*
   cancel(tripId: string, reason: string): Observable<ApiResponse<void>> {
     return this.http.post<ApiResponse<void>>(`${this.API}/${tripId}/cancel`, { reason });
   }
 */
 cancel(tripId: string,payload: {reason: string;notifyPassengers: boolean;}): Observable<ApiResponse<void>> {
   return this.http.post<ApiResponse<void>>(
     `${this.API}/${tripId}/cancel`,
     payload
   );
 }

   // ── Conducteur termine le trajet ─────────────────────────────────────
   complete(tripId: string): Observable<ApiResponse<void>> {
     return this.http.patch<ApiResponse<void>>(`${this.API}/${tripId}/complete`, {});
   }

   // ── Réservations du trajet (conducteur) ──────────────────────────────
   getTripBookings(): Observable<ApiResponse<Booking[]>> {
    //return this.http.get<ApiResponse<Booking[]>>(`${this.API}/${tripId}/bookings`);
     return this.http.get<ApiResponse<Booking[]>>(`${this.API}/bookings`);
   }

   // ── Conducteur valide ou refuse une réservation ───────────────────────
   respondToBooking(
     tripId: string,
     bookingId: string,
     req: RespondBookingRequest
   ): Observable<ApiResponse<Booking>> {
     return this.http.post<ApiResponse<Booking>>(
       `${this.API}/bookings/${bookingId}/respond`, req
     );
   }

   // ── Profil passager (visible par le conducteur du trajet) ─────────────
   getPassengerProfile(tripId: string, passengerId: string): Observable<ApiResponse<PassengerPublic>> {
     return this.http.get<ApiResponse<PassengerPublic>>(
       `${this.API}/${tripId}/passengers/${passengerId}`
     );
   }

   //TODO
   generateShareLink(id: string) {
     return this.http.post<{
       data: { url: string }
     }>(`${this.API}/${id}/share`, {});
   }

 }

