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
  styleUrls: ['./ride-searching.component.css']
})
export class RideSearchingComponent implements OnInit, OnDestroy {
  ride = signal<Ride | null>(null);
  timerSeconds = signal(180);
  timerPercent = signal(100);
  searchTimeout = signal(180);
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
    this.loadSearchTimeout();
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

  private loadSearchTimeout() {
    let adminDefaults: Record<string, string> = {};

    this.rideService.getSearchTimeoutConfig().subscribe({
      next: (res: any) => {
        if (res && res.data) {
          this.searchTimeout.set(res.data.timeoutSeconds || 180);
          this.timerSeconds.set(this.searchTimeout());
          this.timerPercent.set(100);
          if (res.data.notificationVolume !== undefined && res.data.notificationVolume !== null) {
            this.notificationSound.setVolume(res.data.notificationVolume);
          }
          adminDefaults = {
            'ride-request': res.data.defaultRideRequestSound || 'classic',
            'ride-accepted': res.data.defaultRideAcceptedSound || 'success',
            'ride-cancelled': res.data.defaultRideCancelledSound || 'alert',
            'ride-completed': res.data.defaultRideCompletedSound || 'tada',
            'message': res.data.defaultMessageSound || 'ping',
            'sos': res.data.defaultSosSound || 'siren',
          };
          this.notificationSound.setPrefs(adminDefaults);
          this.startTimer();
        } else {
          this.timerSeconds.set(180);
          this.startTimer();
        }
        this.rideService.getSoundPreferences().subscribe({
          next: (res2: any) => {
            if (res2 && res2.data) {
              const d = res2.data;
              if (d.notificationVolume !== undefined && d.notificationVolume !== null) {
                this.notificationSound.setVolume(d.notificationVolume);
              }
              const merged = { ...adminDefaults };
              if (d.rideRequestSound) merged['ride-request'] = d.rideRequestSound;
              if (d.rideAcceptedSound) merged['ride-accepted'] = d.rideAcceptedSound;
              if (d.rideCancelledSound) merged['ride-cancelled'] = d.rideCancelledSound;
              if (d.rideCompletedSound) merged['ride-completed'] = d.rideCompletedSound;
              if (d.messageSound) merged['message'] = d.messageSound;
              if (d.sosSound) merged['sos'] = d.sosSound;
              this.notificationSound.setPrefs(merged as any);
            }
          },
          error: () => {}
        });
      },
      error: () => {
        this.timerSeconds.set(180);
        this.startTimer();
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
      this.timerPercent.set((current - 1) / this.searchTimeout() * 100);
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
