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
        <div class="filter-tabs">
          <button class="tab" [class.active]="activeFilter() === 'all'" (click)="setFilter('all')">
            Toutes
          </button>
          <button class="tab" [class.active]="activeFilter() === 'passenger'" (click)="setFilter('passenger')">
            Passager
          </button>
          <button class="tab" [class.active]="activeFilter() === 'driver'" (click)="setFilter('driver')">
            Chauffeur
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

            @if (ride.status === 'COMPLETED' || ride.status === 'CANCELLED' || ride.status === 'EXPIRED') {
              <div class="ride-actions">
                <button class="btn-archive" (click)="archiveRide(ride.id, $event)">
                  Supprimer
                </button>
              </div>
            }
          </div>
        } @empty {
          <div class="empty-state">
            <span class="empty-icon">🚗</span>
            <h3>Aucune course</h3>
            <p>Vous n'avez pas encore de courses.</p>
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
  styles: [`
    .history-page {
      padding: 16px;
      max-width: 600px;
      margin: 0 auto;
    }

    .page-header {
      margin-bottom: 24px;
    }

    .page-header h1 {
      font-size: 1.5rem;
      font-weight: 700;
      color: #1a1a2e;
      margin: 0 0 16px;
    }

    .filter-tabs {
      display: flex;
      gap: 8px;
    }

    .tab {
      padding: 8px 16px;
      border: 1px solid #e5e7eb;
      border-radius: 20px;
      background: white;
      font-size: 0.85rem;
      font-weight: 500;
      color: #6b7280;
      cursor: pointer;
      transition: all 0.2s;
    }

    .tab.active {
      background: #1a1a2e;
      color: white;
      border-color: #1a1a2e;
    }

    .tab:hover:not(.active) {
      border-color: #1a1a2e;
      color: #1a1a2e;
    }

    .stats-summary {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 12px;
      margin-bottom: 24px;
    }

    .stat-card {
      background: white;
      border: 1px solid #f3f4f6;
      border-radius: 12px;
      padding: 16px;
      text-align: center;
    }

    .stat-number {
      display: block;
      font-size: 1.5rem;
      font-weight: 700;
      color: #1a1a2e;
    }

    .stat-label {
      font-size: 0.75rem;
      color: #9ca3af;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .rides-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .ride-card {
      background: white;
      border: 1px solid #f3f4f6;
      border-radius: 14px;
      padding: 16px;
      cursor: pointer;
      transition: transform 0.2s, box-shadow 0.2s;
    }

    .ride-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0,0,0,0.06);
    }

    .ride-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
    }

    .ride-date {
      font-size: 0.8rem;
      color: #9ca3af;
    }

    .ride-status {
      padding: 4px 10px;
      border-radius: 12px;
      font-size: 0.7rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.03em;
    }

    .status-completed { background: #dcfce7; color: #16a34a; }
    .status-cancelled { background: #fee2e2; color: #dc2626; }
    .status-in_progress { background: #dbeafe; color: #2563eb; }
    .status-searching { background: #fef3c7; color: #d97706; }

    .ride-route {
      margin-bottom: 12px;
    }

    .route-point {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 3px 0;
    }

    .route-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      flex-shrink: 0;
    }

    .route-dot.pickup { background: #22c55e; }
    .route-dot.dest { background: #ef4444; }

    .route-line {
      width: 1px;
      height: 12px;
      background: #d1d5db;
      margin-left: 3.5px;
    }

    .route-text {
      font-size: 0.85rem;
      color: #374151;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .ride-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .ride-person {
      font-size: 0.85rem;
      color: #6b7280;
    }

    .person-label {
      font-weight: 600;
      color: #374151;
    }

    .ride-price {
      font-size: 1rem;
      font-weight: 700;
      color: #16a34a;
    }

    .ride-meta {
      display: flex;
      gap: 16px;
      margin-top: 10px;
      padding-top: 10px;
      border-top: 1px solid #f3f4f6;
      font-size: 0.8rem;
      color: #9ca3af;
    }

    .ride-actions {
      margin-top: 10px;
      padding-top: 10px;
      border-top: 1px solid #f3f4f6;
      display: flex;
      justify-content: flex-end;
    }

    .btn-archive {
      padding: 6px 14px;
      background: #fee2e2;
      color: #dc2626;
      border: none;
      border-radius: 8px;
      font-size: 0.8rem;
      font-weight: 600;
      cursor: pointer;
      transition: background 0.2s;
    }

    .btn-archive:hover {
      background: #fecaca;
    }

    .pagination {
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 16px;
      margin-top: 20px;
      padding: 12px;
    }

    .page-btn {
      padding: 8px 16px;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      background: white;
      font-size: 0.85rem;
      font-weight: 500;
      color: #374151;
      cursor: pointer;
      transition: all 0.2s;
    }

    .page-btn:hover:not(:disabled) {
      border-color: #1a1a2e;
      color: #1a1a2e;
    }

    .page-btn:disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }

    .page-info {
      font-size: 0.9rem;
      color: #6b7280;
      font-weight: 500;
    }

    .empty-state {
      text-align: center;
      padding: 60px 24px;
    }

    .empty-icon {
      font-size: 3rem;
      display: block;
      margin-bottom: 16px;
    }

    .empty-state h3 {
      margin: 0 0 8px;
      color: #374151;
    }

    .empty-state p {
      margin: 0;
      color: #9ca3af;
    }
  `]
})
export class RideHistoryComponent implements OnInit {
  allRides = signal<Ride[]>([]);
  filteredRides = signal<Ride[]>([]);
  activeFilter = signal<'all' | 'passenger' | 'driver'>('all');
  completedCount = signal(0);
  totalEarnings = signal('0');
  archivedIds = signal<Set<string>>(new Set(JSON.parse(localStorage.getItem('archivedRides') || '[]')));

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

  setFilter(filter: 'all' | 'passenger' | 'driver') {
    this.activeFilter.set(filter);
    this.currentPage.set(1);
    this.applyFilter();
  }

  private applyFilter() {
    const rides = this.allRides();
    const filter = this.activeFilter();
    const archived = this.archivedIds();
    let filtered = rides.filter(r => !archived.has(r.id));

    if (filter === 'passenger') {
      filtered = filtered.filter(r => !(r as any)._role || (r as any)._role === 'passenger');
    } else if (filter === 'driver') {
      filtered = filtered.filter(r => (r as any)._role === 'driver');
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
    const updated = new Set(this.archivedIds());
    updated.add(rideId);
    this.archivedIds.set(updated);
    localStorage.setItem('archivedRides', JSON.stringify([...updated]));
    this.applyFilter();
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
      'EXPIRED': 'Expirée'
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
