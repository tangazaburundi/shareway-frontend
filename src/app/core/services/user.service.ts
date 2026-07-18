import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { User, Vehicle, Notification, DashboardStats } from '../models/user.model';
import { ApiResponse } from '../models/api-response.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class UserService {
  private readonly API = `${environment.apiUrl}/users`;

  constructor(private http: HttpClient) {}

  getProfile(id: string): Observable<ApiResponse<User>> {
    return this.http.get<ApiResponse<User>>(`${this.API}/${id}`);
  }

  getMe(): Observable<ApiResponse<User>> {
    return this.http.get<ApiResponse<User>>(`${this.API}/me`);
  }

  updateProfile(data: Partial<User>): Observable<ApiResponse<User>> {
    return this.http.put<ApiResponse<User>>(`${this.API}/me`, data);
  }

  uploadAvatar(file: File): Observable<ApiResponse<{ avatarUrl: string }>> {
    const fd = new FormData();
    fd.append('file', file);
    return this.http.post<ApiResponse<{ avatarUrl: string }>>(`${this.API}/me/avatar`, fd);
  }

  uploadIdentity(file: File): Observable<ApiResponse<void>> {
    const fd = new FormData();
    fd.append('file', file);
    return this.http.post<ApiResponse<void>>(`${this.API}/me/identity`, fd);
  }

  saveVehicle(vehicle: Partial<Vehicle>): Observable<ApiResponse<Vehicle>> {
    return this.http.put<ApiResponse<Vehicle>>(`${this.API}/me/vehicle`, vehicle);
  }

  switchRole(role: 'DRIVER' | 'PASSENGER' | 'BOTH'): Observable<ApiResponse<User>> {
    return this.http.patch<ApiResponse<User>>(`${this.API}/me/role`, { role });
  }

  getNotifications(): Observable<ApiResponse<Notification[]>> {
    return this.http.get<ApiResponse<Notification[]>>(`${this.API}/me/notifications`);
  }

  markNotificationsRead(ids: string[]): Observable<ApiResponse<void>> {
    return this.http.patch<ApiResponse<void>>(`${this.API}/me/notifications/read`, { ids });
  }

  getDashboardStats(): Observable<ApiResponse<DashboardStats>> {
    return this.http.get<ApiResponse<DashboardStats>>(`${this.API}/me/stats`);
  }

  getPassengerDashboard(): Observable<ApiResponse<PassengerDashboard>> {
    return this.http.get<ApiResponse<PassengerDashboard>>(`${environment.apiUrl}/dashboard/passenger`);
  }
}

export interface PassengerDashboard {
  totalBookings: number;
  completedTrips: number;
  cancelledTrips: number;
  pendingBookings: number;
  activeBookings: number;
  totalSpent: number;
  totalSpentByCurrency: Record<string, number>;
  recentBookings: RecentBooking[];
}

export interface RecentBooking {
  id: string;
  tripId: string;
  departureCity: string;
  arrivalCity: string;
  departureTime: string;
  status: string;
  amountPaid: number;
  currency: string;
  createdAt: string;
}

