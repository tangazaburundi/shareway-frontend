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
  styles: [`
    .in-progress-page {
      height: 100vh;
      display: flex;
      flex-direction: column;
      position: relative;
    }

    .map-container {
      flex: 1;
      min-height: 45vh;
    }

    .status-bar {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      padding: 10px;
      background: #22c55e;
      color: white;
      font-weight: 600;
      font-size: 0.9rem;
    }

    .status-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: white;
    }

    .status-dot.active {
      animation: blink 1s infinite;
    }

    @keyframes blink {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.3; }
    }

    .bottom-sheet {
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
      gap: 12px;
      margin-bottom: 16px;
    }
    .passenger-avatar {
      width: 48px;
      height: 48px;
      border-radius: 50%;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.2rem;
      font-weight: 700;
      flex-shrink: 0;
    }
    .passenger-avatar-img {
      width: 48px;
      height: 48px;
      border-radius: 50%;
      object-fit: cover;
      flex-shrink: 0;
    }
    .passenger-info { flex: 1; }
    .passenger-name { font-weight: 600; font-size: 1rem; }
    .passenger-meta { font-size: 0.85rem; color: #6b7280; margin-top: 2px; }

    .route-display {
      margin-bottom: 16px;
    }

    .route-point {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 6px 0;
    }

    .route-dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      flex-shrink: 0;
    }

    .route-dot.pickup { background: #22c55e; }
    .route-dot.dest { background: #ef4444; }

    .route-line {
      width: 2px;
      height: 16px;
      background: #d1d5db;
      margin-left: 4px;
    }

    .route-text {
      font-size: 0.9rem;
      color: #374151;
    }

    .eta-section {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
      margin-bottom: 16px;
    }

    .eta-card {
      padding: 12px;
      background: #f9fafb;
      border-radius: 10px;
      text-align: center;
    }

    .eta-label {
      display: block;
      font-size: 0.75rem;
      color: #9ca3af;
      margin-bottom: 4px;
    }

    .eta-value {
      font-size: 1.2rem;
      font-weight: 700;
      color: #1a1a2e;
    }

    .price-display {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 16px;
      background: #f0fdf4;
      border-radius: 10px;
      margin-bottom: 16px;
    }

    .price-label {
      font-size: 0.85rem;
      color: #6b7280;
    }

    .price-value {
      font-size: 1.1rem;
      font-weight: 700;
      color: #16a34a;
    }

    .action-buttons {
      display: grid;
      grid-template-columns: 1fr 1fr 1.5fr;
      gap: 12px;
    }

    .btn-sos {
      padding: 14px;
      background: #fee2e2;
      color: #dc2626;
      border: none;
      border-radius: 12px;
      font-size: 0.95rem;
      font-weight: 600;
      cursor: pointer;
      transition: background 0.2s;
    }

    .btn-sos:hover {
      background: #fecaca;
    }

    .btn-rendre {
      padding: 14px;
      background: #fef3c7;
      color: #d97706;
      border: none;
      border-radius: 12px;
      font-size: 0.95rem;
      font-weight: 600;
      cursor: pointer;
      transition: background 0.2s;
    }

    .btn-rendre:hover {
      background: #fde68a;
    }

    .btn-complete {
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

    .btn-complete:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(34, 197, 94, 0.4);
    }

    .modal-overlay {
      position: fixed; top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(0,0,0,0.5); display: flex; align-items: center;
      justify-content: center; z-index: 1000; padding: 16px;
    }
    .confirm-modal {
      background: white; border-radius: 16px; padding: 28px 24px;
      width: 90%; max-width: 360px; text-align: center;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
    }
    .modal-icon { font-size: 40px; margin-bottom: 12px; }
    .confirm-modal h3 { margin: 0 0 8px; font-size: 1.2rem; }
    .confirm-modal p { margin: 0 0 20px; color: #6b7280; font-size: 0.9rem; line-height: 1.5; }
    .modal-actions { display: flex; gap: 12px; }
    .modal-btn {
      flex: 1; padding: 12px; border-radius: 10px; border: none;
      font-size: 0.95rem; font-weight: 600; cursor: pointer; transition: all 0.2s;
    }
    .modal-btn.cancel { background: #f3f4f6; color: #374151; }
    .modal-btn.cancel:hover { background: #e5e7eb; }
    .modal-btn.confirm { background: #3b82f6; color: white; }
    .modal-btn.confirm:hover { background: #2563eb; }
    .modal-btn.confirm.sos { background: #ef4444; }
    .modal-btn.confirm.sos:hover { background: #dc2626; }
  `]
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
    this.rideService.sosAlert(this.rideId).subscribe({
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
