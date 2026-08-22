import { Component, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { RideService } from '../../../core/services/ride.service';
import { MapService } from '../../../core/services/map.service';
import { WebSocketService } from '../../../core/services/websocket.service';
import { NotificationSoundService } from '../../../core/services/notification-sound.service';
import { AuthService } from '../../../core/services/auth.service';
import { Ride } from '../../../core/models/ride.model';
import * as L from 'leaflet';

@Component({
  selector: 'app-ride-tracking',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="ride-tracking-page">
      <div class="map-container" id="tracking-map"></div>

      <div class="status-bar" [class]="'status-' + ride()?.status?.toLowerCase()">
        <div class="status-icon">
          <span *ngIf="ride()?.status === 'SEARCHING'">🔍</span>
          <span *ngIf="ride()?.status === 'DRIVER_FOUND'">✅</span>
          <span *ngIf="ride()?.status === 'ACCEPTED'">🚗</span>
          <span *ngIf="ride()?.status === 'DRIVER_EN_ROUTE'">➡️</span>
          <span *ngIf="ride()?.status === 'ARRIVED'">📍</span>
          <span *ngIf="ride()?.status === 'IN_PROGRESS'">🛣️</span>
          <span *ngIf="ride()?.status === 'COMPLETED'">🎉</span>
          <span *ngIf="ride()?.status === 'CANCELLED'">❌</span>
        </div>
        <div class="status-text">
          <h3>{{ getStatusText() }}</h3>
          <p *ngIf="ride()?.estimatedPrice">
            {{ formatPrice(ride()!.estimatedPrice!) }} {{ ride()?.currency }}
          </p>
        </div>
      </div>

      <div class="driver-card" *ngIf="ride()?.driverFirstName">
        <img [src]="ride()?.driverAvatarUrl || 'assets/images/default-avatar.svg'" class="driver-avatar" (error)="$any($event.target).src='assets/images/default-avatar.svg'" />
        <div class="driver-info">
          <div class="driver-name">{{ ride()?.driverFirstName }} {{ ride()?.driverLastName }}</div>
          <div class="driver-vehicle" *ngIf="ride()?.driverVehicleBrand">
            {{ ride()?.driverVehicleColor }} {{ ride()?.driverVehicleBrand }} {{ ride()?.driverVehicleModel }}
          </div>
          <div class="driver-plate" *ngIf="ride()?.driverVehiclePlate">
            {{ ride()?.driverVehiclePlate }}
          </div>
        </div>
        <div class="driver-rating" *ngIf="ride()?.driverRating">
          ⭐ {{ ride()?.driverRating }}
        </div>
      </div>

      <div class="eta-bar" *ngIf="ride()?.status === 'DRIVER_EN_ROUTE'">
        <span>Arrivée estimée: {{ etaMinutes() }} min</span>
      </div>

      <div class="action-buttons">
        <button
          class="btn-cancel"
          *ngIf="canCancel()"
          (click)="cancelRide()"
        >
          Annuler la course
        </button>

        <button
          class="btn-rate"
          *ngIf="ride()?.status === 'COMPLETED' && !rated()"
          (click)="showRating = true"
        >
          Noter le chauffeur
        </button>

        <button
          class="btn-done"
          *ngIf="ride()?.status === 'COMPLETED'"
          (click)="goHome()"
        >
          Retour à l'accueil
        </button>

        <button
          class="btn-invoice"
          *ngIf="ride()?.status === 'COMPLETED'"
          (click)="downloadInvoice()"
        >
          Facture PDF
        </button>

        <button
          class="btn-receipt"
          *ngIf="ride()?.status === 'COMPLETED'"
          (click)="downloadReceipt()"
        >
          Ticket
        </button>
      </div>

      <!-- Rating Modal -->
      <div class="rating-modal" *ngIf="showRating">
        <div class="rating-content">
          <h3>Notez votre course</h3>
          <div class="stars">
            <button
              *ngFor="let s of [1,2,3,4,5]"
              class="star"
              [class.active]="s <= selectedRating()"
              (click)="selectedRating.set(s)"
            >
              {{ s <= selectedRating() ? '⭐' : '☆' }}
            </button>
          </div>
          <textarea
            placeholder="Commentaire (optionnel)"
            [value]="ratingComment()"
            (input)="ratingComment.set($any($event.target).value)"
          ></textarea>
          <div class="rating-actions">
            <button class="btn-skip" (click)="showRating = false">Passer</button>
            <button class="btn-submit" [disabled]="selectedRating() === 0" (click)="submitRating()">
              Envoyer
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host ::ng-deep .driver-popup .leaflet-popup-content-wrapper {
      border-radius: 12px;
      box-shadow: 0 4px 16px rgba(0,0,0,0.15);
    }
    :host ::ng-deep .driver-popup .leaflet-popup-tip {
      background: white;
    }
    .ride-tracking-page { height: 100vh; display: flex; flex-direction: column; position: relative; }
    .map-container { flex: 1; min-height: 40vh; }
    .status-bar { display: flex; align-items: center; gap: 12px; padding: 14px 16px; background: white; border-bottom: 2px solid #eee; }
    .status-icon { font-size: 1.5rem; }
    .status-text h3 { margin: 0; font-size: 1rem; }
    .status-text p { margin: 2px 0 0; color: #16a34a; font-weight: 600; }
    .driver-card { display: flex; align-items: center; gap: 12px; padding: 14px; background: white; border-bottom: 1px solid #eee; }
    .driver-avatar { width: 48px; height: 48px; border-radius: 50%; object-fit: cover; }
    .driver-info { flex: 1; }
    .driver-name { font-weight: 600; }
    .driver-vehicle { font-size: 0.85rem; color: #666; }
    .driver-plate { font-size: 0.8rem; color: #888; font-family: monospace; }
    .driver-rating { font-weight: 600; color: #f59e0b; }
    .eta-bar { padding: 10px 16px; background: #eff6ff; text-align: center; font-weight: 500; color: #2563eb; }
    .action-buttons { padding: 16px; background: white; display: flex; gap: 10px; }
    .btn-cancel { flex: 1; padding: 12px; background: #fee2e2; color: #dc2626; border: none; border-radius: 10px; font-weight: 600; cursor: pointer; }
    .btn-rate { flex: 1; padding: 12px; background: #fbbf24; color: white; border: none; border-radius: 10px; font-weight: 600; cursor: pointer; }
    .btn-done { flex: 1; padding: 12px; background: #22c55e; color: white; border: none; border-radius: 10px; font-weight: 600; cursor: pointer; }
    .btn-invoice { flex: 1; padding: 12px; background: #2563eb; color: white; border: none; border-radius: 10px; font-weight: 600; cursor: pointer; }
    .btn-receipt { flex: 1; padding: 12px; background: #16a34a; color: white; border: none; border-radius: 10px; font-weight: 600; cursor: pointer; }
    .rating-modal { position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 100; display: flex; align-items: center; justify-content: center; }
    .rating-content { background: white; border-radius: 16px; padding: 24px; width: 90%; max-width: 360px; }
    .rating-content h3 { text-align: center; margin-bottom: 16px; }
    .stars { display: flex; justify-content: center; gap: 8px; margin-bottom: 16px; }
    .star { font-size: 2rem; background: none; border: none; cursor: pointer; }
    .rating-content textarea { width: 100%; height: 80px; border: 1px solid #ddd; border-radius: 8px; padding: 10px; resize: none; margin-bottom: 12px; }
    .rating-actions { display: flex; gap: 10px; }
    .btn-skip { flex: 1; padding: 10px; background: #f5f5f5; border: none; border-radius: 8px; cursor: pointer; }
    .btn-submit { flex: 1; padding: 10px; background: #22c55e; color: white; border: none; border-radius: 8px; font-weight: 600; cursor: pointer; }
    .btn-submit:disabled { background: #ccc; }
  `]
})
export class RideTrackingComponent implements OnInit, OnDestroy {
  ride = signal<Ride | null>(null);
  etaMinutes = signal(0);
  selectedRating = signal(0);
  ratingComment = signal('');
  rated = signal(false);
  showRating = false;
  private map: L.Map | null = null;
  private driverMarker: L.Marker | null = null;
  private refreshInterval: any;
  private wsSub: any;
  private previousStatus: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private rideService: RideService,
    private mapService: MapService,
    private wsService: WebSocketService,
    private auth: AuthService,
    private router: Router,
    private notificationSound: NotificationSoundService
  ) {}

  ngOnInit() {
    const token = this.auth.getToken();
    if (token && !this.wsService.isConnected()) {
      this.wsService.connect(token);
    }
    const id = this.route.snapshot.paramMap.get('id')!;
    this.loadRide(id);
    this.refreshInterval = setInterval(() => this.loadRide(id), 5000);
  }

  ngOnDestroy() {
    clearInterval(this.refreshInterval);
    if (this.wsSub) this.wsSub.unsubscribe();
    if (this.map) this.mapService.destroyMap('tracking-map');
  }

  private loadRide(id: string) {
    this.rideService.getRideById(id).subscribe(res => {
      if (res.success && res.data) {
        const prev = this.previousStatus;
        const curr = res.data.status;
        this.previousStatus = curr;

        if (prev && curr !== prev) {
          if (curr === 'ACCEPTED' || curr === 'DRIVER_FOUND') {
            this.notificationSound.play('ride-accepted');
          } else if (curr === 'CANCELLED' || curr === 'EXPIRED') {
            this.notificationSound.play('ride-cancelled');
          }
        }

        this.ride.set(res.data);
        this.updateMap(res.data);
        this.setupWebSocket(id);

        if (curr === 'COMPLETED' || curr === 'CANCELLED' || curr === 'EXPIRED') {
          clearInterval(this.refreshInterval);
        }
      }
    });
  }

  private setupWebSocket(rideId: string) {
    if (this.wsSub) return;
    this.wsSub = this.wsService.subscribe('/user/queue/ride-update').subscribe((msg: any) => {
      if (msg && msg.rideId === rideId) {
        if (msg.status === 'EXPIRED' || msg.status === 'CANCELLED') {
          this.notificationSound.play('ride-cancelled');
          clearInterval(this.refreshInterval);
          this.ride.set({ ...this.ride()!, status: msg.status });
          setTimeout(() => this.router.navigate(['/ride/request']), 3000);
        } else {
          if (msg.status === 'ACCEPTED' || msg.status === 'DRIVER_FOUND') {
            this.notificationSound.play('ride-accepted');
          }
          this.loadRide(rideId);
        }
      }
    });
    this.wsService.subscribe('/user/queue/ride-request').subscribe((msg: any) => {
      if (msg && msg.type === 'SOS_ALERT') {
        this.notificationSound.play('sos');
        alert('🚨 Alerte SOS déclenchée par le chauffeur!\nTéléphone: ' + msg.userPhone);
      }
    });
    this.wsService.subscribe('/topic/ride/' + rideId + '/tracking').subscribe((msg: any) => {
      if (this.driverMarker && this.map) {
        this.mapService.updateMarkerPosition(this.driverMarker, msg.lat, msg.lng);
      }
    });
  }

  private updateMap(ride: Ride) {
    if (!this.map) {
      this.map = this.mapService.createMap('tracking-map', ride.pickupLat, ride.pickupLng, 14);
    }

    if (!this.driverMarker && ride.driverId) {
      const lat = ride.pickupLat;
      const lng = ride.pickupLng;
      const popupHtml = this.buildDriverPopup(ride);
      this.driverMarker = this.mapService.addMarker(this.map, lat, lng, 'driver',
        `${ride.driverFirstName} ${ride.driverLastName}`, ride.driverAvatarUrl, popupHtml);
    }

    // Fit map to pickup and destination
    this.mapService.fitBounds(this.map, [
      [ride.pickupLat, ride.pickupLng],
      [ride.destinationLat, ride.destinationLng]
    ]);
  }

  getStatusText(): string {
    const status = this.ride()?.status;
    switch (status) {
      case 'SEARCHING': return 'Recherche d\'un chauffeur...';
      case 'DRIVER_FOUND': return 'Chauffeur trouvé !';
      case 'ACCEPTED': return 'Chauffeur confirmé';
      case 'DRIVER_EN_ROUTE': return 'Le chauffeur est en route';
      case 'ARRIVED': return 'Le chauffeur est arrivé';
      case 'IN_PROGRESS': return 'Course en cours';
      case 'COMPLETED': return 'Course terminée !';
      case 'CANCELLED': return 'Course annulée';
      case 'EXPIRED': return 'Aucun autre chauffeur trouvé';
      default: return '';
    }
  }

  canCancel(): boolean {
    const s = this.ride()?.status;
    return s === 'SEARCHING' || s === 'DRIVER_FOUND' || s === 'ACCEPTED' || s === 'DRIVER_EN_ROUTE';
  }

  formatPrice(price: number): string {
    return new Intl.NumberFormat('fr-FR').format(price);
  }

  buildDriverPopup(ride: Ride): string {
    const stars = ride.driverRating ? '⭐'.repeat(Math.round(Number(ride.driverRating))) : '';
    const rating = ride.driverRating ? Number(ride.driverRating).toFixed(1) : 'N/A';
    const photo = ride.driverAvatarUrl
      ? `<img src="${ride.driverAvatarUrl}" style="width:56px;height:56px;border-radius:50%;object-fit:cover;border:3px solid #3b82f6;" onerror="this.style.display='none'"/>`
      : `<div style="width:56px;height:56px;border-radius:50%;background:#3b82f6;color:#fff;display:flex;align-items:center;justify-content:center;font-size:22px;font-weight:700;">${(ride.driverFirstName || 'D').charAt(0)}</div>`;
    const vehicle = [ride.driverVehicleColor, ride.driverVehicleBrand, ride.driverVehicleModel].filter(Boolean).join(' ');
    return `
      <div style="min-width:200px;font-family:inherit;text-align:center;">
        <div style="display:flex;justify-content:center;margin-bottom:8px;">${photo}</div>
        <div style="font-weight:700;font-size:1rem;">${ride.driverFirstName} ${ride.driverLastName}</div>
        <div style="color:#f59e0b;font-size:0.9rem;margin:4px 0;">${stars} <span style="color:#6b7280;">${rating}</span></div>
        ${vehicle ? `<div style="font-size:0.85rem;color:#374151;margin-top:4px;">${vehicle}</div>` : ''}
        ${ride.driverVehiclePlate ? `<div style="font-size:0.8rem;color:#6b7280;font-weight:600;margin-top:2px;">${ride.driverVehiclePlate}</div>` : ''}
      </div>`;
  }

  cancelRide() {
    if (!this.ride()) return;
    this.notificationSound.play('ride-cancelled');
    this.rideService.cancelRide(this.ride()!.id).subscribe(() => {
      this.router.navigate(['/']);
    });
  }

  submitRating() {
    if (!this.ride() || this.selectedRating() === 0) return;
    this.rideService.rateRide(this.ride()!.id, this.selectedRating(), this.ratingComment()).subscribe(() => {
      this.rated.set(true);
      this.showRating = false;
    });
  }

  goHome() {
    this.router.navigate(['/']);
  }

  downloadInvoice() {
    if (!this.ride()) return;
    this.rideService.downloadInvoice(this.ride()!.id).subscribe({
      next: (blob: Blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'facture-SW-' + this.ride()!.id.substring(0, 8).toUpperCase() + '.pdf';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      },
      error: (err: any) => {
        console.error('Failed to download invoice:', err);
      }
    });
  }

  downloadReceipt() {
    if (!this.ride()) return;
    this.rideService.downloadReceipt(this.ride()!.id).subscribe({
      next: (blob: Blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'ticket-SW-' + this.ride()!.id.substring(0, 8).toUpperCase() + '.pdf';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      },
      error: (err: any) => {
        console.error('Failed to download receipt:', err);
      }
    });
  }
}
