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
  trips: any[] = [];
  loading = false;
  activeFilter = 'ALL';
  searchQuery = '';
  page = 0;
  size = 20;
  totalPages = 1;
  total = 0;
  acting: string | null = null;
  errors: Record<string, string> = {};

  showModal = false;
  modalAction = '';
  modalTripId = '';
  modalReason = '';

  filters = [
    { key: 'ALL',       labelKey: 'admin.trips.filter.all' },
    { key: 'OPEN',      labelKey: 'admin.trips.filter.open' },
    { key: 'PENDING',   labelKey: 'admin.trips.filter.pending' },
    { key: 'FULL',      labelKey: 'admin.trips.filter.full' },
    { key: 'SUSPENDED', labelKey: 'admin.trips.filter.suspended' },
    { key: 'REJECTED',  labelKey: 'admin.trips.filter.rejected' },
    { key: 'COMPLETED', labelKey: 'admin.trips.filter.completed' },
    { key: 'CANCELLED', labelKey: 'admin.trips.filter.cancelled' }
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
        this.trips = r.data?.content ?? [];
        this.total = r.data?.totalElements ?? 0;
        this.totalPages = r.data?.totalPages ?? 1;
        this.loading = false;
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

  openModal(tripId: string, action: string) {
    this.modalTripId = tripId;
    this.modalAction = action;
    this.modalReason = '';
    this.showModal = true;
  }

  closeModal() {
    this.showModal = false;
    this.modalTripId = '';
    this.modalAction = '';
    this.modalReason = '';
  }

  confirmAction() {
    const id = this.modalTripId;
    const action = this.modalAction;
    const reason = this.modalReason || undefined;
    this.closeModal();
    this.acting = id;

    let obs;
    switch (action) {
      case 'APPROVE':
        obs = this.svc.approveTrip(id);
        break;
      case 'CANCEL':
        obs = this.svc.rejectTrip(id, reason || 'Annulé par l\'administrateur');
        break;
      case 'REJECT':
        obs = this.svc.rejectTrip(id, reason);
        break;
      case 'SUSPEND':
        obs = this.svc.suspendTrip(id, reason);
        break;
      case 'REACTIVATE':
        obs = this.svc.reactivateTrip(id);
        break;
      case 'DELETE':
        obs = this.svc.deleteTrip(id, reason);
        break;
      default:
        this.acting = null;
        return;
    }

    obs.subscribe({
      next: () => {
        this.acting = null;
        this.loadTrips();
      },
      error: err => {
        this.errors[id] = err.error?.message || 'Erreur';
        this.acting = null;
      }
    });
  }

  prev() { if (this.page > 0) { this.page--; this.loadTrips(); } }
  next() { if (this.page < this.totalPages - 1) { this.page++; this.loadTrips(); } }

  statusClass(status: string): string {
    return status?.toLowerCase() || '';
  }

  statusLabel(status: string): string {
    return this.langService.t('admin.trips.status.' + status?.toLowerCase());
  }

  driverName(trip: any): string {
    return trip.driver?.firstName + ' ' + trip.driver?.lastName;
  }
}
