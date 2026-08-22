import { Injectable, signal } from '@angular/core';
import { RideService } from './ride.service';

@Injectable({ providedIn: 'root' })
export class DriverLocationService {
  private watchId: number | null = null;
  isTracking = signal(false);

  constructor(private rideService: RideService) {}

  startTracking(): void {
    if (!navigator.geolocation) {
      console.warn('Geolocation not supported');
      return;
    }

    this.watchId = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        this.rideService.updateLocation(latitude, longitude).subscribe({
          error: (err) => console.error('Failed to update location', err)
        });
      },
      (error) => {
        console.error('Geolocation error:', error);
      },
      {
        enableHighAccuracy: false,
        maximumAge: 60000,
        timeout: 8000
      }
    );

    this.isTracking.set(true);
  }

  stopTracking(): void {
    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }
    this.isTracking.set(false);
  }

  getCurrentPosition(): Promise<{ lat: number; lng: number }> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation not supported'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          reject(error);
        },
        {
          enableHighAccuracy: false,
          timeout: 8000,
          maximumAge: 60000
        }
      );
    });
  }
}
