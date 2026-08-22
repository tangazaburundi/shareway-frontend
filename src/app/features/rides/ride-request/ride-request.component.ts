import { Component, OnInit, OnDestroy, AfterViewInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { RideService } from '../../../core/services/ride.service';
import { MapService } from '../../../core/services/map.service';
import { DriverLocationService } from '../../../core/services/driver-location.service';
import { GeocodingService } from '../../../core/services/geocoding.service';
import { GeocodingItem } from '../../../core/services/geocoding.service';
import { RideEstimate, NearbyDriver, Ride } from '../../../core/models/ride.model';
import { Currency } from '../../../core/models/trip.model';
import { getCurrencyByCountry } from '../../../core/models/country-currency.model';
import * as L from 'leaflet';

@Component({
  selector: 'app-ride-request',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="ride-request-page">
      <div class="map-container" id="ride-map">
        <div class="map-hint" *ngIf="!destinationCoords()">
          📍 Cliquez sur la carte pour définir la destination
        </div>
      </div>

      <div class="bottom-sheet">
        <div class="active-ride-banner" *ngIf="activeRide()">
          <div class="banner-icon">🚗</div>
          <div class="banner-text">
            <span class="banner-status">Course en cours : {{ getActiveStatusLabel() }}</span>
            <span class="banner-route">{{ activeRide()!.pickupAddress || 'Départ' }} → {{ activeRide()!.destinationAddress || 'Arrivée' }}</span>
          </div>
          <button class="banner-view" (click)="goToActiveRide()">Voir</button>
          <button class="banner-cancel" (click)="cancelActiveRide()">✕</button>
        </div>

        <div class="selected-driver-banner" *ngIf="selectedDriver()">
          <div class="driver-avatar">
            @if (selectedDriver()!.avatarUrl) {
              <img [src]="selectedDriver()!.avatarUrl" alt="Photo" class="driver-avatar-img" />
            } @else {
              {{ selectedDriver()!.firstName?.charAt(0) || 'D' }}
            }
          </div>
          <div class="driver-info">
            <span class="driver-name">{{ selectedDriver()!.firstName }} {{ selectedDriver()!.lastName }}</span>
            <span class="driver-detail">{{ selectedDriver()!.vehicleBrand || '' }} {{ selectedDriver()!.vehicleModel || '' }} · {{ selectedDriver()!.distanceKm }} km</span>
            <span class="driver-rating" *ngIf="selectedDriver()!.rating">⭐ {{ selectedDriver()!.rating!.toFixed(1) }}</span>
          </div>
          <button class="btn-clear-driver" (click)="clearSelectedDriver()">✕</button>
        </div>

        <div class="sheet-header">
          <h2>Demander un trajet</h2>
        </div>

        <div class="form-section">
          <div class="input-group">
            <div class="input-icon pickup"></div>
            <input
              type="text"
              placeholder="Point de prise en charge"
              [value]="pickupAddress()"
              (input)="onPickupSearch($event)"
              (focus)="focusField.set('pickup')"
            />
            <button class="btn-locate" (click)="useCurrentLocation()">
              <span class="icon-locate"></span>
            </button>
            <span class="check-icon" *ngIf="pickupCoords()">✅</span>
          </div>

          <div class="input-group">
            <div class="input-icon destination"></div>
            <input
              type="text"
              placeholder="Où allez-vous ?"
              [value]="destinationAddress()"
              (input)="onDestinationSearch($event)"
              (keydown.enter)="geocodeDestination()"
              (focus)="focusField.set('destination')"
            />
            <span class="check-icon" *ngIf="destinationCoords()">✅</span>
            <button class="btn-clear" *ngIf="destinationCoords()" (click)="clearDestination()">✕</button>
          </div>

          <div class="suggestions" *ngIf="suggestions().length > 0">
            <div
              class="suggestion-item"
              *ngFor="let s of suggestions()"
              (click)="selectSuggestion(s)"
            >
              <span class="suggestion-icon">📍</span>
              <div class="suggestion-text">
                <div class="suggestion-name">{{ s.displayName }}</div>
                <div class="suggestion-city">{{ s.city }}</div>
              </div>
            </div>
          </div>

          <div class="hint-message" *ngIf="destinationAddress() && !destinationCoords() && suggestions().length === 0">
            Sélectionnez une suggestion ci-dessous pour valider l'adresse
          </div>
        </div>

        <div class="estimate-section" *ngIf="estimate()">
          <div class="estimate-row">
            <span class="estimate-label">Distance</span>
            <span class="estimate-value">{{ estimate()!.distanceKm }} km</span>
          </div>
          <div class="estimate-row">
            <span class="estimate-label">Durée estimée</span>
            <span class="estimate-value">{{ estimate()!.durationMin }} min</span>
          </div>
          <div class="estimate-row price" *ngIf="!estimate()!.surgeActive">
            <span class="estimate-label">Prix estimé</span>
            <span class="estimate-value">{{ formatPrice(estimate()!.estimatedPrice) }}</span>
          </div>
          <div class="estimate-row price surge" *ngIf="estimate()!.surgeActive">
            <span class="estimate-label">Prix estimé (surge {{ estimate()!.surgeMultiplier }}x)</span>
            <span class="estimate-value">{{ formatPrice(estimate()!.estimatedPrice) }}</span>
          </div>
          <div class="estimate-row">
            <span class="estimate-label">Chauffeurs à proximité</span>
            <span class="estimate-value">{{ nearbyDrivers().length }}</span>
          </div>
        </div>

        <div class="error-msg" *ngIf="errorMsg()">
          {{ errorMsg() }}
        </div>

        <button
          class="btn-request"
          [disabled]="!canRequest() || loading()"
          (click)="requestRide()"
        >
          <span *ngIf="!loading() && !selectedDriver()">Demander un chauffeur</span>
          <span *ngIf="!loading() && selectedDriver()">Demander {{ selectedDriver()!.firstName }}</span>
          <span *ngIf="loading()">Recherche en cours...</span>
        </button>
      </div>
    </div>
  `,
  styles: [`
    .ride-request-page { height: 100vh; display: flex; flex-direction: column; position: relative; }
    .map-container { position: relative; flex: 1; min-height: 50vh; z-index: 1; cursor: crosshair; }
    .map-hint {
      position: absolute; bottom: 12px; left: 50%; transform: translateX(-50%);
      background: rgba(0,0,0,0.7); color: #fff; padding: 8px 16px; border-radius: 20px;
      font-size: 0.85rem; z-index: 1000; pointer-events: none; white-space: nowrap;
      animation: pulse-hint 2s infinite;
    }
    @keyframes pulse-hint {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.6; }
    }
    .bottom-sheet { position: absolute; bottom: 0; left: 0; right: 0; background: white; border-radius: 20px 20px 0 0; box-shadow: 0 -4px 20px rgba(0,0,0,0.15); z-index: 10; padding: 20px; max-height: 55vh; overflow-y: auto; }
    .sheet-header h2 { margin: 0 0 16px; font-size: 1.3rem; color: #1a1a2e; }
    .input-group { display: flex; align-items: center; gap: 10px; margin-bottom: 12px; background: #f5f5f5; border-radius: 10px; padding: 10px 14px; }
    .input-group input { flex: 1; border: none; background: transparent; font-size: 0.95rem; outline: none; }
    .input-icon { width: 12px; height: 12px; border-radius: 50%; }
    .input-icon.pickup { background: #22c55e; }
    .input-icon.destination { background: #ef4444; }
    .btn-locate { background: none; border: none; cursor: pointer; font-size: 1.2rem; padding: 4px; }
    .check-icon { font-size: 1rem; flex-shrink: 0; }
    .btn-clear { background: #ef4444; color: #fff; border: none; border-radius: 50%; width: 22px; height: 22px; font-size: 0.75rem; cursor: pointer; flex-shrink: 0; display: flex; align-items: center; justify-content: center; }
    .hint-message { font-size: 0.8rem; color: #d97706; padding: 8px 12px; background: #fef3c7; border-radius: 8px; margin-bottom: 8px; }
    .suggestions { max-height: 200px; overflow-y: auto; border-top: 1px solid #eee; }
    .suggestion-item { display: flex; align-items: center; gap: 10px; padding: 12px; cursor: pointer; border-bottom: 1px solid #f0f0f0; }
    .suggestion-item:hover { background: #f8f8f8; }
    .suggestion-icon { font-size: 1.2rem; }
    .suggestion-name { font-weight: 500; font-size: 0.9rem; }
    .suggestion-city { font-size: 0.8rem; color: #888; }
    .estimate-section { background: #f0fdf4; border-radius: 12px; padding: 14px; margin: 12px 0; }
    .estimate-row { display: flex; justify-content: space-between; padding: 4px 0; }
    .estimate-label { color: #666; font-size: 0.9rem; }
    .estimate-value { font-weight: 600; font-size: 0.9rem; }
    .estimate-row.price { border-top: 1px solid #ddd; margin-top: 6px; padding-top: 8px; }
    .estimate-row.price .estimate-value { font-size: 1.1rem; color: #16a34a; }
    .estimate-row.surge .estimate-value { color: #ea580c; }
    .btn-request { width: 100%; padding: 14px; background: #22c55e; color: white; border: none; border-radius: 12px; font-size: 1.1rem; font-weight: 600; cursor: pointer; transition: background 0.2s; }
    .btn-request:hover:not(:disabled) { background: #16a34a; }
    .btn-request:disabled { background: #ccc; cursor: not-allowed; }
    .error-msg { background: #fef2f2; color: #dc2626; padding: 10px 14px; border-radius: 8px; font-size: 0.85rem; margin-bottom: 8px; border: 1px solid #fecaca; }
    .selected-driver-banner { display: flex; align-items: center; gap: 12px; padding: 12px; background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 12px; margin-bottom: 12px; }
    .driver-avatar { width: 40px; height: 40px; border-radius: 50%; background: #3b82f6; color: #fff; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 1.1rem; flex-shrink: 0; overflow: hidden; }
    .driver-avatar-img { width: 100%; height: 100%; object-fit: cover; border-radius: 50%; }
    .driver-info { flex: 1; display: flex; flex-direction: column; gap: 2px; min-width: 0; }
    .driver-name { font-weight: 600; font-size: 0.95rem; color: #1e3a5f; }
    .driver-detail { font-size: 0.8rem; color: #666; }
    .driver-rating { font-size: 0.8rem; color: #d97706; }
    .btn-clear-driver { background: #ef4444; color: #fff; border: none; border-radius: 50%; width: 26px; height: 26px; font-size: 0.8rem; cursor: pointer; flex-shrink: 0; display: flex; align-items: center; justify-content: center; }
    .active-ride-banner { display: flex; align-items: center; gap: 10px; padding: 12px 14px; background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; margin-bottom: 12px; }
    .banner-icon { font-size: 1.5rem; flex-shrink: 0; }
    .banner-text { flex: 1; display: flex; flex-direction: column; gap: 2px; min-width: 0; }
    .banner-status { font-weight: 600; font-size: 0.9rem; color: #166534; }
    .banner-route { font-size: 0.8rem; color: #666; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .banner-view { padding: 8px 16px; background: #22c55e; color: white; border: none; border-radius: 8px; font-size: 0.9rem; font-weight: 600; cursor: pointer; flex-shrink: 0; }
    .banner-view:hover { background: #16a34a; }
    .banner-cancel { width: 32px; height: 32px; background: #ef4444; color: white; border: none; border-radius: 50%; font-size: 1rem; cursor: pointer; flex-shrink: 0; display: flex; align-items: center; justify-content: center; }
    .banner-cancel:hover { background: #dc2626; }
  `]
})
export class RideRequestComponent implements OnInit, AfterViewInit, OnDestroy {
  private map: L.Map | null = null;
  private pickupMarker: L.Marker | null = null;
  private destMarker: L.Marker | null = null;
  private driverMarkers: L.Marker[] = [];
  private nearbyRefreshTimer: any = null;

  pickupAddress = signal('');
  destinationAddress = signal('');
  pickupCoords = signal<{ lat: number; lng: number } | null>(null);
  destinationCoords = signal<{ lat: number; lng: number } | null>(null);
  estimate = signal<RideEstimate | null>(null);
  suggestions = signal<GeocodingItem[]>([]);
  focusField = signal<'pickup' | 'destination'>('pickup');
  loading = signal(false);
  errorMsg = signal('');
  activeRide = signal<Ride | null>(null);
  selectedDriver = signal<NearbyDriver | null>(null);
  nearbyDrivers = signal<NearbyDriver[]>([]);
  currency = signal<Currency>('FBU');

  constructor(
    private rideService: RideService,
    private mapService: MapService,
    private driverLocationService: DriverLocationService,
    private geocodingService: GeocodingService,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadActiveRide();
  }

  ngAfterViewInit() {
    this.initMap();
  }

  ngOnDestroy() {
    if (this.nearbyRefreshTimer) clearInterval(this.nearbyRefreshTimer);
    this.driverMarkers.forEach(m => { if (this.map) (this.map as any).removeLayer(m); });
    this.nearbyDrivers.set([]);
    this.selectedDriver.set(null);
    if (this.map) this.mapService.destroyMap('ride-map');
  }

  private initMap() {
    const defaultLat = -3.3731;
    const defaultLng = 29.3644;

    this.map = this.mapService.createMap('ride-map', defaultLat, defaultLng, 13);
    this.pickupCoords.set({ lat: defaultLat, lng: defaultLng });
    this.pickupMarker = this.mapService.addMarker(this.map, defaultLat, defaultLng, 'pickup', 'Vous êtes ici');

    if (this.map) {
      (this.map as any).on('click', (e: any) => {
        this.onMapClick(e.latlng.lat, e.latlng.lng);
      });
    }

    this.driverLocationService.getCurrentPosition().then(pos => {
      this.pickupCoords.set({ lat: pos.lat, lng: pos.lng });
      this.geocodingService.reverse(pos.lat, pos.lng).subscribe({
        next: (res) => {
          this.pickupAddress.set(res.success && res.data ? res.data : `${pos.lat.toFixed(5)}, ${pos.lng.toFixed(5)}`);
        },
        error: () => this.pickupAddress.set(`${pos.lat.toFixed(5)}, ${pos.lng.toFixed(5)}`)
      });
      if (this.map && this.pickupMarker) {
        this.mapService.updateMarkerPosition(this.pickupMarker, pos.lat, pos.lng);
        this.map.setView([pos.lat, pos.lng], 14);
      }
      this.loadNearbyDrivers();
      this.nearbyRefreshTimer = setInterval(() => this.loadNearbyDrivers(), 15000);
    }).catch(() => {
      this.loadNearbyDrivers();
      this.nearbyRefreshTimer = setInterval(() => this.loadNearbyDrivers(), 15000);
    });
  }

  private onMapClick(lat: number, lng: number) {
    this.destinationCoords.set({ lat, lng });

    if (this.destMarker) {
      this.mapService.updateMarkerPosition(this.destMarker, lat, lng);
    } else if (this.map) {
      this.destMarker = this.mapService.addMarker(this.map, lat, lng, 'destination', 'Destination');
    }

    this.geocodingService.reverse(lat, lng).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.destinationAddress.set(res.data);
        } else {
          this.destinationAddress.set(`${lat.toFixed(5)}, ${lng.toFixed(5)}`);
        }
      },
      error: () => {
        this.destinationAddress.set(`${lat.toFixed(5)}, ${lng.toFixed(5)}`);
      }
    });

    this.suggestions.set([]);
    this.updateEstimate();
  }

  private loadNearbyDrivers() {
    const pickup = this.pickupCoords();
    if (!pickup || !this.map) return;

    this.rideService.getNearbyDrivers(pickup.lat, pickup.lng, 15).subscribe({
      next: (res) => {
        if (!res.success || !res.data) return;
        this.clearDriverMarkers();
        const drivers = res.data as NearbyDriver[];
        this.nearbyDrivers.set(drivers);
        drivers.forEach(d => {
          const dist = d.distanceKm != null ? `${d.distanceKm} km` : '';
          const rating = d.rating != null ? `⭐ ${d.rating.toFixed(1)}` : '';
          const marker = this.mapService.addMarker(this.map!, d.currentLat, d.currentLng, 'driver',
            `<div style="text-align:center"><img src="${d.avatarUrl || ''}" onerror="this.style.display='none'" style="width:48px;height:48px;border-radius:50%;object-fit:cover;margin-bottom:4px" /><br><b>${d.firstName} ${d.lastName}</b><br>${d.vehicleBrand || ''} ${d.vehicleModel || ''}<br>${rating} ${dist ? '· ' + dist : ''}</div>`
          );
          (marker as any).on('click', () => {
            this.selectDriver(d);
          });
          this.driverMarkers.push(marker);
        });
      },
      error: () => {}
    });
  }

  private clearDriverMarkers() {
    this.driverMarkers.forEach(m => { if (this.map) (this.map as any).removeLayer(m); });
    this.driverMarkers = [];
  }

  selectDriver(driver: NearbyDriver) {
    this.selectedDriver.set(driver);
  }

  clearSelectedDriver() {
    this.selectedDriver.set(null);
  }

  useCurrentLocation() {
    this.driverLocationService.getCurrentPosition().then(pos => {
      this.pickupCoords.set({ lat: pos.lat, lng: pos.lng });
      this.geocodingService.reverse(pos.lat, pos.lng).subscribe({
        next: (res) => {
          this.pickupAddress.set(res.success && res.data ? res.data : 'Position actuelle');
        },
        error: () => this.pickupAddress.set('Position actuelle')
      });
      if (this.map && this.pickupMarker) {
        this.mapService.updateMarkerPosition(this.pickupMarker, pos.lat, pos.lng);
        this.map.setView([pos.lat, pos.lng], 14);
      }
      this.updateEstimate();
    });
  }

  onPickupSearch(event: Event) {
    const query = (event.target as HTMLInputElement).value;
    this.pickupAddress.set(query);
    if (query.length >= 3) {
      this.geocodingService.autocomplete(query).subscribe(res => {
        if (res.success) this.suggestions.set(res.data.items);
      });
    } else {
      this.suggestions.set([]);
    }
  }

  onDestinationSearch(event: Event) {
    const query = (event.target as HTMLInputElement).value;
    this.destinationAddress.set(query);
    if (query.length >= 3) {
      this.geocodingService.autocomplete(query).subscribe(res => {
        if (res.success) this.suggestions.set(res.data.items);
      });
    } else {
      this.suggestions.set([]);
    }
  }

  geocodeDestination() {
    const query = this.destinationAddress();
    if (!query || query.length < 3) return;

    this.geocodingService.autocomplete(query).subscribe(res => {
      if (res.success && res.data.items && res.data.items.length > 0) {
        const first = res.data.items[0];
        this.destinationCoords.set({ lat: first.lat, lng: first.lng });
        this.destinationAddress.set(first.displayName);
        this.suggestions.set([]);
        if (this.map) {
          if (this.destMarker) this.mapService.updateMarkerPosition(this.destMarker, first.lat, first.lng);
          else this.destMarker = this.mapService.addMarker(this.map, first.lat, first.lng, 'destination', 'Destination');
        }
        this.updateEstimate();
      }
    });
  }

  selectSuggestion(s: GeocodingItem) {
    const field = this.focusField();
    if (field === 'pickup') {
      this.pickupCoords.set({ lat: s.lat, lng: s.lng });
      this.pickupAddress.set(s.displayName);
      this.currency.set(getCurrencyByCountry(s.country));
      if (this.map && this.pickupMarker) {
        this.mapService.updateMarkerPosition(this.pickupMarker, s.lat, s.lng);
      }
    } else {
      this.destinationCoords.set({ lat: s.lat, lng: s.lng });
      this.destinationAddress.set(s.displayName);
      if (this.map) {
        if (this.destMarker) this.mapService.updateMarkerPosition(this.destMarker, s.lat, s.lng);
        else this.destMarker = this.mapService.addMarker(this.map, s.lat, s.lng, 'destination', 'Destination');
      }
    }
    this.suggestions.set([]);
    this.updateEstimate();
  }

  clearDestination() {
    this.destinationCoords.set(null);
    this.destinationAddress.set('');
    if (this.destMarker && this.map) {
      (this.map as any).removeLayer(this.destMarker);
      this.destMarker = null;
    }
    this.estimate.set(null);
  }

  private updateEstimate() {
    const pickup = this.pickupCoords();
    const dest = this.destinationCoords();
    if (!pickup || !dest) return;

    this.rideService.getEstimate(pickup.lat, pickup.lng, dest.lat, dest.lng, this.currency()).subscribe(res => {
      if (res.success) {
        this.estimate.set(res.data);
        if (this.map) {
          this.mapService.fitBounds(this.map, [
            [pickup.lat, pickup.lng],
            [dest.lat, dest.lng]
          ]);
        }
      }
    });
  }

  canRequest(): boolean {
    return this.pickupCoords() !== null && this.destinationCoords() !== null && !this.loading();
  }

  formatPrice(price: number): string {
    return new Intl.NumberFormat('fr-FR').format(price) + ' ' + this.currency();
  }

  requestRide() {
    const pickup = this.pickupCoords();
    const dest = this.destinationCoords();
    if (!pickup || !dest) return;

    this.loading.set(true);
    this.errorMsg.set('');
    const driver = this.selectedDriver();
    this.rideService.createRide({
      pickupLat: pickup.lat,
      pickupLng: pickup.lng,
      pickupAddress: this.pickupAddress(),
      destinationLat: dest.lat,
      destinationLng: dest.lng,
      destinationAddress: this.destinationAddress(),
      currency: this.currency(),
      ...(driver ? { driverId: driver.userId } : {})
    }).subscribe({
      next: (res) => {
        this.loading.set(false);
        if (res.success) {
          this.router.navigate(['/ride/tracking', res.data.id]);
        } else {
          this.errorMsg.set(res.message || 'Erreur lors de la demande');
        }
      },
      error: (err) => {
        this.loading.set(false);
        this.errorMsg.set(err.error?.message || err.error?.error || 'Erreur lors de la demande de course');
      }
    });
  }

  loadActiveRide() {
    this.rideService.getActiveRide().subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.activeRide.set(res.data);
        }
      },
      error: () => {}
    });
  }

  getActiveStatusLabel(): string {
    const ride = this.activeRide();
    if (!ride) return '';
    const labels: Record<string, string> = {
      'SEARCHING': 'Recherche...',
      'DRIVER_FOUND': 'Chauffeur trouvé !',
      'ACCEPTED': 'Chauffeur confirmé',
      'DRIVER_EN_ROUTE': 'Chauffeur en route',
      'ARRIVED': 'Chauffeur arrivé',
      'IN_PROGRESS': 'Course en cours',
      'COMPLETED': 'Terminée',
      'CANCELLED': 'Annulée',
      'EXPIRED': 'Aucun autre chauffeur trouvé'
    };
    return labels[ride.status] || ride.status;
  }

  goToActiveRide() {
    const ride = this.activeRide();
    if (ride) {
      this.router.navigate(['/ride/tracking', ride.id]);
    }
  }

  cancelActiveRide() {
    const ride = this.activeRide();
    if (!ride) return;
    this.rideService.cancelRide(ride.id).subscribe({
      next: () => {
        this.activeRide.set(null);
      },
      error: (err) => {
        this.errorMsg.set(err.error?.message || 'Impossible d\'annuler la course');
      }
    });
  }
}
