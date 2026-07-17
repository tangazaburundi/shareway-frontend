import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

import { TripService } from '../../core/services/trip.service';
import { ReviewService } from '../../core/services/review.service';
import { LanguageService } from '../../core/services/language.service';

import { Booking, BookingStatus } from '../../core/models/trip.model';
import { FrenchDatePipe } from '../../core/pipes/french-date.pipe';

import { CancelModalComponent, CancelModalConfig } from '../../shared/components/cancel-modal/cancel-modal.component';
import { ReviewModalComponent } from '../../shared/components/review-modal/review-modal.component';

@Component({
  selector: 'app-booking-management',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FrenchDatePipe,
    CancelModalComponent,
    ReviewModalComponent
  ],
  templateUrl: './bookings-management.component.html',
  styleUrls: ['./bookings-management.component.css']
})
export class BookingManagementComponent implements OnInit {

  tripId = '';
  tripDate = '';

  bookings: Booking[] = [];
  loading = true;

  responding: string | null = null;

  // MODALS
  showRejectModal = false;
  rejectConfig: CancelModalConfig | null = null;
  rejectError: string | null = null;
  pendingRejectId: string | null = null;

  selectedBookingId: string | null = null;
  selectedPassenger: any = null;

  selectedBookingForReview: Booking | null = null;

  langService = inject(LanguageService);
  private reviewService = inject(ReviewService);

  constructor(private tripService: TripService) {}

  ngOnInit() {
    this.tripId = window.location.pathname.split('/').pop() || '';
    this.load();
  }

  // --------------------
  // LOAD
  // --------------------
  load() {
    this.loading = true;

    this.tripService.getTripBookings().subscribe({
      next: (res: any) => {
        this.bookings = res.data ?? [];

        if (this.bookings.length > 0) {
          this.tripDate = this.bookings[0].departureTime;
        }

        this.computeCanReview(); // IMPORTANT
        this.loading = false;
      },
      error: () => this.loading = false
    });
  }

  // --------------------
  // REVIEW PRECOMPUTE
  // --------------------
  computeCanReview() {
    this.bookings.forEach(b => {

      if (b.tripStatus !== 'COMPLETED') {
        (b as any).canReview = false;
        return;
      }
    const userId = b.passenger?.id;

    if (!b.tripId || !userId) {
      (b as any).canReview = false;
      return;
    }

      this.reviewService.canReview(b.tripId, userId)
        .subscribe({
          next: (res: any) => {
            (b as any).canReview = res.data ?? false;
          },
          error: () => {
            (b as any).canReview = false;
          }
        });

    });
  }

  // --------------------
  // ACCEPT
  // --------------------
  accept(b: Booking) {
    this.responding = b.id;

    this.tripService.respondToBooking(this.tripId, b.id, {
      action: 'ACCEPTED'
    }).subscribe({
      next: (res: any) => {
        const idx = this.bookings.findIndex(x => x.id === b.id);
        if (idx >= 0) this.bookings[idx] = res.data!;
        this.responding = null;
      },
      error: () => this.responding = null
    });
  }

  // --------------------
  // REJECT
  // --------------------
  openRejectModal(b: Booking) {
    this.pendingRejectId = b.id;

    this.rejectConfig = {
      title: 'Refuser la réservation',
      description: `Refuser ${b.passenger?.firstName}`,
      placeholder: 'Raison',
      confirmLabel: 'Refuser',
      cancelLabel: 'Annuler',
      reasonRequired: true
    };

    this.showRejectModal = true;
  }

  reject(data: any) {
    if (!this.pendingRejectId) return;

    this.responding = this.pendingRejectId;

    this.tripService.respondToBooking(this.tripId, this.pendingRejectId, {
      action: 'REJECTED',
      reason: data.reason,
      notifyDriver: data.notify
    }).subscribe({
      next: (res: any) => {
        const idx = this.bookings.findIndex(x => x.id === this.pendingRejectId);
        if (idx >= 0) this.bookings[idx] = res.data!;
        this.closeRejectModal();
        this.responding = null;
      },
      error: (err) => {
        this.rejectError = err.error?.message;
        this.responding = null;
      }
    });
  }

  closeRejectModal() {
    this.showRejectModal = false;
    this.pendingRejectId = null;
    this.rejectConfig = null;
    this.rejectError = null;
  }

  // --------------------
  // PROFILE
  // --------------------
  viewProfile(b: Booking) {
    this.tripService.getPassengerProfile(b.tripId, b.passenger!.id)
      .subscribe({
        next: (res: any) => {
          this.selectedPassenger = res.data;
          this.selectedBookingId = b.id;
        }
      });
  }

  // --------------------
  // REVIEW
  // --------------------
  openReview(b: Booking) {
    this.selectedBookingForReview = b;
  }

  closeReview() {
    this.selectedBookingForReview = null;
  }

  onReviewed() {
    this.selectedBookingForReview = null;
  }

  // --------------------
  // LABELS
  // --------------------
  statusLabel(s: BookingStatus): string {
    const map: any = {
      PENDING: '⏳ En attente',
      CONFIRMED: '✅ Accepté',
      REJECTED: '❌ Refusé',
      CANCELLED: '🚫 Annulé',
      COMPLETED: '🏁 Terminé'
    };
    return map[s] ?? s;
  }

  canShowActions(b: Booking): boolean {
    return ['PENDING'].includes(b.status);
  }

    canShowShowProfil(b: Booking): boolean {
      return ['PENDING', 'CONFIRMED', 'COMPLETED'].includes(b.status);
    }
}