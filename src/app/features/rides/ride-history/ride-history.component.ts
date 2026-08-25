import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { RideService } from '../../../core/services/ride.service';
import { Ride } from '../../../core/models/ride.model';

@Component({
  selector: 'app-ride-history',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="history-page">
      <div class="page-header">
        <h1>Historique des courses</h1>

        <!-- Role Filters -->
        <div class="filter-tabs">
          <button class="tab" [class.active]="activeRoleFilter() === 'all'" (click)="setRoleFilter('all')">
            Toutes
          </button>
          <button class="tab" [class.active]="activeRoleFilter() === 'passenger'" (click)="setRoleFilter('passenger')">
            Passager
          </button>
          <button class="tab" [class.active]="activeRoleFilter() === 'driver'" (click)="setRoleFilter('driver')">
            Chauffeur
          </button>
        </div>

        <!-- Status Filters -->
        <div class="status-filters">
          <button class="status-tab" [class.active]="activeStatusFilter() === 'ALL'" (click)="setStatusFilter('ALL')">
            Tous
          </button>
          <button class="status-tab" [class.active]="activeStatusFilter() === 'COMPLETED'" (click)="setStatusFilter('COMPLETED')">
            Terminées
          </button>
          <button class="status-tab" [class.active]="activeStatusFilter() === 'CANCELLED'" (click)="setStatusFilter('CANCELLED')">
            Annulées
          </button>
          <button class="status-tab" [class.active]="activeStatusFilter() === 'RENDERED'" (click)="setStatusFilter('RENDERED')">
            Rendues
          </button>
          <button class="status-tab" [class.active]="activeStatusFilter() === 'EXPIRED'" (click)="setStatusFilter('EXPIRED')">
            Expirées
          </button>
          <button class="status-tab" [class.active]="activeStatusFilter() === 'ARCHIVED'" (click)="setStatusFilter('ARCHIVED')">
            Archivées
          </button>
        </div>

        <div class="payment-filters">
          <button class="status-tab" [class.active]="activePaymentFilter() === 'ALL'" (click)="setPaymentFilter('ALL')">
            Tous paiements
          </button>
          <button class="status-tab" [class.active]="activePaymentFilter() === 'PAID'" (click)="setPaymentFilter('PAID')">
            ✅ Payées
          </button>
          <button class="status-tab" [class.active]="activePaymentFilter() === 'UNPAID'" (click)="setPaymentFilter('UNPAID')">
            ⏳ Non payées
          </button>
          <button class="status-tab" [class.active]="activePaymentFilter() === 'REFUSED'" (click)="setPaymentFilter('REFUSED')">
            ❌ Refusées
          </button>
        </div>
      </div>

      <!-- Stats Summary -->
      <div class="stats-summary">
        <div class="stat-card">
          <span class="stat-number">{{ filteredRides().length }}</span>
          <span class="stat-label">Courses</span>
        </div>
        <div class="stat-card">
          <span class="stat-number">{{ completedCount() }}</span>
          <span class="stat-label">Terminées</span>
        </div>
        <div class="stat-card">
          <span class="stat-number">{{ totalEarnings() }}</span>
          <span class="stat-label">Gagnés</span>
        </div>
      </div>

      <!-- Rides List -->
      <div class="rides-list">
        @for (ride of paginatedRides(); track ride.id) {
          <div class="ride-card" (click)="viewRide(ride)">
            <div class="ride-header">
              <div class="ride-date">{{ formatDate(ride.createdAt) }}</div>
              <div class="ride-status" [class]="'status-' + ride.status.toLowerCase()">
                {{ getStatusLabel(ride.status) }}
              </div>
              <div class="ride-payment" *ngIf="ride.status === 'COMPLETED'" [class]="'payment-' + (ride.paymentStatus || 'PENDING').toLowerCase()">
                {{ getPaymentLabel(ride.paymentStatus) }}
              </div>
            </div>

            <div class="ride-route">
              <div class="route-point">
                <span class="route-dot pickup"></span>
                <span class="route-text">{{ ride.pickupAddress || 'Départ' }}</span>
              </div>
              <div class="route-line"></div>
              <div class="route-point">
                <span class="route-dot dest"></span>
                <span class="route-text">{{ ride.destinationAddress || 'Arrivée' }}</span>
              </div>
            </div>

            <div class="ride-footer">
              <div class="ride-person">
                @if (ride.driverFirstName) {
                  <span class="person-label">Chauffeur:</span>
                  <span>{{ ride.driverFirstName }} {{ ride.driverLastName }}</span>
                } @else {
                  <span class="person-label">Passager:</span>
                  <span>{{ ride.passengerFirstName }} {{ ride.passengerLastName }}</span>
                }
              </div>
              <div class="ride-price" *ngIf="ride.finalPrice || ride.estimatedPrice">
                {{ formatPrice(ride.finalPrice || ride.estimatedPrice || 0) }} {{ ride.currency }}
              </div>
            </div>

            <div class="ride-meta" *ngIf="ride.estimatedDistanceKm || ride.estimatedDurationMin">
              <span *ngIf="ride.estimatedDistanceKm">{{ ride.estimatedDistanceKm }} km</span>
              <span *ngIf="ride.estimatedDurationMin">{{ ride.estimatedDurationMin }} min</span>
            </div>

            @if (ride.status === 'COMPLETED' || ride.status === 'CANCELLED' || ride.status === 'EXPIRED' || ride.status === 'RENDERED' || ride.status === 'ARCHIVED') {
              <div class="ride-actions">
                @if (ride.status !== 'ARCHIVED') {
                  <button class="btn-archive" (click)="archiveRide(ride.id, $event)">
                    📦 Archiver
                  </button>
                } @else {
                  <span class="archived-label">Archivée</span>
                }
              </div>
            }
          </div>
        } @empty {
          <div class="empty-state">
            <span class="empty-icon">🚗</span>
            <h3>Aucune course</h3>
            <p>Aucune course ne correspond à vos filtres.</p>
          </div>
        }
      </div>

      <!-- Pagination -->
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
    </div>
  `,
  styleUrls: ['./ride-history.component.css']
})
export class RideHistoryComponent implements OnInit {
  allRides = signal<Ride[]>([]);
  filteredRides = signal<Ride[]>([]);
  activeRoleFilter = signal<'all' | 'passenger' | 'driver'>('all');
  activeStatusFilter = signal<string>('ALL');
  activePaymentFilter = signal<string>('ALL');
  completedCount = signal(0);
  totalEarnings = signal('0');

  currentPage = signal<number>(1);
  pageSize = 10;

  totalPages = computed(() => Math.max(1, Math.ceil(this.filteredRides().length / this.pageSize)));

  paginatedRides = computed(() => {
    const page = this.currentPage();
    const size = this.pageSize;
    const all = this.filteredRides();
    return all.slice((page - 1) * size, page * size);
  });

  constructor(
    private rideService: RideService,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadRides();
  }

  private loadRides() {
    this.rideService.getMyHistory().subscribe(res => {
      if (res.success && res.data) {
        const passengerRides = res.data.map(r => ({ ...r, _role: 'passenger' as const }));
        this.allRides.set(passengerRides);
        this.applyFilter();

        this.rideService.getDriverHistory().subscribe(driverRes => {
          if (driverRes.success && driverRes.data) {
            const driverRides = driverRes.data.map(r => ({ ...r, _role: 'driver' as const }));
            const merged = [...this.allRides(), ...driverRides];
            this.allRides.set(merged);
            this.applyFilter();
          }
        });
      }
    });
  }

  setRoleFilter(filter: 'all' | 'passenger' | 'driver') {
    this.activeRoleFilter.set(filter);
    this.currentPage.set(1);
    this.applyFilter();
  }

  setStatusFilter(status: string) {
    this.activeStatusFilter.set(status);
    this.currentPage.set(1);
    this.applyFilter();
  }

  setPaymentFilter(filter: string) {
    this.activePaymentFilter.set(filter);
    this.currentPage.set(1);
    this.applyFilter();
  }

  getPaymentLabel(status?: string): string {
    switch (status) {
      case 'CAPTURED': return '✅ Payé';
      case 'REFUSED': return '❌ Refusé';
      case 'PENDING': return '⏳ En attente';
      case 'AUTHORIZED': return '⏳ Autorisé';
      case 'REFUNDED': return '↩️ Remboursé';
      case 'FAILED': return '⚠️ Échoué';
      default: return '⏳ En attente';
    }
  }

  private applyFilter() {
    const rides = this.allRides();
    const roleFilter = this.activeRoleFilter();
    const statusFilter = this.activeStatusFilter();
    const paymentFilter = this.activePaymentFilter();
    let filtered = [...rides];

    if (roleFilter === 'passenger') {
      filtered = filtered.filter(r => !(r as any)._role || (r as any)._role === 'passenger');
    } else if (roleFilter === 'driver') {
      filtered = filtered.filter(r => (r as any)._role === 'driver');
    }

    if (statusFilter !== 'ALL') {
      filtered = filtered.filter(r => r.status === statusFilter);
    }

    if (paymentFilter !== 'ALL') {
      filtered = filtered.filter(r => {
        if (paymentFilter === 'PAID') return r.paymentStatus === 'CAPTURED';
        if (paymentFilter === 'UNPAID') return r.status === 'COMPLETED' && (!r.paymentStatus || r.paymentStatus === 'PENDING' || r.paymentStatus === 'AUTHORIZED');
        if (paymentFilter === 'REFUSED') return r.paymentStatus === 'REFUSED';
        return true;
      });
    }

    this.filteredRides.set(filtered);
    this.completedCount.set(rides.filter(r => r.status === 'COMPLETED').length);

    const earnings = rides
      .filter(r => r.status === 'COMPLETED' && r.driverEarnings)
      .reduce((sum, r) => sum + (r.driverEarnings || 0), 0);
    this.totalEarnings.set(new Intl.NumberFormat('fr-FR').format(earnings));
  }

  archiveRide(rideId: string, event: Event) {
    event.stopPropagation();
    this.rideService.archiveRide(rideId).subscribe({
      next: () => {
        this.allRides.update(rides =>
          rides.map(r => r.id === rideId ? { ...r, status: 'ARCHIVED' as any } : r)
        );
        this.applyFilter();
      },
      error: () => {}
    });
  }

  goToPage(page: number) {
    this.currentPage.set(page);
  }

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      'SEARCHING': 'Recherche',
      'DRIVER_FOUND': 'Chauffeur trouvé',
      'ACCEPTED': 'Acceptée',
      'DRIVER_EN_ROUTE': 'En route',
      'ARRIVED': 'Arrivé',
      'IN_PROGRESS': 'En cours',
      'COMPLETED': 'Terminée',
      'CANCELLED': 'Annulée',
      'EXPIRED': 'Expirée',
      'RENDERED': 'Rendue',
      'ARCHIVED': 'Archivée'
    };
    return labels[status] || status;
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  formatPrice(price: number): string {
    return new Intl.NumberFormat('fr-FR').format(price);
  }

  viewRide(ride: Ride) {
    this.router.navigate(['/ride/tracking', ride.id]);
  }
}
