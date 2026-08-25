import { Component, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { RideService } from '../../../core/services/ride.service';
import { MapService } from '../../../core/services/map.service';
import { WebSocketService } from '../../../core/services/websocket.service';
import { NotificationSoundService } from '../../../core/services/notification-sound.service';
import { AuthService } from '../../../core/services/auth.service';
import { DriverLocationService } from '../../../core/services/driver-location.service';
import { Ride } from '../../../core/models/ride.model';
import * as L from 'leaflet';

@Component({
  selector: 'app-ride-in-progress',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="in-progress-page">
      <div class="map-container" id="progress-map"></div>

      <!-- Status Bar -->
      <div class="status-bar">
        <div class="status-dot active"></div>
        <span>Course en cours</span>
      </div>

      <!-- Bottom Sheet -->
      <div class="bottom-sheet">
        <div class="card-handle"></div>

        <!-- Passenger Card -->
        <div class="passenger-row">
          @if (ride()!.passengerAvatarUrl) {
            <img [src]="ride()!.passengerAvatarUrl" class="passenger-avatar-img" (error)="$any($event.target).style.display='none'; $any($event.target).nextElementSibling.style.display='flex'" />
          }
          <div class="passenger-avatar" [style.display]="ride()!.passengerAvatarUrl ? 'none' : 'flex'">
            {{ ride()!.passengerFirstName?.charAt(0) || 'P' }}
          </div>
          <div class="passenger-info">
            <div class="passenger-name">{{ ride()!.passengerFirstName }} {{ ride()!.passengerLastName }}</div>
            <div class="passenger-meta">
              <span *ngIf="ride()!.passengerRating">⭐ {{ ride()!.passengerRating }}</span>
            </div>
          </div>
        </div>

        <!-- Route -->
        <div class="route-display">
          <div class="route-point">
            <span class="route-dot pickup"></span>
            <span class="route-text">{{ ride()!.pickupAddress || 'Départ' }}</span>
          </div>
          <div class="route-line"></div>
          <div class="route-point">
            <span class="route-dot dest"></span>
            <span class="route-text">{{ ride()!.destinationAddress || 'Destination' }}</span>
          </div>
        </div>

        <!-- ETA -->
        <div class="eta-section">
          <div class="eta-card">
            <span class="eta-label">Arrivée estimée</span>
            <span class="eta-value">{{ etaMinutes() }} min</span>
          </div>
          <div class="eta-card">
            <span class="eta-label">Distance restante</span>
            <span class="eta-value">{{ remainingKm() }} km</span>
          </div>
        </div>

        <!-- Price -->
        <div class="price-display" *ngIf="ride()!.estimatedPrice">
          <span class="price-label">Prix estimé</span>
          <span class="price-value">{{ formatPrice(ride()!.estimatedPrice!) }} {{ ride()!.currency }}</span>
        </div>

        <!-- Actions -->
        <div class="action-buttons">
          <button class="btn-sos" (click)="triggerSOS()">
            SOS
          </button>
          <button class="btn-rendre" (click)="showTransferConfirm.set(true)">
            Rendre
          </button>
          <button class="btn-complete" (click)="completeRide()">
            Terminer la course
          </button>
        </div>
      </div>

      @if (showTransferConfirm()) {
        <div class="modal-overlay" (click)="showTransferConfirm.set(false)">
          <div class="confirm-modal" (click)="$event.stopPropagation()">
            <div class="modal-icon">🔄</div>
            <h3>Rendre cette course ?</h3>
            <p>Un autre chauffeur sera assigné automatiquement.</p>
            <div class="modal-actions">
              <button class="modal-btn cancel" (click)="showTransferConfirm.set(false)">Annuler</button>
              <button class="modal-btn confirm" (click)="confirmTransfer()">Confirmer</button>
            </div>
          </div>
        </div>
      }

      @if (showSosConfirm()) {
        <div class="modal-overlay" (click)="showSosConfirm.set(false)">
          <div class="confirm-modal" (click)="$event.stopPropagation()">
            <div class="modal-icon">🚨</div>
            <h3>Alerte SOS</h3>
            <p>Cela va notifier l'administrateur et partager votre position en temps réel.</p>
            <div class="modal-actions">
              <button class="modal-btn cancel" (click)="showSosConfirm.set(false)">Annuler</button>
              <button class="modal-btn confirm sos" (click)="confirmSOS()">Envoyer l'alerte</button>
            </div>
          </div>
        </div>
      }

      @if (sosResult()) {
        <div class="modal-overlay" (click)="sosResult.set(null)">
          <div class="confirm-modal" (click)="$event.stopPropagation()">
            <div class="modal-icon">{{ sosResult() === 'ok' ? '✅' : '❌' }}</div>
            <h3>{{ sosResult() === 'ok' ? 'Alerte envoyée' : 'Erreur' }}</h3>
            <p>{{ sosResult() === 'ok' ? 'L\'administrateur a été notifié.' : 'Erreur lors de l\'envoi de l\'alerte SOS.' }}</p>
            <div class="modal-actions">
              <button class="modal-btn confirm" (click)="sosResult.set(null)">OK</button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styleUrls: ['./ride-in-progress.component.css']
})
export class RideInProgressComponent implements OnInit, OnDestroy {
  ride = signal<Ride | null>(null);
  etaMinutes = signal(0);
  remainingKm = signal(0);
  showTransferConfirm = signal(false);
  showSosConfirm = signal(false);
  sosResult = signal<'ok' | 'error' | null>(null);

  private rideId = '';
  private map: L.Map | null = null;
  private destMarker: L.Marker | null = null;
  private driverMarker: L.Marker | null = null;
  private refreshInterval: any;
  private wsSub: any;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private rideService: RideService,
    private mapService: MapService,
    private wsService: WebSocketService,
    private auth: AuthService,
    private driverLocationService: DriverLocationService,
    private notificationSound: NotificationSoundService
  ) {}

  ngOnInit() {
    const token = this.auth.getToken();
    if (token && !this.wsService.isConnected()) {
      this.wsService.connect(token);
    }
    this.rideId = this.route.snapshot.paramMap.get('id') || '';
    this.loadRide();
    this.refreshInterval = setInterval(() => this.loadRide(), 5000);
    this.setupWebSocket();
  }

  ngOnDestroy() {
    clearInterval(this.refreshInterval);
    if (this.wsSub) this.wsSub.unsubscribe();
    if (this.map) this.mapService.destroyMap('progress-map');
  }

  private loadRide() {
    if (!this.rideId) return;
    this.rideService.getRideById(this.rideId).subscribe(res => {
      if (res.success && res.data) {
        this.ride.set(res.data);
        this.updateMap(res.data);
        this.updateEta(res.data);

        if (res.data.status === 'COMPLETED') {
          this.router.navigate(['/driver/dashboard']);
        }
      }
    });
  }

  private setupWebSocket() {
    this.wsSub = this.wsService.subscribe('/user/queue/ride-update').subscribe((msg: any) => {
      if (msg && msg.rideId === this.rideId) {
        if (msg.status === 'CANCELLED' || msg.status === 'EXPIRED') {
          this.notificationSound.play('ride-cancelled');
          this.router.navigate(['/driver/dashboard']);
        }
      }
    });
  }

  private updateMap(ride: Ride) {
    if (!this.map) {
      this.map = this.mapService.createMap('progress-map', ride.destinationLat, ride.destinationLng, 13);
    }

    if (!this.destMarker) {
      this.destMarker = this.mapService.addMarker(
        this.map, ride.destinationLat, ride.destinationLng, 'destination',
        ride.destinationAddress || 'Destination'
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
        [ride.destinationLat, ride.destinationLng]
      ]);
    });
  }

  private updateEta(ride: Ride) {
    if (ride.estimatedDurationMin) {
      this.etaMinutes.set(ride.estimatedDurationMin);
    }
    if (ride.estimatedDistanceKm) {
      this.remainingKm.set(ride.estimatedDistanceKm);
    }
  }

  completeRide() {
    this.rideService.completeRide(this.rideId).subscribe(res => {
      if (res.success) {
        this.router.navigate(['/driver/dashboard']);
      }
    });
  }

  triggerSOS() {
    if (!this.ride()) return;
    this.showSosConfirm.set(true);
  }

  confirmSOS() {
    this.showSosConfirm.set(false);
    if (!this.ride()) return;

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => this.sendSosRequest(pos.coords.latitude, pos.coords.longitude),
        () => this.sendSosRequest(undefined, undefined),
        { timeout: 8000, enableHighAccuracy: true }
      );
    } else {
      this.sendSosRequest(undefined, undefined);
    }
  }

  private sendSosRequest(lat?: number, lng?: number) {
    this.rideService.sosAlert(this.rideId, lat, lng).subscribe({
      next: () => this.sosResult.set('ok'),
      error: () => this.sosResult.set('error')
    });
  }

  transferRide() {
    if (!this.ride()) return;
    this.showTransferConfirm.set(true);
  }

  confirmTransfer() {
    this.showTransferConfirm.set(false);
    if (!this.ride()) return;
    this.rideService.transferRide(this.rideId).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.ride.set(res.data);
        } else {
          this.router.navigate(['/driver/dashboard']);
        }
      },
      error: () => {
        this.router.navigate(['/driver/dashboard']);
      }
    });
  }

  formatPrice(price: number): string {
    return new Intl.NumberFormat('fr-FR').format(price);
  }
}
