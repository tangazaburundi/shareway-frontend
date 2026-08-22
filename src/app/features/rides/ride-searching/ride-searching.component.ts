import { Component, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { RideService } from '../../../core/services/ride.service';
import { WebSocketService } from '../../../core/services/websocket.service';
import { NotificationSoundService } from '../../../core/services/notification-sound.service';
import { AuthService } from '../../../core/services/auth.service';
import { Ride } from '../../../core/models/ride.model';

@Component({
  selector: 'app-ride-searching',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="searching-page">
      <div class="searching-content">
        <!-- Radar Animation -->
        <div class="radar-container">
          <div class="radar">
            <div class="radar-ring ring-1"></div>
            <div class="radar-ring ring-2"></div>
            <div class="radar-ring ring-3"></div>
            <div class="radar-dot"></div>
          </div>
          <div class="car-pulse">
            <span class="car-icon">🚗</span>
          </div>
        </div>

        <h2 class="searching-title">Recherche d'un chauffeur...</h2>
        <p class="searching-subtitle">Nous trouvons le meilleur chauffeur près de vous</p>

        <!-- Timer -->
        <div class="timer-section">
          <div class="timer-bar">
            <div class="timer-fill" [style.width.%]="timerPercent()"></div>
          </div>
          <span class="timer-text">{{ formatTimer(timerSeconds()) }}</span>
        </div>

        <!-- Ride Info -->
        @if (ride()) {
          <div class="ride-info-card">
            <div class="info-row">
              <span class="info-icon pickup-dot"></span>
              <span class="info-text">{{ ride()!.pickupAddress || 'Point de prise en charge' }}</span>
            </div>
            <div class="info-row">
              <span class="info-icon dest-dot"></span>
              <span class="info-text">{{ ride()!.destinationAddress || 'Destination' }}</span>
            </div>
            <div class="info-price" *ngIf="ride()!.estimatedPrice">
              Prix estimé: <strong>{{ formatPrice(ride()!.estimatedPrice!) }} {{ ride()!.currency }}</strong>
            </div>
          </div>
        }

        <!-- Status Messages -->
        <div class="status-messages">
          <div class="status-item" [class.active]="statusIndex() >= 0">
            <span class="status-dot"></span>
            <span>Recherche en cours</span>
          </div>
          <div class="status-item" [class.active]="statusIndex() >= 1">
            <span class="status-dot"></span>
            <span>Vérification des chauffeurs à proximité</span>
          </div>
          <div class="status-item" [class.active]="statusIndex() >= 2">
            <span class="status-dot"></span>
            <span>Optimisation du meilleur itinéraire</span>
          </div>
        </div>

        <!-- Cancel Button -->
        <button class="btn-cancel" (click)="cancelRide()">
          Annuler la recherche
        </button>
      </div>
    </div>

    <!-- Driver Found Toast -->
    @if (driverFoundMessage()) {
      <div class="toast-overlay">
        <div class="toast toast-success">
          <div class="toast-icon">✅</div>
          <div class="toast-content">
            <strong>{{ driverFoundMessage() }}</strong>
            <span>Redirection vers le suivi...</span>
          </div>
        </div>
      </div>
    }

    <!-- Driver Rejected Toast -->
    @if (rejectedMessage()) {
      <div class="toast-overlay">
        <div class="toast toast-warning">
          <div class="toast-icon">⚠️</div>
          <div class="toast-content">
            <strong>{{ rejectedMessage() }}</strong>
            <span>Nouvelle recherche en cours...</span>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .searching-page {
      height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(180deg, #f0fdf4 0%, #ffffff 100%);
    }

    .searching-content {
      text-align: center;
      padding: 24px;
      max-width: 400px;
      width: 100%;
    }

    /* Radar Animation */
    .radar-container {
      position: relative;
      width: 160px;
      height: 160px;
      margin: 0 auto 32px;
    }

    .radar {
      position: absolute;
      inset: 0;
    }

    .radar-ring {
      position: absolute;
      border: 2px solid #22c55e;
      border-radius: 50%;
      opacity: 0;
      animation: radarPulse 2s infinite ease-out;
    }

    .ring-1 { inset: 30%; animation-delay: 0s; }
    .ring-2 { inset: 15%; animation-delay: 0.5s; }
    .ring-3 { inset: 0%; animation-delay: 1s; }

    @keyframes radarPulse {
      0% { opacity: 0.6; transform: scale(0.8); }
      100% { opacity: 0; transform: scale(1.2); }
    }

    .radar-dot {
      position: absolute;
      top: 50%;
      left: 50%;
      width: 16px;
      height: 16px;
      background: #22c55e;
      border-radius: 50%;
      transform: translate(-50%, -50%);
      box-shadow: 0 0 20px rgba(34, 197, 94, 0.5);
    }

    .car-pulse {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      animation: carBounce 1s infinite ease-in-out;
    }

    .car-icon {
      font-size: 2.5rem;
    }

    @keyframes carBounce {
      0%, 100% { transform: translate(-50%, -50%) scale(1); }
      50% { transform: translate(-50%, -50%) scale(1.15); }
    }

    .searching-title {
      font-size: 1.5rem;
      font-weight: 700;
      color: #1a1a2e;
      margin: 0 0 8px;
    }

    .searching-subtitle {
      font-size: 0.95rem;
      color: #6b7280;
      margin: 0 0 24px;
    }

    /* Timer */
    .timer-section {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 24px;
    }

    .timer-bar {
      flex: 1;
      height: 6px;
      background: #e5e7eb;
      border-radius: 3px;
      overflow: hidden;
    }

    .timer-fill {
      height: 100%;
      background: linear-gradient(90deg, #22c55e, #16a34a);
      border-radius: 3px;
      transition: width 1s linear;
    }

    .timer-text {
      font-size: 0.9rem;
      font-weight: 600;
      color: #16a34a;
      min-width: 30px;
    }

    /* Ride Info Card */
    .ride-info-card {
      background: white;
      border: 1px solid #e5e7eb;
      border-radius: 12px;
      padding: 16px;
      margin-bottom: 24px;
      text-align: left;
    }

    .info-row {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 8px;
    }

    .info-row:last-of-type {
      margin-bottom: 0;
    }

    .info-icon {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      flex-shrink: 0;
    }

    .pickup-dot { background: #22c55e; }
    .dest-dot { background: #ef4444; }

    .info-text {
      font-size: 0.9rem;
      color: #374151;
    }

    .info-price {
      margin-top: 12px;
      padding-top: 12px;
      border-top: 1px solid #f3f4f6;
      font-size: 0.9rem;
      color: #6b7280;
    }

    .info-price strong {
      color: #16a34a;
      font-size: 1.1rem;
    }

    /* Status Messages */
    .status-messages {
      margin-bottom: 32px;
      text-align: left;
    }

    .status-item {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 8px 0;
      color: #9ca3af;
      font-size: 0.85rem;
      transition: color 0.3s;
    }

    .status-item.active {
      color: #374151;
    }

    .status-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #d1d5db;
      transition: background 0.3s;
    }

    .status-item.active .status-dot {
      background: #22c55e;
      box-shadow: 0 0 8px rgba(34, 197, 94, 0.4);
    }

    .btn-cancel {
      width: 100%;
      padding: 14px;
      background: #fee2e2;
      color: #dc2626;
      border: none;
      border-radius: 12px;
      font-size: 1rem;
      font-weight: 600;
      cursor: pointer;
      transition: background 0.2s;
    }

    .btn-cancel:hover {
      background: #fecaca;
    }

    .toast-overlay {
      position: fixed;
      top: 24px;
      left: 50%;
      transform: translateX(-50%);
      z-index: 1000;
      animation: slideDown 0.3s ease;
    }

    @keyframes slideDown {
      from { opacity: 0; transform: translateX(-50%) translateY(-20px); }
      to { opacity: 1; transform: translateX(-50%) translateY(0); }
    }

    .toast {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 16px 24px;
      border-radius: 12px;
      box-shadow: 0 8px 24px rgba(0,0,0,0.15);
      min-width: 300px;
    }

    .toast-success {
      background: #166534;
      color: white;
    }

    .toast-warning {
      background: #92400e;
      color: white;
    }

    .toast-icon {
      font-size: 1.5rem;
    }

    .toast-content {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .toast-content strong {
      font-size: 1rem;
    }

    .toast-content span {
      font-size: 0.8rem;
      opacity: 0.85;
    }
  `]
})
export class RideSearchingComponent implements OnInit, OnDestroy {
  ride = signal<Ride | null>(null);
  timerSeconds = signal(180);
  timerPercent = signal(100);
  statusIndex = signal(0);
  driverFoundMessage = signal<string>('');
  rejectedMessage = signal<string>('');

  private rideId = '';
  private countdown: any;
  private statusInterval: any;
  private wsSub: any;
  private refreshInterval: any;
  private previousStatus: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private rideService: RideService,
    private wsService: WebSocketService,
    private auth: AuthService,
    private notificationSound: NotificationSoundService
  ) {}

  ngOnInit() {
    this.ensureWsConnected();
    this.rideId = this.route.snapshot.paramMap.get('id') || '';
    this.loadRide();
    this.startTimer();
    this.startStatusAnimation();
    this.listenForDriverFound();
    this.refreshInterval = setInterval(() => this.loadRide(), 5000);
  }

  ngOnDestroy() {
    clearInterval(this.countdown);
    clearInterval(this.statusInterval);
    clearInterval(this.refreshInterval);
    if (this.wsSub) this.wsSub.unsubscribe();
  }

  private ensureWsConnected() {
    const token = this.auth.getToken();
    if (token && !this.wsService.isConnected()) {
      this.wsService.connect(token);
    }
  }

  private loadRide() {
    if (!this.rideId) return;
    this.rideService.getRideById(this.rideId).subscribe(res => {
      if (res.success && res.data) {
        const prev = this.previousStatus;
        const curr = res.data.status;
        this.previousStatus = curr;
        this.ride.set(res.data);

        if (prev && curr !== prev && curr !== 'SEARCHING') {
          if (curr === 'ACCEPTED' || curr === 'DRIVER_FOUND') {
            this.notificationSound.play('ride-accepted');
          } else if (curr === 'CANCELLED' || curr === 'EXPIRED') {
            this.notificationSound.play('ride-cancelled');
          }
          this.navigateToTracking();
        }
      }
    });
  }

  private startTimer() {
    this.countdown = setInterval(() => {
      const current = this.timerSeconds();
      if (current <= 0) {
        clearInterval(this.countdown);
        this.onTimeout();
        return;
      }
      this.timerSeconds.set(current - 1);
      this.timerPercent.set((current - 1) / 180 * 100);
    }, 1000);
  }

  private startStatusAnimation() {
    this.statusInterval = setInterval(() => {
      const idx = this.statusIndex();
      if (idx < 2) {
        this.statusIndex.set(idx + 1);
      }
    }, 3000);
  }

  private listenForDriverFound() {
    if (!this.rideId) return;
    this.wsSub = this.wsService.subscribe('/user/queue/ride-update').subscribe((msg: any) => {
      if (msg && msg.rideId === this.rideId) {
        if (msg.status === 'ACCEPTED' || msg.status === 'DRIVER_FOUND') {
          const driverName = msg.driverName || 'Un chauffeur';
          this.notificationSound.play('ride-accepted');
          this.driverFoundMessage.set(`${driverName} a accepté votre course !`);
          this.rejectedMessage.set('');
          setTimeout(() => this.navigateToTracking(), 2000);
        } else if (msg.status === 'EXPIRED' || msg.status === 'CANCELLED') {
          this.notificationSound.play('ride-cancelled');
          clearInterval(this.countdown);
          this.rejectedMessage.set(msg.message || 'La recherche a expiré — aucun chauffeur disponible');
          setTimeout(() => this.router.navigate(['/ride/request']), 3000);
        } else if (msg.status === 'SEARCHING') {
          this.notificationSound.play('ride-cancelled');
          this.driverFoundMessage.set('');
          this.rejectedMessage.set(msg.message || 'Le chauffeur a refusé');
          setTimeout(() => this.rejectedMessage.set(''), 4000);
          this.loadRide();
        }
      }
    });
  }

  private onTimeout() {
    this.rideService.cancelRide(this.rideId, 'Aucun autre chauffeur trouvé').subscribe(() => {
      this.router.navigate(['/ride/request']);
    });
  }

  private navigateToTracking() {
    this.router.navigate(['/ride/tracking', this.rideId]);
  }

  cancelRide() {
    this.notificationSound.play('ride-cancelled');
    this.rideService.cancelRide(this.rideId, 'Annulé par le passager').subscribe(() => {
      this.router.navigate(['/']);
    });
  }

  formatTimer(seconds: number): string {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  }

  formatPrice(price: number): string {
    return new Intl.NumberFormat('fr-FR').format(price);
  }
}
