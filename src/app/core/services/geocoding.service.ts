import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse } from '../models/api-response.model';
import { environment } from '../../../environments/environment';

export interface GeocodingItem {
  displayName: string;
  lat: number;
  lng: number;
  city: string;
  country: string;
}

export interface GeocodingResponse {
  items: GeocodingItem[];
}

@Injectable({ providedIn: 'root' })
export class GeocodingService {
  private readonly API = `${environment.apiUrl}/geocoding`;

  constructor(private http: HttpClient) {}

  autocomplete(query: string): Observable<ApiResponse<GeocodingResponse>> {
    return this.http.get<ApiResponse<GeocodingResponse>>(`${this.API}/autocomplete`, {
      params: { q: query }
    });
  }

  reverse(lat: number, lng: number): Observable<ApiResponse<string>> {
    return this.http.get<ApiResponse<string>>(`${this.API}/reverse`, {
      params: { lat, lng }
    });
  }
}
