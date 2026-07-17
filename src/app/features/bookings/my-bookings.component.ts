/*
import { Component, OnInit , inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TripService } from '../../core/services/trip.service';
import { Booking, BookingStatus,TripStatus } from '../../core/models/trip.model';
import { FrenchDatePipe } from '../../core/pipes/french-date.pipe';
import { LanguageService } from '../../core/services/language.service';
import { ReviewService } from '../../core/services/review.service';
import { CancelModalComponent, CancelModalConfig } from '../../shared/components/cancel-modal/cancel-modal.component';
import { ReviewModalComponent } from '../../shared/components/review-modal/review-modal.component';
import { ModalComponent } from '../../shared/components/modal/modal.component';


@Component({
  selector: 'app-my-bookings',
  standalone: true,
  imports: [CommonModule,ModalComponent, RouterModule, FrenchDatePipe,ReviewModalComponent, CancelModalComponent],
  templateUrl: './my-bookings.component.html',
  styleUrls: ['./my-bookings.component.css']
})
export class MyBookingsComponent implements OnInit {

  langService = inject(LanguageService);
  private reviewService = inject(ReviewService);
  bookings: Booking[] = [];
  loading  = true;
  showReview = false;
  showCancelModal = false;
  cancelConfig:   CancelModalConfig | null = null;
  cancelError:    string | null = null;
  cancelling:     string | null = null;
  pendingCancel:  Booking | null = null;
  canPassengerReview = false;

  constructor(private tripService: TripService) {}

  ngOnInit() {
    this.load();
  }

  load() {
    this.loading = true;
    this.tripService.getMyBookings().subscribe({
      next: (r: any) => { this.bookings = r.data ?? []; this.loading = false; },
      error: () => { this.loading = false; }
    });
  }

  openCancelModal(b: Booking) {
    this.pendingCancel = b;
    this.cancelError   = null;
    this.cancelConfig  = {
      title: 'Annuler la réservation',
      description: b.status === 'PENDING'
        ? `Vous êtes sur le point d'annuler votre demande pour le trajet ${b.departureCity} → ${b.arrivalCity}.`
        : `Vous êtes sur le point d'annuler votre réservation confirmée pour le trajet ${b.departureCity} → ${b.arrivalCity}. Le conducteur sera notifié.`,
      placeholder: 'Raison de l\'annulation (optionnel)',
      confirmLabel: 'Confirmer l\'annulation',
      cancelLabel: 'Garder ma réservation',
      reasonRequired: false
    };
    this.showCancelModal = true;
  }

   */
/* confirmCancel(reason: string) {
    if (!this.pendingCancel) return;
    this.cancelling = this.pendingCancel.id;
    this.cancelError = null;

    this.tripService.leave(this.pendingCancel.tripId, reason).subscribe({
      next: () => {
        this.cancelling = null;
        this.closeCancelModal();
        this.load(); // recharger la liste
      },
      error: (err: any) => {
        // ── L'erreur s'affiche DANS la popup, pas en dehors ──────────
        this.cancelError = err.error?.message
          || 'Impossible d\'annuler cette réservation pour le moment.';
        this.cancelling = null;
      }
    });
  } *//*


  confirmCancel(data: { reason: string; notify: boolean }) {
    if (!this.pendingCancel) return;

    this.cancelling = this.pendingCancel.id;
    this.cancelError = null;

    this.tripService.leave(this.pendingCancel.tripId, {
      reason: data.reason,  notifyDriver: data.notify
    }).subscribe({
      next: () => {
        this.cancelling = null;
        this.closeCancelModal();
        this.load();
      },
      error: (err: any) => {
        this.cancelError =
          err.error?.message ||
          'Impossible d\'annuler cette réservation pour le moment.';
        this.cancelling = null;
      }
    });
  }

  closeCancelModal() {
    this.showCancelModal = false;
    this.cancelConfig    = null;
    this.cancelError     = null;
    this.pendingCancel   = null;
  }



  checkCanPassengerReview(b: Booking): boolean {
     this.showReview=true
     const driverId = b?.driverId;
     const tripId = b?.tripId;
      console.log("fuuuuuu tripId ",tripId);
       console.log("fuuuuuu idDriver ",driverId);
      if (!tripId || !driverId) {
        return false;
      }


           this.reviewService.canReview(
              tripId,
             driverId
            ).subscribe({
              next: (res: any) => {
                this.canPassengerReview = res.data ?? false;
              }
            });

           return  this.canPassengerReview;
    }



  statusLabel(s: BookingStatus): string {
    const labels: Record<BookingStatus, string> = {
      PENDING:   '⏳ En attente',
      CONFIRMED: '✅ Confirmée',
      REJECTED:  '❌ Refusée',
      CANCELLED: '🚫 Annulée',
      COMPLETED: '🏁 Terminée'
    };
    return labels[s] ?? s;
  }


    onReviewed() {
        this.showReview = false;
        //this.reviewTrip = null;
        }

}
 */


import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

import { TripService } from '../../core/services/trip.service';
import { ReviewService } from '../../core/services/review.service';
import { LanguageService } from '../../core/services/language.service';

import { Booking, BookingStatus } from '../../core/models/trip.model';

import { FrenchDatePipe } from '../../core/pipes/french-date.pipe';
import { CancelModalComponent } from '../../shared/components/cancel-modal/cancel-modal.component';
import { ReviewModalComponent } from '../../shared/components/review-modal/review-modal.component';

@Component({
  selector: 'app-my-bookings',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FrenchDatePipe,
    CancelModalComponent,
    ReviewModalComponent
  ],
  templateUrl: './my-bookings.component.html',
  styleUrls: ['./my-bookings.component.css']
})
export class MyBookingsComponent implements OnInit {

  bookings: Booking[] = [];
  loading = true;

  // modals
  showCancelModal = false;
  cancelConfig: any;
  cancelError: string | null = null;
  cancelling: string | null = null;
  pendingCancel: Booking | null = null;

  selectedBookingForReview: Booking | null = null;

  langService = inject(LanguageService);

  constructor(
    private tripService: TripService,
    private reviewService: ReviewService
  ) {}

  ngOnInit() {
    this.load();
  }

  // ------------------------
  // LOAD + PRECOMPUTE REVIEW
  // ------------------------
  load() {
    this.loading = true;

    this.tripService.getMyBookings().subscribe({
      next: (res: any) => {
        this.bookings = res.data ?? [];

        // IMPORTANT: pas de boucle HTTP dans template
        this.computeCanReview();

        this.loading = false;
      },
      error: () => this.loading = false
    });
  }

  computeCanReview() {
    this.bookings.forEach(b => {

      if (b.tripStatus !== 'COMPLETED') {
        b.canReview = false;
        return;
      }

      this.reviewService.canReview(b.tripId, b.driverId)
        .subscribe({
          next: (res: any) => {
            b.canReview = res.data ?? false;
          },
          error: () => {
            b.canReview = false;
          }
        });

    });
  }

  // ------------------------
  // REVIEW
  // ------------------------
  openReview(b: Booking) {
    this.selectedBookingForReview = b;
  }

  onReviewed() {
    this.selectedBookingForReview = null;
  }

  // ------------------------
  // CANCEL
  // ------------------------
  openCancelModal(b: Booking) {
    this.pendingCancel = b;
    this.showCancelModal = true;
  }

  confirmCancel(data: any) {
    if (!this.pendingCancel) return;

    this.cancelling = this.pendingCancel.id;

    this.tripService.leave(this.pendingCancel.tripId, {
      reason: data.reason,
      notifyDriver: data.notify
    }).subscribe({
      next: () => {
        this.cancelling = null;
        this.closeCancelModal();
        this.load();
      },
      error: (err) => {
        this.cancelError = err.error?.message;
        this.cancelling = null;
      }
    });
  }

  closeCancelModal() {
    this.showCancelModal = false;
    this.pendingCancel = null;
    this.cancelError = null;
    this.cancelConfig = null;
  }

  // ------------------------
  // LABELS
  // ------------------------
  statusLabel(s: BookingStatus): string {
    const map: any = {
      PENDING: '⏳ En attente',
      CONFIRMED: '✅ Confirmée',
      REJECTED: '❌ Refusée',
      CANCELLED: '🚫 Annulée',
      COMPLETED: '🏁 Terminée'
    };
    return map[s] ?? s;
  }
}