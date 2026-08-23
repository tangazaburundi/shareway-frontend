import { Component, OnInit, OnDestroy, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { RideService } from '../../../core/services/ride.service';
import { WebSocketService } from '../../../core/services/websocket.service';
import { NotificationSoundService } from '../../../core/services/notification-sound.service';
import { Ride } from '../../../core/models/ride.model';

@Component({
  selector: 'app-driver-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="dashboard-container">
      <!-- Header -->
      <header class="dashboard-header">
        <div class="header-left">
          @if (userProfile()?.avatarUrl) {
            <img [src]="userProfile()!.avatarUrl" alt="Photo" class="header-avatar" />
          } @else {
            <div class="header-avatar-placeholder">{{ userProfile()?.firstName?.charAt(0) || 'D' }}</div>
          }
          <h1>Dashboard Taxi</h1>
        </div>
        <div class="header-right">
          <button class="sound-toggle" (click)="notificationSound.toggle()" [title]="notificationSound.enabled() ? 'Désactiver le son' : 'Activer le son'">
            {{ notificationSound.enabled() ? '🔊' : '🔇' }}
          </button>
          <span class="status-badge" [class.online]="isOnline()" [class.offline]="!isOnline()">
            {{ isOnline() ? 'En ligne' : 'Hors ligne' }}
          </span>
        </div>
      </header>

      <!-- Availability Toggle -->
      <section class="availability-section">
        <button
          class="availability-toggle"
          [class.online]="isOnline()"
          [class.offline]="!isOnline()"
          (click)="toggleAvailability()"
        >
          <span class="toggle-icon">{{ isOnline() ? '🟢' : '🔴' }}</span>
          <span class="toggle-text">{{ isOnline() ? 'Vous êtes en ligne' : 'Mettre en ligne' }}</span>
        </button>
      </section>

      <!-- Stats Row -->
      <section class="stats-row">
        <div class="stat-card">
          <div class="stat-value">{{ stats().coursesToday }}</div>
          <div class="stat-label">Courses aujourd'hui</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">{{ stats().earningsToday | number:'1.2-2' }} {{ stats().currency }}</div>
          <div class="stat-label">Gains aujourd'hui</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">{{ stats().coursesThisWeek }}</div>
          <div class="stat-label">Courses cette semaine</div>
        </div>
      </section>

      <!-- Earnings Section -->
      @if (earnings()) {
        <section class="earnings-section">
          <div class="section-header">
            <h2>Revenus</h2>
            <button class="link-btn" (click)="goToEarnings()">
              Voir le détail →
            </button>
            <button class="link-btn" (click)="toggleEarningsDetail()">
              {{ showEarningsDetail() ? 'Masquer' : 'Détails' }}
            </button>
          </div>
          <div class="earnings-summary">
            <div class="earnings-card today">
              <div class="earnings-icon">💰</div>
              <div class="earnings-info">
                <div class="earnings-value">{{ earnings()!.todayEarnings | number:'1.2-2' }} {{ earnings()!.currency }}</div>
                <div class="earnings-label">Aujourd'hui</div>
              </div>
            </div>
            <div class="earnings-card week">
              <div class="earnings-icon">📈</div>
              <div class="earnings-info">
                <div class="earnings-value">{{ earnings()!.weekEarnings | number:'1.2-2' }} {{ earnings()!.currency }}</div>
                <div class="earnings-label">Cette semaine</div>
              </div>
            </div>
            <div class="earnings-card month">
              <div class="earnings-icon">📊</div>
              <div class="earnings-info">
                <div class="earnings-value">{{ earnings()!.monthEarnings | number:'1.2-2' }} {{ earnings()!.currency }}</div>
                <div class="earnings-label">Ce mois</div>
              </div>
            </div>
          </div>
          @if (showEarningsDetail() && weeklyEarnings().length > 0) {
            <div class="weekly-breakdown">
              <h3>Détail hebdomadaire</h3>
              <div class="weekly-chart">
                @for (day of weeklyEarnings(); track day.date) {
                  <div class="chart-bar">
                    <div class="bar-fill" [style.height.%]="getBarHeight(day.earnings)"></div>
                    <div class="bar-label">{{ day.dayName }}</div>
                    <div class="bar-value">{{ day.earnings | number:'1.0-0' }}</div>
                  </div>
                }
              </div>
            </div>
          }
        </section>
      }

      <!-- Active Ride Section -->
      @if (activeRide()) {
        <section class="active-ride-section">
          <div class="section-header">
            <h2>Course en cours</h2>
            <span class="status-badge" [attr.data-status]="activeRide()!.status">
              {{ getStatusLabel(activeRide()!.status) }}
            </span>
          </div>
          <div class="ride-card active">
            <div class="ride-route">
              <div class="route-point pickup">
                <span class="route-icon">📍</span>
                <span class="route-text">{{ activeRide()!.pickupAddress }}</span>
              </div>
              <div class="route-arrow">→</div>
              <div class="route-point destination">
                <span class="route-icon">🏁</span>
                <span class="route-text">{{ activeRide()!.destinationAddress }}</span>
              </div>
            </div>
            <div class="ride-details">
              <div class="detail-item">
                <span class="detail-label">Passager</span>
                <span class="detail-value">{{ activeRide()!.passengerFirstName }} {{ activeRide()!.passengerLastName }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">Prix</span>
                <span class="detail-value">{{ activeRide()!.estimatedPrice | number:'1.2-2' }} {{ activeRide()!.currency }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">Distance</span>
                <span class="detail-value">{{ activeRide()!.estimatedDistanceKm }} km</span>
              </div>
            </div>
            <div class="ride-actions">
              @switch (activeRide()!.status) {
                @case ('DRIVER_FOUND') {
                  <button class="action-btn primary" (click)="acceptFromCard()">
                    Accepter
                  </button>
                  <button class="action-btn danger" (click)="rejectFromCard()">
                    Refuser
                  </button>
                }
                @case ('ACCEPTED') {
                  <button class="action-btn primary" (click)="markEnRoute()">
                    En route vers le passager
                  </button>
                  <button class="action-btn warning" (click)="showTransferConfirm.set(true)">
                    Rendre
                  </button>
                  <button class="action-btn danger" (click)="cancelRide()">
                    Annuler
                  </button>
                }
                @case ('DRIVER_EN_ROUTE') {
                  <button class="action-btn primary" (click)="markArrived()">
                    Arrivé au point de pick-up
                  </button>
                  <button class="action-btn warning" (click)="showTransferConfirm.set(true)">
                    Rendre
                  </button>
                  <button class="action-btn danger" (click)="cancelRide()">
                    Annuler
                  </button>
                }
                @case ('ARRIVED') {
                  <button class="action-btn primary" (click)="startRide()">
                    Démarrer la course
                  </button>
                  <button class="action-btn warning" (click)="showTransferConfirm.set(true)">
                    Rendre
                  </button>
                }
                @case ('IN_PROGRESS') {
                  <button class="action-btn primary" (click)="completeRide()">
                    Terminer la course
                  </button>
                }
              }
              <button class="action-btn secondary" (click)="viewOnMap(activeRide()!.id)">
                Voir sur la carte
              </button>
              @if (activeRide()!.status !== 'COMPLETED' && activeRide()!.status !== 'CANCELLED') {
                <button class="action-btn info" (click)="openChat()">
                  Contacter
                </button>
                <button class="action-btn warning" (click)="triggerSos()" [disabled]="sosLoading()">
                  {{ sosLoading() ? 'Envoi...' : 'SOS' }}
                </button>
              }
            </div>
          </div>
        </section>
      }

      <!-- Waiting Animation -->
      @if (isOnline() && !activeRide()) {
        <section class="waiting-section">
          <div class="waiting-animation">
            <div class="pulse-ring"></div>
            <div class="pulse-ring delay-1"></div>
            <div class="pulse-ring delay-2"></div>
            <span class="waiting-text">En attente d'une course...</span>
          </div>
        </section>
      }

      <!-- History Section -->
      <section class="history-section">
        <div class="section-header">
          <h2>Historique</h2>
        </div>
        <div class="tabs">
          <button
            class="tab"
            [class.active]="activeTab() === 'all'"
            (click)="setActiveTab('all')"
          >
            Récentes
          </button>
          <button
            class="tab"
            [class.active]="activeTab() === 'completed'"
            (click)="setActiveTab('completed')"
          >
            Terminées
          </button>
          <button
            class="tab"
            [class.active]="activeTab() === 'cancelled'"
            (click)="setActiveTab('cancelled')"
          >
            Annulées
          </button>
        </div>
        <div class="history-list">
          @for (ride of paginatedHistory(); track ride.id) {
            <div class="ride-card history" [attr.data-status]="ride.status">
              <div class="ride-header">
                <span class="status-badge" [attr.data-status]="ride.status">
                  {{ getStatusLabel(ride.status) }}
                </span>
                <span class="ride-time">{{ ride.createdAt | date:'dd/MM/yyyy HH:mm' }}</span>
              </div>
              <div class="ride-route">
                <div class="route-point pickup">
                  <span class="route-icon">📍</span>
                  <span class="route-text">{{ ride.pickupAddress || 'Adresse de départ inconnue' }}</span>
                </div>
                <div class="route-arrow">→</div>
                <div class="route-point destination">
                  <span class="route-icon">🏁</span>
                  <span class="route-text">{{ ride.destinationAddress || 'Destination inconnue' }}</span>
                </div>
              </div>
              <div class="ride-details">
                <div class="detail-item">
                  <span class="detail-label">Passager</span>
                  <span class="detail-value">{{ ride.passengerFirstName }} {{ ride.passengerLastName }}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">Prix</span>
                  <span class="detail-value">{{ ride.estimatedPrice | number:'1.2-2' }} {{ ride.currency }}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">Distance</span>
                  <span class="detail-value">{{ ride.estimatedDistanceKm }} km</span>
                </div>
              </div>
              <div class="ride-actions">
                <button class="action-btn secondary" (click)="viewOnMap(ride.id)">
                  Voir
                </button>
                @if (ride.status === 'SEARCHING' || ride.status === 'ACCEPTED') {
                  <button class="action-btn danger" (click)="cancelRideById(ride.id)">
                    Annuler
                  </button>
                }
                @if (ride.status === 'COMPLETED' || ride.status === 'CANCELLED' || ride.status === 'EXPIRED') {
                  <button class="action-btn danger" (click)="archiveRide(ride.id)">
                    Supprimer
                  </button>
                }
                @if (ride.status === 'COMPLETED') {
                  <button class="action-btn invoice" (click)="downloadInvoice(ride.id)">
                    Facture PDF
                  </button>
                  <button class="action-btn receipt" (click)="downloadReceipt(ride.id)">
                    Ticket
                  </button>
                }
              </div>
            </div>
          } @empty {
            <div class="empty-state">
              <p>Aucune course dans cet onglet</p>
            </div>
          }
        </div>
        @if (totalPages() > 1) {
          <div class="pagination">
            <button class="page-btn" [disabled]="currentPage() === 1" (click)="goToPage(currentPage() - 1)">
              ← Préc
            </button>
            <span class="page-info">{{ currentPage() }} / {{ totalPages() }}</span>
            <button class="page-btn" [disabled]="currentPage() === totalPages()" (click)="goToPage(currentPage() + 1)">
              Suiv →
            </button>
          </div>
        }
      </section>
    </div>

    <!-- Chat Modal -->
    @if (chatOpen()) {
      <div class="modal-overlay" (click)="closeChat()">
        <div class="chat-modal" (click)="$event.stopPropagation()">
          <div class="chat-header">
            <h3>Chat avec {{ activeRide()?.passengerFirstName || 'Passager' }}</h3>
            <button class="close-btn" (click)="closeChat()">✕</button>
          </div>
          <div class="chat-messages" #chatContainer>
            @if (chatMessages().length === 0) {
              <div class="chat-empty">Aucun message</div>
            }
            @for (msg of chatMessages(); track msg.id) {
              <div class="chat-msg" [class.mine]="msg.senderId === currentUserId()">
                <div class="msg-content">{{ msg.content }}</div>
                <div class="msg-time">{{ msg.sentAt | date:'HH:mm' }}</div>
              </div>
            }
          </div>
          <div class="chat-input-row">
            <input
              type="text"
              class="chat-input"
              placeholder="Votre message..."
              [value]="chatInput()"
              (input)="chatInput.set($any($event.target).value)"
              (keydown.enter)="sendMessage()"
            />
            <button class="send-btn" (click)="sendMessage()" [disabled]="!chatInput().trim()">
              Envoyer
            </button>
          </div>
        </div>
      </div>
    }

    <!-- SOS Confirmation Modal -->
    @if (sosConfirmOpen()) {
      <div class="modal-overlay" (click)="sosConfirmOpen.set(false)">
        <div class="sos-modal" (click)="$event.stopPropagation()">
          <div class="sos-icon">🚨</div>
          <h3>Alerte SOS</h3>
          <p>Voulez-vous vraiment déclencher une alerte d'urgence ? Les administrateurs et le passager seront notifiés.</p>
          <div class="sos-actions">
            <button class="action-btn danger" (click)="confirmSos()" [disabled]="sosLoading()">
              {{ sosLoading() ? 'Envoi...' : 'Oui, déclencher' }}
            </button>
            <button class="action-btn secondary" (click)="sosConfirmOpen.set(false)" [disabled]="sosLoading()">
              Annuler
            </button>
          </div>
        </div>
      </div>
    }

    <!-- SOS Result Modal -->
    @if (sosResult()) {
      <div class="modal-overlay" (click)="sosResult.set(null)">
        <div class="sos-modal" (click)="$event.stopPropagation()">
          @if (sosResult() === 'success') {
            <div class="sos-result-icon success">✅</div>
            <h3 class="sos-success-title">Alerte envoyée</h3>
            <p>L'administrateur a été notifié. Restez en sécurité.</p>
          } @else {
            <div class="sos-result-icon error">❌</div>
            <h3 class="sos-error-title">Erreur</h3>
            <p>Impossible d'envoyer l'alerte SOS. Vérifiez votre connexion et réessayez.</p>
          }
          <button class="action-btn primary" (click)="sosResult.set(null)">Fermer</button>
        </div>
      </div>
    }

    <!-- Incoming Ride Request Modal -->
    @if (incomingRequest()) {
      <div class="modal-overlay incoming-overlay">
        <div class="incoming-request-modal" (click)="$event.stopPropagation()">
          <div class="incoming-header">
            <div class="incoming-pulse"></div>
            <h3>Nouvelle demande de course</h3>
            <span class="incoming-timer">{{ requestTimer() }}s</span>
          </div>
          <div class="incoming-body">
            <div class="incoming-route">
              <div class="route-point pickup">
                <span class="route-icon">📍</span>
                <span class="route-text">{{ incomingRequest().pickupAddress }}</span>
              </div>
              <div class="route-arrow">→</div>
              <div class="route-point destination">
                <span class="route-icon">🏁</span>
                <span class="route-text">{{ incomingRequest().destinationAddress }}</span>
              </div>
            </div>
            <div class="incoming-details">
              <div class="detail-item">
                <span class="detail-label">Passager</span>
                <span class="detail-value">{{ incomingRequest().passengerName }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">Prix</span>
                <span class="detail-value highlight">{{ incomingRequest().estimatedPrice | number:'1.2-2' }} {{ incomingRequest().currency }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">Distance</span>
                <span class="detail-value">{{ incomingRequest().distance }} km</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">Durée</span>
                <span class="detail-value">{{ incomingRequest().duration }} min</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">Passagers</span>
                <span class="detail-value">{{ incomingRequest().passengerCount }}</span>
              </div>
            </div>
          </div>
          <div class="incoming-actions">
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
                  <button class="action-btn cancel-reject-btn" (click)="cancelReject()" [disabled]="requestLoading()">
                    Annuler
                  </button>
                  <button class="action-btn confirm-reject-btn" (click)="confirmReject()" [disabled]="requestLoading()">
                    {{ requestLoading() ? 'Envoi...' : 'Confirmer le refus' }}
                  </button>
                </div>
              </div>
            } @else {
              <button class="action-btn reject-btn" (click)="showRejectConfirm.set(true)" [disabled]="requestLoading()">
                Refuser
              </button>
              <button class="action-btn accept-btn" (click)="acceptIncoming()" [disabled]="requestLoading()">
                {{ requestLoading() ? 'Envoi...' : 'Accepter' }}
              </button>
            }
          </div>
        </div>
      </div>
    }

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
  `,
  styleUrls: ['./driver-dashboard.component.css']
})
export class DriverDashboardComponent implements OnInit, OnDestroy {
  private rideService: RideService;
  private websocketService: WebSocketService;
  private router: Router;
  private refreshInterval: ReturnType<typeof setInterval> | null = null;

  isOnline = signal<boolean>(false);
  activeRide = signal<Ride | null>(null);
  history = signal<Ride[]>([]);
  archivedIds = signal<Set<string>>(new Set(JSON.parse(localStorage.getItem('archivedRides') || '[]')));
  activeTab = signal<'all' | 'completed' | 'cancelled'>('all');
  stats = signal({
    coursesToday: 0,
    earningsToday: 0,
    coursesThisWeek: 0,
    currency: 'EUR'
  });

  earnings = signal<any>(null);
  showEarningsDetail = signal<boolean>(false);
  weeklyEarnings = signal<any[]>([]);

  currentPage = signal<number>(1);
  pageSize = 5;

  chatOpen = signal<boolean>(false);
  chatMessages = signal<any[]>([]);
  chatInput = signal<string>('');
  currentUserId = signal<string>('');

  sosConfirmOpen = signal<boolean>(false);
  sosLoading = signal<boolean>(false);
  sosResult = signal<'success' | 'error' | null>(null);

  userProfile = signal<any>(null);

  incomingRequest = signal<any>(null);
  requestLoading = signal<boolean>(false);
  requestTimer = signal<number>(180);
  searchTimeoutSeconds = signal<number>(180);
  showRejectConfirm = signal<boolean>(false);
  showTransferConfirm = signal<boolean>(false);
  rejectReason = signal<string>('');
  private requestTimerInterval: ReturnType<typeof setInterval> | null = null;

  filteredHistory = computed(() => {
    const rides = this.history();
    const tab = this.activeTab();
    const archived = this.archivedIds();

    return rides.filter(r => {
      if (archived.has(r.id)) return false;
      switch (tab) {
        case 'completed': return r.status === 'COMPLETED';
        case 'cancelled': return r.status === 'CANCELLED' || r.status === 'EXPIRED';
        default: return true;
      }
    });
  });

  totalPages = computed(() => Math.max(1, Math.ceil(this.filteredHistory().length / this.pageSize)));

  paginatedHistory = computed(() => {
    const page = this.currentPage();
    const size = this.pageSize;
    const all = this.filteredHistory();
    return all.slice((page - 1) * size, page * size);
  });

  constructor(
    rideService: RideService,
    websocketService: WebSocketService,
    router: Router,
    public notificationSound: NotificationSoundService
  ) {
    this.rideService = rideService;
    this.websocketService = websocketService;
    this.router = router;
  }

  ngOnInit(): void {
    this.loadAvailability();
    this.loadActiveRide();
    this.loadHistory();
    this.loadStats();
    this.loadEarnings();
    this.loadCurrentUserId();
    this.loadSearchTimeout();

    const token = localStorage.getItem('shareway_token') || '';
    this.websocketService.connect(token);
    this.websocketService.subscribe('/user/queue/ride-update').subscribe((msg: any) => {
      if (msg && (msg.status === 'CANCELLED' || msg.status === 'EXPIRED')) {
        this.notificationSound.play('ride-cancelled');
        if (this.incomingRequest() && this.incomingRequest().rideId === msg.rideId) {
          this.dismissIncoming();
        }
      }
      this.loadActiveRide();
      this.loadHistory();
      this.loadStats();
      this.loadEarnings();
    });
    this.websocketService.subscribe('/user/queue/ride-chat').subscribe(() => {
      this.notificationSound.play('message');
      if (this.chatOpen() && this.activeRide()) {
        this.loadChatMessages(this.activeRide()!.id);
      }
    });
    this.websocketService.subscribe('/user/queue/ride-request').subscribe((msg: any) => {
      if (this.activeRide()) {
        return;
      }
      this.notificationSound.play('ride-request');
      this.incomingRequest.set(msg);
      this.requestTimer.set(this.searchTimeoutSeconds());
      this.requestLoading.set(false);
      if (this.requestTimerInterval) clearInterval(this.requestTimerInterval);
      this.requestTimerInterval = setInterval(() => {
        const t = this.requestTimer();
        if (t <= 1) {
          if (this.requestTimerInterval) {
            clearInterval(this.requestTimerInterval);
            this.requestTimerInterval = null;
          }
          this.autoRejectOnTimeout();
        } else {
          this.requestTimer.set(t - 1);
        }
      }, 1000);
      if (msg && msg.rideId) {
        this.websocketService.subscribe('/topic/ride/' + msg.rideId + '/status').subscribe((statusMsg: any) => {
          if (statusMsg && statusMsg.status !== 'DRIVER_FOUND' && this.incomingRequest()) {
            this.dismissIncoming();
          }
        });
      }
    });

    this.refreshInterval = setInterval(() => {
      this.loadActiveRide();
      this.loadHistory();
    }, 10000);
  }

  ngOnDestroy(): void {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
    if (this.requestTimerInterval) {
      clearInterval(this.requestTimerInterval);
    }
    this.websocketService.disconnect();
  }

  loadAvailability(): void {
    this.rideService.getAvailability().subscribe({
      next: (res: any) => {
        if (res && res.data) {
          this.isOnline.set(res.data.available);
        }
      },
      error: (err: any) => {
        console.error('Failed to load availability:', err);
      }
    });
  }

  loadSearchTimeout(): void {
    let adminDefaults: Record<string, string> = {};

    this.rideService.getSearchTimeoutConfig().subscribe({
      next: (res: any) => {
        if (res && res.data) {
          this.searchTimeoutSeconds.set(res.data.timeoutSeconds || 180);
          this.requestTimer.set(this.searchTimeoutSeconds());
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
      error: () => {}
    });
  }


  loadActiveRide(): void {
    this.rideService.getDriverActiveRide().subscribe({
      next: (res: any) => {
        if (res.success && res.data) {
          this.activeRide.set(res.data);
        } else {
          this.activeRide.set(null);
        }
      },
      error: (err: any) => {
        console.error('Failed to load active ride:', err);
      }
    });
  }

  loadHistory(): void {
    this.rideService.getDriverHistory().subscribe({
      next: (res: any) => {
        if (res.success && Array.isArray(res.data)) {
          this.history.set(res.data);
        } else {
          this.history.set([]);
        }
      },
      error: (err: any) => {
        console.error('Failed to load history:', err);
      }
    });
  }

  loadStats(): void {
    this.rideService.getDriverEarnings().subscribe({
      next: (res: any) => {
        const data = res?.data || res;
        if (data) {
          this.stats.set({
            coursesToday: data.todayTrips || 0,
            earningsToday: data.todayEarnings || 0,
            coursesThisWeek: data.weekTrips || 0,
            currency: data.currency || 'EUR'
          });
        }
      },
      error: (err: any) => {
        console.error('Failed to load stats:', err);
      }
    });
  }

  toggleAvailability(): void {
    const newStatus = !this.isOnline();
    this.rideService.toggleAvailability().subscribe({
      next: () => {
        this.isOnline.set(newStatus);
      },
      error: (err: any) => {
        console.error('Failed to toggle availability:', err);
      }
    });
  }

  markEnRoute(): void {
    if (!this.activeRide()) return;
    this.rideService.driverEnRoute(this.activeRide()!.id).subscribe({
      next: (res) => {
        if (res.success && res.data) this.activeRide.set(res.data);
      },
      error: (err: any) => {
        console.error('Failed to mark en route:', err);
      }
    });
  }

  markArrived(): void {
    if (!this.activeRide()) return;
    this.rideService.driverArrived(this.activeRide()!.id).subscribe({
      next: (res) => {
        if (res.success && res.data) this.activeRide.set(res.data);
      },
      error: (err: any) => {
        console.error('Failed to mark arrived:', err);
      }
    });
  }

  startRide(): void {
    if (!this.activeRide()) return;
    this.rideService.startRide(this.activeRide()!.id).subscribe({
      next: (res) => {
        if (res.success && res.data) this.activeRide.set(res.data);
      },
      error: (err: any) => {
        console.error('Failed to start ride:', err);
      }
    });
  }

  completeRide(): void {
    if (!this.activeRide()) return;
    this.rideService.completeRide(this.activeRide()!.id).subscribe({
      next: () => {
        this.activeRide.set(null);
        this.loadHistory();
        this.loadStats();
        this.loadEarnings();
      },
      error: (err) => {
        console.error('Failed to complete ride:', err);
      }
    });
  }

  cancelRide(): void {
    if (!this.activeRide()) return;
    this.notificationSound.play('ride-cancelled');
    this.rideService.driverCancelRide(this.activeRide()!.id).subscribe({
      next: () => {
        this.activeRide.set(null);
        this.loadHistory();
      },
      error: (err) => {
        console.error('Failed to cancel ride:', err);
      }
    });
  }

  transferRide(): void {
    this.showTransferConfirm.set(true);
  }

  confirmTransfer(): void {
    this.showTransferConfirm.set(false);
    if (!this.activeRide()) return;
    this.rideService.transferRide(this.activeRide()!.id).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.activeRide.set(res.data);
        } else {
          this.activeRide.set(null);
        }
        this.loadStats();
      },
      error: (err) => {
        console.error('Failed to transfer ride:', err);
        this.activeRide.set(null);
        this.loadStats();
      }
    });
  }

  cancelRideById(rideId: string): void {
    this.notificationSound.play('ride-cancelled');
    this.rideService.driverCancelRide(rideId).subscribe({
      next: () => {
        this.loadHistory();
      },
      error: (err) => {
        console.error('Failed to cancel ride:', err);
      }
    });
  }

  archiveRide(rideId: string): void {
    const updated = new Set(this.archivedIds());
    updated.add(rideId);
    this.archivedIds.set(updated);
    localStorage.setItem('archivedRides', JSON.stringify([...updated]));
  }

  downloadInvoice(rideId: string): void {
    this.rideService.downloadInvoice(rideId).subscribe({
      next: (blob: Blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'facture-SW-' + rideId.substring(0, 8).toUpperCase() + '.pdf';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      },
      error: (err: any) => {
        console.error('Failed to download invoice:', err);
        alert('Erreur lors du téléchargement de la facture');
      }
    });
  }

  downloadReceipt(rideId: string): void {
    this.rideService.downloadReceipt(rideId).subscribe({
      next: (blob: Blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'ticket-SW-' + rideId.substring(0, 8).toUpperCase() + '.pdf';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      },
      error: (err: any) => {
        console.error('Failed to download receipt:', err);
        alert('Erreur lors du téléchargement du ticket');
      }
    });
  }

  // ── Earnings ────────────────────────────────────────────────

  loadEarnings(): void {
    this.rideService.getDriverEarnings().subscribe({
      next: (res) => {
        const data = res?.data || res;
        this.earnings.set(data);
      },
      error: (err) => console.error('Failed to load earnings:', err)
    });
    this.rideService.getDriverEarningsWeekly().subscribe({
      next: (res) => {
        const data = res?.data || res;
        this.weeklyEarnings.set(Array.isArray(data) ? data : []);
      },
      error: () => {}
    });
  }

  toggleEarningsDetail(): void {
    this.showEarningsDetail.set(!this.showEarningsDetail());
  }

  getBarHeight(earnings: number): number {
    const max = Math.max(...this.weeklyEarnings().map(d => d.earnings), 1);
    return Math.max((earnings / max) * 100, 5);
  }

  // ── Chat ────────────────────────────────────────────────────

  openChat(): void {
    if (!this.activeRide()) return;
    this.chatOpen.set(true);
    this.chatInput.set('');
    this.loadChatMessages(this.activeRide()!.id);
  }

  closeChat(): void {
    this.chatOpen.set(false);
    this.chatMessages.set([]);
  }

  loadChatMessages(rideId: string): void {
    this.rideService.getRideMessages(rideId).subscribe({
      next: (res) => {
        const data = res?.data || res;
        this.chatMessages.set(Array.isArray(data) ? data : []);
      },
      error: (err) => console.error('Failed to load messages:', err)
    });
  }

  sendMessage(): void {
    const content = this.chatInput().trim();
    if (!content || !this.activeRide()) return;
    this.rideService.sendRideMessage(this.activeRide()!.id, content).subscribe({
      next: () => {
        this.chatInput.set('');
        this.loadChatMessages(this.activeRide()!.id);
      },
      error: (err) => console.error('Failed to send message:', err)
    });
  }

  // ── SOS ─────────────────────────────────────────────────────

  triggerSos(): void {
    this.sosConfirmOpen.set(true);
  }

  confirmSos(): void {
    if (!this.activeRide()) return;
    this.sosLoading.set(true);
    this.rideService.sosAlert(this.activeRide()!.id).subscribe({
      next: () => {
        this.sosLoading.set(false);
        this.sosConfirmOpen.set(false);
        this.sosResult.set('success');
      },
      error: (err) => {
        console.error('Failed to send SOS:', err);
        this.sosLoading.set(false);
        this.sosConfirmOpen.set(false);
        this.sosResult.set('error');
      }
    });
  }

  // ── Incoming Ride Request ────────────────────────────────────

  acceptFromCard(): void {
    const ride = this.activeRide();
    if (!ride) return;
    this.rideService.acceptRide(ride.id).subscribe({
      next: (res) => {
        if (res.success && res.data) this.activeRide.set(res.data);
        else this.loadActiveRide();
        this.dismissIncoming();
        this.loadHistory();
        this.loadStats();
        this.loadEarnings();
      },
      error: (err) => console.error('Failed to accept ride:', err)
    });
  }

  rejectFromCard(): void {
    const ride = this.activeRide();
    if (!ride) return;
    this.rideService.rejectRide(ride.id, 'Refusé depuis le tableau de bord').subscribe({
      next: () => {
        this.activeRide.set(null);
        this.dismissIncoming();
        this.loadHistory();
        this.loadStats();
      },
      error: (err) => console.error('Failed to reject ride:', err)
    });
  }

  acceptIncoming(): void {
    const req = this.incomingRequest();
    if (!req || !req.rideId) return;
    this.requestLoading.set(true);
    this.rideService.acceptRide(req.rideId).subscribe({
      next: (res) => {
        this.dismissIncoming();
        if (res.success && res.data) {
          this.activeRide.set(res.data);
        } else {
          this.loadActiveRide();
        }
        this.loadHistory();
        this.loadStats();
        this.loadEarnings();
      },
      error: (err) => {
        console.error('Failed to accept ride:', err);
        this.dismissIncoming();
      }
    });
  }

  rejectIncoming(): void {
    this.showRejectConfirm.set(true);
  }

  autoRejectOnTimeout(): void {
    const req = this.incomingRequest();
    if (!req || !req.rideId) {
      this.dismissIncoming();
      return;
    }
    this.requestLoading.set(true);
    this.rideService.timeoutRide(req.rideId).subscribe({
      next: () => {
        this.dismissIncoming();
        this.loadHistory();
        this.loadStats();
      },
      error: () => {
        this.dismissIncoming();
      }
    });
  }

  cancelReject(): void {
    this.showRejectConfirm.set(false);
    this.rejectReason.set('');
  }

  confirmReject(): void {
    const req = this.incomingRequest();
    if (!req || !req.rideId) {
      this.dismissIncoming();
      return;
    }
    this.requestLoading.set(true);
    this.rideService.rejectRide(req.rideId, this.rejectReason()).subscribe({
      next: () => {
        this.dismissIncoming();
      },
      error: (err) => {
        console.error('Failed to reject ride:', err);
        this.dismissIncoming();
      }
    });
  }

  dismissIncoming(): void {
    if (this.requestTimerInterval) {
      clearInterval(this.requestTimerInterval);
      this.requestTimerInterval = null;
    }
    this.incomingRequest.set(null);
    this.requestTimer.set(this.searchTimeoutSeconds());
    this.requestLoading.set(false);
    this.showRejectConfirm.set(false);
    this.rejectReason.set('');
  }

  // ── Helpers ─────────────────────────────────────────────────

  loadCurrentUserId(): void {
    try {
      const userStr = localStorage.getItem('user') || localStorage.getItem('shareway_user');
      if (userStr) {
        const user = JSON.parse(userStr);
        this.currentUserId.set(user.id || user.userId || '');
        this.userProfile.set(user);
      }
    } catch {}
  }

  viewOnMap(rideId: string): void {
    this.router.navigate(['/ride/tracking', rideId]);
  }

  goToEarnings(): void {
    this.router.navigate(['/driver/earnings']);
  }

  setActiveTab(tab: 'all' | 'completed' | 'cancelled'): void {
    this.activeTab.set(tab);
    this.currentPage.set(1);
  }

  goToPage(page: number): void {
    this.currentPage.set(page);
  }

  deleteRide(rideId: string): void {
    this.rideService.deleteRide(rideId).subscribe({
      next: () => {
        this.history.update(rides => rides.filter(r => r.id !== rideId));
      },
      error: (err) => console.error('Failed to delete ride:', err)
    });
  }

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      'SEARCHING': 'Recherche',
      'DRIVER_FOUND': 'Trouvé',
      'ACCEPTED': 'Acceptée',
      'DRIVER_EN_ROUTE': 'En route',
      'ARRIVED': 'Arrivé',
      'IN_PROGRESS': 'En cours',
      'COMPLETED': 'Terminée',
      'CANCELLED': 'Annulée',
      'EXPIRED': 'Expirée',
      'TRANSFERRED': 'Rendue'
    };
    return labels[status] || status;
  }
}