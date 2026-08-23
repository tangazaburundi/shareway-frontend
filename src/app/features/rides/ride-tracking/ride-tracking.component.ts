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

        <button
          class="btn-chat"
          *ngIf="ride()?.status !== 'COMPLETED' && ride()?.status !== 'CANCELLED' && ride()?.status !== 'EXPIRED' && ride()?.driverFirstName"
          (click)="openChat()"
        >
          💬 Chat
        </button>

        <button
          class="btn-sos"
          *ngIf="ride()?.status !== 'COMPLETED' && ride()?.status !== 'CANCELLED' && ride()?.status !== 'EXPIRED' && ride()?.driverFirstName && !sosSent()"
          (click)="triggerSOS()"
        >
          🚨 SOS
        </button>

        <div class="sos-sent" *ngIf="sosSent()">
          🚨 Alerte SOS envoyée — L'administration a été notifiée
        </div>
      </div>

      <!-- Chat Modal -->
      <div class="modal-overlay" *ngIf="chatOpen()" (click)="closeChat()">
        <div class="chat-modal" (click)="$event.stopPropagation()">
          <div class="chat-header">
            <h3>Chat avec {{ ride()?.driverFirstName || 'Chauffeur' }}</h3>
            <button class="close-btn" (click)="closeChat()">✕</button>
          </div>
          <div class="chat-messages">
            <div *ngIf="chatMessages().length === 0" class="chat-empty">Aucun message</div>
            <div *ngFor="let msg of chatMessages(); trackBy: trackMsgById"
                 class="chat-msg" [class.mine]="msg.senderId === currentUserId()">
              <div class="msg-content">{{ msg.content }}</div>
              <div class="msg-time">{{ msg.sentAt | date:'HH:mm' }}</div>
            </div>
          </div>
          <div class="chat-input-row">
            <input type="text" class="chat-input" placeholder="Votre message..."
                   [value]="chatInput()"
                   (input)="chatInput.set($any($event.target).value)"
                   (keydown.enter)="sendMessage()" />
            <button class="send-btn" (click)="sendMessage()" [disabled]="!chatInput().trim()">
              Envoyer
            </button>
          </div>
        </div>
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
  styleUrls: ['./ride-tracking.component.css']
})
export class RideTrackingComponent implements OnInit, OnDestroy {
  ride = signal<Ride | null>(null);
  etaMinutes = signal(0);
  selectedRating = signal(0);
  ratingComment = signal('');
  rated = signal(false);
  showRating = false;
  chatOpen = signal(false);
  chatMessages = signal<any[]>([]);
  chatInput = signal('');
  currentUserId = signal('');
  sosSent = signal(false);
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
    const user = this.auth.currentUser();
    if (user) this.currentUserId.set(user.id);
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
        } else if (msg.status === 'COMPLETED') {
          this.notificationSound.play('ride-completed');
          clearInterval(this.refreshInterval);
          this.ride.set({ ...this.ride()!, status: msg.status });
          setTimeout(() => this.router.navigate(['/ride/' + rideId + '/rate']), 2000);
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
    this.wsService.subscribe('/topic/ride/' + rideId + '/chat').subscribe((msg: any) => {
      if (msg) {
        this.chatMessages.update(msgs => [...msgs, msg]);
        this.notificationSound.play('message');
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

  openChat(): void {
    if (!this.ride()) return;
    this.chatOpen.set(true);
    this.chatInput.set('');
    this.loadChatMessages(this.ride()!.id);
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
      error: (err: any) => console.error('Failed to load messages:', err)
    });
  }

  sendMessage(): void {
    const content = this.chatInput().trim();
    if (!content || !this.ride()) return;
    this.rideService.sendRideMessage(this.ride()!.id, content).subscribe({
      next: () => {
        this.chatInput.set('');
        this.loadChatMessages(this.ride()!.id);
      },
      error: (err: any) => console.error('Failed to send message:', err)
    });
  }

  trackMsgById(_index: number, msg: any): string {
    return msg.id || _index;
  }

  triggerSOS(): void {
    if (!this.ride() || this.sosSent()) return;
    if (!confirm('Êtes-vous sûr de vouloir déclencher une alerte SOS ?\nL\'administration et le chauffeur seront notifiés avec votre position GPS.')) {
      return;
    }
    this.notificationSound.play('sos');
    this.rideService.sosAlert(this.ride()!.id).subscribe({
      next: () => {
        this.sosSent.set(true);
      },
      error: (err: any) => {
        console.error('SOS alert failed:', err);
        alert('Erreur lors de l\'envoi de l\'alerte SOS. Veuillez réessayer.');
      }
    });
  }
}
