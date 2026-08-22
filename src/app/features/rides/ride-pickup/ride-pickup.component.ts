import { Component, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { RideService } from '../../../core/services/ride.service';
import { MapService } from '../../../core/services/map.service';
import { WebSocketService } from '../../../core/services/websocket.service';
import { NotificationSoundService } from '../../../core/services/notification-sound.service';
import { DriverLocationService } from '../../../core/services/driver-location.service';
import { Ride } from '../../../core/models/ride.model';
import * as L from 'leaflet';

@Component({
  selector: 'app-ride-pickup',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="pickup-page">
      <div class="map-container" id="pickup-map"></div>

      <!-- Passenger Card -->
      <div class="passenger-card">
        <div class="card-handle"></div>
        <div class="passenger-row">
          @if (ride()!.passengerAvatarUrl) {
            <img [src]="ride()!.passengerAvatarUrl" class="passenger-avatar-img" (error)="$any($event.target).style.display='none'; $any($event.target).nextElementSibling.style.display='flex'" />
          }
          <div class="passenger-avatar" [style.display]="ride()!.passengerAvatarUrl ? 'none' : 'flex'">
            {{ ride()!.passengerFirstName?.charAt(0) || 'P' }}
          </div>
          <div class="passenger-info">
            <div class="passenger-name">
              {{ ride()!.passengerFirstName }} {{ ride()!.passengerLastName }}
            </div>
            <div class="passenger-meta">
              <span *ngIf="ride()!.passengerRating">⭐ {{ ride()!.passengerRating }}</span>
              <span *ngIf="ride()!.estimatedDistanceKm">{{ ride()!.estimatedDistanceKm }} km</span>
            </div>
          </div>
        </div>

        <!-- ETA -->
        <div class="eta-bar">
          <span class="eta-label">Arrivée estimée</span>
          <span class="eta-value">{{ etaMinutes() }} min</span>
        </div>

        <!-- Pickup Address -->
        <div class="pickup-address">
          <span class="pickup-dot"></span>
          <span>{{ ride()!.pickupAddress || 'Point de prise en charge' }}</span>
        </div>

        <!-- Actions -->
        <div class="action-buttons">
          <button class="btn-call" (click)="callPassenger()">
            📞 Appeler
          </button>
          <button class="btn-arrived" (click)="markArrived()">
            ✅ J'ai arrivé
          </button>
        </div>

        <!-- Cancel -->
        <button class="btn-cancel" (click)="cancelRide()">
          Annuler la course
        </button>
      </div>
    </div>
  `,
  styles: [`
    .pickup-page {
      height: 100vh;
      display: flex;
      flex-direction: column;
      position: relative;
    }

    .map-container {
      flex: 1;
      min-height: 50vh;
    }

    .passenger-card {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      background: white;
      border-radius: 20px 20px 0 0;
      box-shadow: 0 -4px 20px rgba(0,0,0,0.15);
      padding: 12px 20px 24px;
      z-index: 10;
    }

    .card-handle {
      width: 40px;
      height: 4px;
      background: #d1d5db;
      border-radius: 2px;
      margin: 0 auto 16px;
    }

    .passenger-row {
      display: flex;
      align-items: center;
      gap: 14px;
      margin-bottom: 16px;
    }

    .passenger-avatar {
      width: 52px;
      height: 52px;
      border-radius: 50%;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.3rem;
      font-weight: 700;
      flex-shrink: 0;
    }
    .passenger-avatar-img {
      width: 52px;
      height: 52px;
      border-radius: 50%;
      object-fit: cover;
      flex-shrink: 0;
    }

    .passenger-name {
      font-size: 1.1rem;
      font-weight: 700;
      color: #1a1a2e;
    }

    .passenger-meta {
      display: flex;
      gap: 12px;
      font-size: 0.85rem;
      color: #6b7280;
      margin-top: 2px;
    }

    .eta-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 16px;
      background: #eff6ff;
      border-radius: 10px;
      margin-bottom: 12px;
    }

    .eta-label {
      font-size: 0.85rem;
      color: #6b7280;
    }

    .eta-value {
      font-size: 1.2rem;
      font-weight: 700;
      color: #2563eb;
    }

    .pickup-address {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 12px 0;
      font-size: 0.9rem;
      color: #374151;
      border-bottom: 1px solid #f3f4f6;
      margin-bottom: 16px;
    }

    .pickup-dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      background: #22c55e;
      flex-shrink: 0;
    }

    .action-buttons {
      display: grid;
      grid-template-columns: 1fr 1.5fr;
      gap: 12px;
      margin-bottom: 12px;
    }

    .btn-call {
      padding: 14px;
      background: #f3f4f6;
      color: #374151;
      border: none;
      border-radius: 12px;
      font-size: 0.95rem;
      font-weight: 600;
      cursor: pointer;
      transition: background 0.2s;
    }

    .btn-call:hover {
      background: #e5e7eb;
    }

    .btn-arrived {
      padding: 14px;
      background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
      color: white;
      border: none;
      border-radius: 12px;
      font-size: 0.95rem;
      font-weight: 600;
      cursor: pointer;
      transition: transform 0.2s, box-shadow 0.2s;
    }

    .btn-arrived:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(34, 197, 94, 0.4);
    }

    .btn-cancel {
      width: 100%;
      padding: 12px;
      background: transparent;
      color: #9ca3af;
      border: none;
      font-size: 0.9rem;
      cursor: pointer;
      transition: color 0.2s;
    }

    .btn-cancel:hover {
      color: #dc2626;
    }
  `]
})
export class RidePickupComponent implements OnInit, OnDestroy {
  ride = signal<Ride | null>(null);
  etaMinutes = signal(0);

  private rideId = '';
  private map: L.Map | null = null;
  private pickupMarker: L.Marker | null = null;
  private driverMarker: L.Marker | null = null;
  private refreshInterval: any;
  private wsSub: any;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private rideService: RideService,
    private mapService: MapService,
    private wsService: WebSocketService,
    private driverLocationService: DriverLocationService,
    private notificationSound: NotificationSoundService
  ) {}

  ngOnInit() {
    this.rideId = this.route.snapshot.paramMap.get('id') || '';
    this.loadRide();
    this.refreshInterval = setInterval(() => this.loadRide(), 5000);
    this.setupWebSocket();
  }

  ngOnDestroy() {
    clearInterval(this.refreshInterval);
    if (this.wsSub) this.wsSub.unsubscribe();
    if (this.map) this.mapService.destroyMap('pickup-map');
  }

  private loadRide() {
    if (!this.rideId) return;
    this.rideService.getRideById(this.rideId).subscribe(res => {
      if (res.success && res.data) {
        this.ride.set(res.data);
        this.updateMap(res.data);
        this.updateEta(res.data);

        if (res.data.status === 'ARRIVED') {
          this.router.navigate(['/driver/dashboard']);
        } else if (res.data.status !== 'ACCEPTED' && res.data.status !== 'DRIVER_EN_ROUTE') {
          this.router.navigate(['/driver/dashboard']);
        }
      }
    });
  }

  private setupWebSocket() {
    this.wsSub = this.wsService.subscribe('/user/queue/ride-update').subscribe((msg: any) => {
      if (msg && msg.rideId === this.rideId) {
        if (msg.status === 'CANCELLED') {
          this.notificationSound.play('ride-cancelled');
          this.router.navigate(['/driver/dashboard']);
        }
      }
    });
  }

  private updateMap(ride: Ride) {
    if (!this.map) {
      this.map = this.mapService.createMap('pickup-map', ride.pickupLat, ride.pickupLng, 14);
    }

    if (!this.pickupMarker) {
      this.pickupMarker = this.mapService.addMarker(
        this.map, ride.pickupLat, ride.pickupLng, 'pickup',
        ride.pickupAddress || 'Prise en charge', ride.passengerAvatarUrl
      );
    }

    this.driverLocationService.getCurrentPosition().then(pos => {
      if (this.driverMarker) {
        this.mapService.updateMarkerPosition(this.driverMarker, pos.lat, pos.lng);
      } else {
        this.driverMarker = this.mapService.addMarker(
          this.map!, pos.lat, pos.lng, 'driver', 'Vous'
        );
      }
      this.mapService.fitBounds(this.map!, [
        [pos.lat, pos.lng],
        [ride.pickupLat, ride.pickupLng]
      ]);
    });
  }

  private updateEta(ride: Ride) {
    if (ride.estimatedDurationMin) {
      this.etaMinutes.set(ride.estimatedDurationMin);
    }
  }

  callPassenger() {
    const phone = this.ride()?.driverPhone;
    if (phone) {
      window.open(`tel:${phone}`, '_self');
    }
  }

  markArrived() {
    this.rideService.driverArrived(this.rideId).subscribe(res => {
      if (res.success) {
        this.router.navigate(['/driver/dashboard']);
      }
    });
  }

  cancelRide() {
    this.notificationSound.play('ride-cancelled');
    this.rideService.driverCancelRide(this.rideId, 'Annulé par le chauffeur').subscribe(() => {
      this.router.navigate(['/driver/dashboard']);
    });
  }
}
