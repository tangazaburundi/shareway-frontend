import { Component, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { RideService } from '../../../core/services/ride.service';
import { WebSocketService } from '../../../core/services/websocket.service';
import { Ride } from '../../../core/models/ride.model';

@Component({
  selector: 'app-ride-offer',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="offer-page">
      @if (ride()) {
        <div class="offer-card" [class.urgent]="timerSeconds() <= 10">
          <!-- Header -->
          <div class="offer-header">
            <div class="header-badge">Nouvelle demande</div>
            <div class="timer-circle" [class.warning]="timerSeconds() <= 10">
              <svg viewBox="0 0 36 36" class="timer-svg">
                <circle class="timer-bg" cx="18" cy="18" r="15.9"/>
                <circle class="timer-progress" cx="18" cy="18" r="15.9"
                  [style.stroke-dashoffset]="timerOffset()"/>
              </svg>
              <span class="timer-number">{{ timerSeconds() }}</span>
            </div>
          </div>

          <!-- Passenger Info -->
          <div class="passenger-section">
            <div class="passenger-avatar">
              {{ ride()!.passengerFirstName?.charAt(0) || 'P' }}
            </div>
            <div class="passenger-info">
              <div class="passenger-name">
                {{ ride()!.passengerFirstName }} {{ ride()!.passengerLastName }}
              </div>
              <div class="passenger-rating" *ngIf="ride()!.passengerRating">
                ⭐ {{ ride()!.passengerRating }}
              </div>
            </div>
          </div>

          <!-- Route -->
          <div class="route-section">
            <div class="route-point">
              <span class="route-dot pickup"></span>
              <div class="route-details">
                <span class="route-label">Prise en charge</span>
                <span class="route-address">{{ ride()!.pickupAddress || 'Position GPS' }}</span>
              </div>
            </div>
            <div class="route-line"></div>
            <div class="route-point">
              <span class="route-dot destination"></span>
              <div class="route-details">
                <span class="route-label">Destination</span>
                <span class="route-address">{{ ride()!.destinationAddress || 'Position GPS' }}</span>
              </div>
            </div>
          </div>

          <!-- Details -->
          <div class="details-grid">
            <div class="detail-item">
              <span class="detail-icon">📏</span>
              <span class="detail-value">{{ ride()!.estimatedDistanceKm || '?' }} km</span>
            </div>
            <div class="detail-item">
              <span class="detail-icon">⏱️</span>
              <span class="detail-value">{{ ride()!.estimatedDurationMin || '?' }} min</span>
            </div>
            <div class="detail-item price">
              <span class="detail-icon">💰</span>
              <span class="detail-value">{{ formatPrice(ride()!.estimatedPrice || 0) }} {{ ride()!.currency }}</span>
            </div>
          </div>

          <!-- Actions -->
          <div class="offer-actions">
            @if (showRejectConfirm()) {
              <div class="reject-reason-section">
                <label>Motif du refus</label>
                <textarea
                  [value]="rejectReason()"
                  (input)="rejectReason.set($any($event.target).value)"
                  placeholder="Expliquez pourquoi vous refusez..."
                  rows="3"
                ></textarea>
                <div class="reject-confirm-actions">
                  <button class="btn-cancel-reject" (click)="cancelReject()" [disabled]="processing()">
                    Annuler
                  </button>
                  <button class="btn-confirm-reject" (click)="confirmReject()" [disabled]="processing()">
                    {{ processing() ? 'Envoi...' : 'Confirmer' }}
                  </button>
                </div>
              </div>
            } @else {
              <button class="btn-reject" (click)="showRejectConfirm.set(true)" [disabled]="processing()">
                Refuser
              </button>
              <button class="btn-accept" (click)="acceptRide()" [disabled]="processing()">
                <span *ngIf="!processing()">Accepter</span>
                <span *ngIf="processing()">Chargement...</span>
              </button>
            }
          </div>
        </div>
      } @else {
        <div class="loading-state">
          <div class="spinner"></div>
          <p>Chargement de l'offre...</p>
        </div>
      }
    </div>
  `,
  styleUrls: ['./ride-offer.component.css']
})
export class RideOfferComponent implements OnInit, OnDestroy {
  ride = signal<Ride | null>(null);
  timerSeconds = signal(180);
  timerOffset = signal(0);
  searchTimeout = signal(180);
  processing = signal(false);
  showRejectConfirm = signal(false);
  rejectReason = signal('');

  private rideId = '';
  private countdown: any;
  private wsSub: any;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private rideService: RideService,
    private wsService: WebSocketService
  ) {}

  ngOnInit() {
    this.rideId = this.route.snapshot.paramMap.get('id') || '';
    this.loadRide();
    this.loadSearchTimeout();
  }

  ngOnDestroy() {
    clearInterval(this.countdown);
    if (this.wsSub) this.wsSub.unsubscribe();
  }

  private loadRide() {
    if (!this.rideId) return;
    this.rideService.getRideById(this.rideId).subscribe(res => {
      if (res.success && res.data) {
        this.ride.set(res.data);
        if (res.data.status !== 'DRIVER_FOUND') {
          this.navigateAfterAction();
        }
      }
    });
  }

  private loadSearchTimeout() {
    this.rideService.getSearchTimeoutConfig().subscribe({
      next: (res: any) => {
        if (res && res.data) {
          this.searchTimeout.set(res.data.timeoutSeconds || 180);
          this.timerSeconds.set(this.searchTimeout());
          this.timerOffset.set(0);
        }
        this.startTimer();
      },
      error: () => {
        this.startTimer();
      }
    });
  }

  private startTimer() {
    const circumference = 100;
    this.countdown = setInterval(() => {
      const current = this.timerSeconds();
      if (current <= 0) {
        clearInterval(this.countdown);
        this.autoReject();
        return;
      }
      this.timerSeconds.set(current - 1);
      this.timerOffset.set(circumference * (1 - (current - 1) / this.searchTimeout()));
    }, 1000);
  }

  private autoReject() {
    this.rideService.timeoutRide(this.rideId).subscribe(() => {
      this.router.navigate(['/driver/dashboard']);
    });
  }

  acceptRide() {
    this.processing.set(true);
    this.rideService.acceptRide(this.rideId).subscribe({
      next: (res) => {
        this.processing.set(false);
        if (res.success) {
          this.navigateAfterAction();
        }
      },
      error: () => {
        this.processing.set(false);
      }
    });
  }

  rejectRide() {
    this.showRejectConfirm.set(true);
  }

  cancelReject() {
    this.showRejectConfirm.set(false);
    this.rejectReason.set('');
  }

  confirmReject() {
    this.processing.set(true);
    this.rideService.rejectRide(this.rideId, this.rejectReason()).subscribe({
      next: () => {
        this.processing.set(false);
        this.router.navigate(['/driver/dashboard']);
      },
      error: () => {
        this.processing.set(false);
      }
    });
  }

  private navigateAfterAction() {
    this.router.navigate(['/ride/pickup', this.rideId]);
  }

  formatPrice(price: number): string {
    return new Intl.NumberFormat('fr-FR').format(price);
  }
}
