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
  styles: [`
    .offer-page {
      height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(180deg, #1a1a2e 0%, #16213e 100%);
      padding: 24px;
    }

    .offer-card {
      background: white;
      border-radius: 24px;
      padding: 28px 24px;
      max-width: 380px;
      width: 100%;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
      animation: slideUp 0.4s ease-out;
    }

    .offer-card.urgent {
      animation: urgentPulse 0.5s ease-in-out infinite alternate;
    }

    @keyframes slideUp {
      from { transform: translateY(40px); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }

    @keyframes urgentPulse {
      from { box-shadow: 0 20px 60px rgba(0,0,0,0.3); }
      to { box-shadow: 0 20px 60px rgba(239, 68, 68, 0.4); }
    }

    /* Header */
    .offer-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
    }

    .header-badge {
      padding: 6px 14px;
      background: #dbeafe;
      color: #2563eb;
      border-radius: 20px;
      font-size: 0.8rem;
      font-weight: 600;
    }

    .timer-circle {
      position: relative;
      width: 52px;
      height: 52px;
    }

    .timer-svg {
      width: 100%;
      height: 100%;
      transform: rotate(-90deg);
    }

    .timer-bg {
      fill: none;
      stroke: #e5e7eb;
      stroke-width: 2.5;
    }

    .timer-progress {
      fill: none;
      stroke: #22c55e;
      stroke-width: 2.5;
      stroke-dasharray: 100;
      stroke-linecap: round;
      transition: stroke-dashoffset 1s linear, stroke 0.3s;
    }

    .timer-circle.warning .timer-progress {
      stroke: #ef4444;
    }

    .timer-number {
      position: absolute;
      inset: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1rem;
      font-weight: 700;
      color: #374151;
    }

    .timer-circle.warning .timer-number {
      color: #ef4444;
    }

    /* Passenger */
    .passenger-section {
      display: flex;
      align-items: center;
      gap: 14px;
      margin-bottom: 24px;
      padding-bottom: 20px;
      border-bottom: 1px solid #f3f4f6;
    }

    .passenger-avatar {
      width: 56px;
      height: 56px;
      border-radius: 50%;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.5rem;
      font-weight: 700;
      flex-shrink: 0;
    }

    .passenger-name {
      font-size: 1.15rem;
      font-weight: 700;
      color: #1a1a2e;
    }

    .passenger-rating {
      font-size: 0.9rem;
      color: #f59e0b;
      margin-top: 2px;
    }

    /* Route */
    .route-section {
      margin-bottom: 20px;
    }

    .route-point {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      padding: 8px 0;
    }

    .route-dot {
      width: 12px;
      height: 12px;
      border-radius: 50%;
      flex-shrink: 0;
      margin-top: 4px;
    }

    .route-dot.pickup { background: #22c55e; }
    .route-dot.destination { background: #ef4444; }

    .route-line {
      width: 2px;
      height: 20px;
      background: #d1d5db;
      margin-left: 5px;
    }

    .route-label {
      font-size: 0.7rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #9ca3af;
      font-weight: 600;
    }

    .route-address {
      display: block;
      font-size: 0.9rem;
      color: #374151;
      margin-top: 2px;
    }

    /* Details Grid */
    .details-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 12px;
      margin-bottom: 24px;
      padding: 16px;
      background: #f9fafb;
      border-radius: 12px;
    }

    .detail-item {
      text-align: center;
    }

    .detail-icon {
      display: block;
      font-size: 1.2rem;
      margin-bottom: 4px;
    }

    .detail-value {
      font-size: 0.85rem;
      font-weight: 600;
      color: #374151;
    }

    .detail-item.price .detail-value {
      color: #16a34a;
      font-size: 1rem;
    }

    /* Actions */
    .offer-actions {
      display: grid;
      grid-template-columns: 1fr 1.5fr;
      gap: 12px;
    }

    .btn-reject {
      padding: 16px;
      background: #f3f4f6;
      color: #6b7280;
      border: none;
      border-radius: 14px;
      font-size: 1rem;
      font-weight: 600;
      cursor: pointer;
      transition: background 0.2s;
    }

    .btn-reject:hover:not(:disabled) {
      background: #fee2e2;
      color: #dc2626;
    }

    .btn-accept {
      padding: 16px;
      background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
      color: white;
      border: none;
      border-radius: 14px;
      font-size: 1rem;
      font-weight: 600;
      cursor: pointer;
      transition: transform 0.2s, box-shadow 0.2s;
    }

    .btn-accept:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(34, 197, 94, 0.4);
    }

    .btn-accept:disabled, .btn-reject:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .reject-reason-section {
      width: 100%;
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    .reject-reason-section label {
      font-size: 0.85rem;
      font-weight: 600;
      color: #374151;
    }
    .reject-reason-section textarea {
      width: 100%;
      padding: 10px 12px;
      border: 1px solid #d1d5db;
      border-radius: 8px;
      font-size: 0.9rem;
      resize: vertical;
      font-family: inherit;
    }
    .reject-reason-section textarea:focus {
      outline: none;
      border-color: #ef4444;
      box-shadow: 0 0 0 3px rgba(239,68,68,0.1);
    }
    .reject-confirm-actions {
      display: flex;
      gap: 10px;
    }
    .btn-cancel-reject {
      flex: 1;
      padding: 12px;
      background: #e5e7eb;
      color: #374151;
      border: none;
      border-radius: 10px;
      font-size: 0.9rem;
      font-weight: 600;
      cursor: pointer;
    }
    .btn-confirm-reject {
      flex: 1;
      padding: 12px;
      background: #ef4444;
      color: white;
      border: none;
      border-radius: 10px;
      font-size: 0.9rem;
      font-weight: 600;
      cursor: pointer;
    }
    .btn-cancel-reject:disabled, .btn-confirm-reject:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    /* Loading */
    .loading-state {
      text-align: center;
      color: white;
    }

    .spinner {
      width: 40px;
      height: 40px;
      border: 3px solid rgba(255,255,255,0.3);
      border-top-color: white;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
      margin: 0 auto 16px;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  `]
})
export class RideOfferComponent implements OnInit, OnDestroy {
  ride = signal<Ride | null>(null);
  timerSeconds = signal(180);
  timerOffset = signal(0);
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
    this.startTimer();
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
      this.timerOffset.set(circumference * (1 - (current - 1) / 180));
    }, 1000);
  }

  private autoReject() {
    this.rideService.rejectRide(this.rideId).subscribe(() => {
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
