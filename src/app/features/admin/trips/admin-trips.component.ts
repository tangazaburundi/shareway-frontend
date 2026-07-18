import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../../core/services/admin.service';
import { LanguageService } from '../../../core/services/language.service';
import { LucideIconsDirective } from '../../../shared/directives/lucide-icons.directive';

@Component({
  selector: 'app-admin-trips',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideIconsDirective],
  templateUrl: './admin-trips.component.html',
  styleUrl: './admin-trips.component.css'
})
export class AdminTripsComponent implements OnInit {
  trips:      any[] = [];
  loading     = false;
  activeFilter = 'ALL';
  searchQuery = '';
  page        = 0;
  size        = 20;
  totalPages  = 1;
  total       = 0;
  acting:     string | null = null;
  errors:     Record<string, string> = {};

  filters = [
    { key: 'ALL',       labelKey: 'admin.trips.filter.all' },
    { key: 'OPEN',      labelKey: 'admin.trips.filter.open' },
    { key: 'COMPLETED', labelKey: 'admin.trips.filter.completed' },
    { key: 'CANCELLED', labelKey: 'admin.trips.filter.cancelled' },
    { key: 'REJECTED',  labelKey: 'admin.trips.filter.rejected' }
  ];

  constructor(
    private svc: AdminService,
    public langService: LanguageService
  ) {}

  ngOnInit() { this.loadTrips(); }

  loadTrips() {
    this.loading = true;
    const status = this.activeFilter === 'ALL' ? undefined : this.activeFilter;
    const search = this.searchQuery.trim() || undefined;
    this.svc.getTrips(status, this.page, this.size, search).subscribe({
      next: r => {
        this.trips      = r.data?.content ?? [];
        this.total      = r.data?.totalElements ?? 0;
        this.totalPages = r.data?.totalPages ?? 1;
        this.loading    = false;
      },
      error: () => { this.loading = false; }
    });
  }

  setFilter(key: string) {
    this.activeFilter = key;
    this.page = 0;
    this.loadTrips();
  }

  search() {
    this.page = 0;
    this.loadTrips();
  }

  changeStatus(tripId: string, newStatus: string) {
    this.acting = tripId;
    this.svc.changeTripStatus(tripId, newStatus).subscribe({
      next: () => {
        const trip = this.trips.find(t => t.id === tripId);
        if (trip) trip.status = newStatus;
        this.acting = null;
      },
      error: err => {
        this.errors[tripId] = err.error?.message || 'Erreur';
        this.acting = null;
      }
    });
  }

  prev() { if (this.page > 0) { this.page--; this.loadTrips(); } }
  next() { if (this.page < this.totalPages - 1) { this.page++; this.loadTrips(); } }

  statusClass(status: string): string {
    switch (status) {
      case 'OPEN':      return 'open';
      case 'COMPLETED': return 'completed';
      case 'CANCELLED': return 'cancelled';
      case 'REJECTED':  return 'rejected';
      default:          return '';
    }
  }

  statusLabel(status: string): string {
    return this.langService.t('admin.trips.status.' + status.toLowerCase());
  }

  driverName(trip: any): string {
    return trip.driver?.firstName + ' ' + trip.driver?.lastName;
  }
}
