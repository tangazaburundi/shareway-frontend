import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { TripService } from '../../../core/services/trip.service';
import { AuthService } from '../../../core/services/auth.service';
import { Trip, Currency, TripPassenger,Booking } from '../../../core/models/trip.model';
import { RatingStarsComponent } from '../../../shared/components/rating-stars/rating-stars.component';
import { CurrencySelectorComponent } from '../../../shared/components/currency-selector/currency-selector.component';
import { CancelModalComponent } from '../../../shared/components/cancel-modal/cancel-modal.component';
import { ReviewModalComponent } from '../../../shared/components/review-modal/review-modal.component';
import { ModalComponent } from '../../../shared/components/modal/modal.component';
import { LanguageService } from '../../../core/services/language.service';
import { ReviewService } from '../../../core/services/review.service';


@Component({ selector: 'app-trip-detail', standalone: true,
  imports: [
  CommonModule, RouterLink, RatingStarsComponent, CurrencySelectorComponent, CancelModalComponent, ReviewModalComponent, ModalComponent],
  templateUrl: './trip-detail.component.html',
  styleUrls: ['./trip-detail.component.css']
   })
export class TripDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private tripService = inject(TripService);

  authService = inject(AuthService);  private reviewService = inject(ReviewService);
  private router = inject(Router);
  langService = inject(LanguageService);

  selectedBookingId: string | null = null;
  selectedPassenger: any = null;
  trip: Trip | null = null;
  loading = true; actionLoading = false;
  errorMsg = ''; successMsg = '';
  showCancelTrip = false; showCancelBooking = false; showReview = false; showShare = false;
  bookCurrency: Currency = 'FBU';
  canPassengerReview = false; shareUrl = ''; copied = false;

  get isDriver() { return this.trip?.driver.id === this.authService.currentUser()?.id; }
  get isPassenger() {
  return this.trip?.passengers.some(p => p.id === this.authService.currentUser()?.id && p.bookingStatus === 'CONFIRMED') ?? false; }

  get activePassengers(): TripPassenger[] {
  return this.trip?.passengers.filter(p => p.bookingStatus === 'CONFIRMED' || p.bookingStatus === 'COMPLETED') ?? []; }

  get statusLabel() {
    const m: Record<string, Record<string, string>> = {
      fr: { OPEN: 'Disponible', FULL: 'Complet', CANCELLED: 'Annulé', COMPLETED: 'Terminé' },
      ki: { OPEN: 'Iraboneka', FULL: 'Ryuzuywe', CANCELLED: 'Rahanutse', COMPLETED: 'Irarangiye' }
    };
    return m[this.langService.currentLang()][this.trip?.status || ''] || '';
  }

  get freqLabel() {
    const m: Record<string, Record<string, string>> = {
      fr: { WEEKLY: 'Chaque semaine', BIWEEKLY: 'Toutes les 2 semaines', MONTHLY: 'Chaque mois' },
      ki: { WEEKLY: 'Buri ndwi', BIWEEKLY: 'Indwi ezviri', MONTHLY: 'Buri kwezi' }
    };
    return m[this.langService.currentLang()][this.trip?.frequency || ''] || '';
  }

  get whatsappUrl() { return `https://wa.me/?text=${encodeURIComponent(this.shareUrl)}`; }
  get smsUrl() { return `sms:?body=${encodeURIComponent(this.shareUrl)}`; }

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id')!;

    this.tripService.getById(id).subscribe({
      next: (res) => {
        this.trip = res.data!; this.loading = false;
        if (this.authService.isAuthenticated()) this.checkCanPassengerReview();
      },
      error: () => { this.loading = false; this.router.navigate(['/trips']); }
    });
  }

  checkCanPassengerReview() {

      if (!this.trip || this.trip.status !== 'COMPLETED') return;
      this.reviewService.canReview(
        this.trip.id,
        this.trip.driver.id
      ).subscribe({
        next: res => {
          this.canPassengerReview = res.data ?? false;
        }
      });
  }

  joinTrip() {
    this.actionLoading = true;

    this.tripService.book(this.trip!.id, {
      seats: 1,
      currency: this.bookCurrency
    }).subscribe({
      next: () => {
        this.successMsg = this.langService.t('trip.bookSuccess');
        this.trip!.availableSeats--;

        const u = this.authService.currentUser()!;
        this.trip!.passengers.push({
          id: u.id,
          firstName: u.firstName,
          lastName: u.lastName,
          bookingId: '',
          bookingStatus: 'CONFIRMED',
          bookedAt: new Date().toISOString()
        });

        this.actionLoading = false;
      },
      error: (e) => {
        this.errorMsg = e.error?.message || 'Erreur';
        this.actionLoading = false;
      }
    });
  }
/*
  leaveTrip(data: { reason: string; notify: boolean }) {
    this.actionLoading = true;
    this.tripService.leave(this.trip!.id, { tripId: this.trip!.id, reason: data.reason, notifyDriver: data.notify }).subscribe({
      next: () => {
        this.successMsg = this.langService.t('trip.leaveSuccess');
        const uid = this.authService.currentUser()!.id;
        const p = this.trip!.passengers.find(x => x.id === uid);
        if (p) p.bookingStatus = 'CANCELLED';
        this.trip!.availableSeats++;
        this.showCancelBooking = false;
        this.actionLoading = false;
      },
      error: () => { this.actionLoading = false; }
    });
  }
  */
  /*
  leaveTrip(data: { reason: string; notify: boolean }) {
    this.actionLoading = true;

    this.tripService.leave(this.trip!.id, {
      reason: data.reason,
      notifyDriver: data.notify
    }).subscribe({
      next: () => {
        this.successMsg = this.langService.t('trip.leaveSuccess');

        const uid = this.authService.currentUser()!.id;
        const p = this.trip!.passengers.find(x => x.id === uid);

        if (p) p.bookingStatus = 'CANCELLED';

        this.trip!.availableSeats++;
        this.showCancelBooking = false;
        this.actionLoading = false;
      },

      error: (e) => {
        this.actionLoading = false;
        this.errorMsg = e.error?.message || 'Erreur lors de l’annulation';
      }
    });
  }
*/
/*   cancelTrip(data: { reason: string; notify: boolean }) {
    this.actionLoading = true;
    this.tripService.cancel(this.trip!.id, { tripId: this.trip!.id, reason: data.reason, notifyPassengers: data.notify }).subscribe({
      next: () => { this.trip!.status = 'CANCELLED'; this.showCancelTrip = false; this.actionLoading = false; },
      error: () => { this.actionLoading = false; }
    });
  } */

  leaveTrip(data: { reason: string; notify: boolean }) {
    this.actionLoading = true;
    this.errorMsg = '';

    this.tripService.leave(this.trip!.id, {
      reason: data.reason,
      notifyDriver: data.notify
    }).subscribe({
      next: () => {
        this.successMsg = this.langService.t('trip.leaveSuccess');

        const uid = this.authService.currentUser()!.id;
        const p = this.trip!.passengers.find(x => x.id === uid);

        if (p) p.bookingStatus = 'CANCELLED';

        this.trip!.availableSeats++;
        this.showCancelBooking = false;
        this.actionLoading = false;
      },

      error: (e) => {
        this.actionLoading = false;

        // ⭐ IMPORTANT pour ton popup
        this.errorMsg =
          e.error?.message ||
          e.error?.error?.message ||
          'Erreur lors de l’annulation';
      }
    });
  }

  cancelTrip(data: { reason: string; notify: boolean }) {
    this.actionLoading = true;

    this.tripService.cancel(this.trip!.id, {
      reason: data.reason,
      notifyPassengers: data.notify
    }).subscribe({
      next: () => {
        this.trip!.status = 'CANCELLED';
        this.showCancelTrip = false;
        this.actionLoading = false;
      },
      error: (e) => {
        this.actionLoading = false;
        this.errorMsg = e.error?.message || 'Erreur lors de l’annulation';
      }
    });
  }

  completeTrip() {
    this.tripService.complete(this.trip!.id).subscribe({
      next: () => { this.trip!.status = 'COMPLETED';
      this.checkCanPassengerReview();

       }
    });
  }

  shareTrip() {
    this.tripService.generateShareLink(this.trip!.id).subscribe({
      next: (res: any) => { this.shareUrl = res.data!.url; this.showShare = true; }
    });
  }

  copyLink() {
    navigator.clipboard.writeText(this.shareUrl).then(() => { this.copied = true; setTimeout(() => this.copied = false, 2000); });
  }

  onReviewSubmitted() {
    this.showReview = false;
    this.successMsg = this.langService.t('review.thanks');
    this.canPassengerReview = false;
  }

  get isOwner(): boolean {
    return this.trip?.driver?.id === this.authService.currentUser()?.id;
  }

  cancelTripConfig = {
    title: 'Annuler le trajet',
    description: 'Veuillez indiquer la raison de l’annulation',
    placeholder: 'Raison...',
    confirmLabel: 'Annuler le trajet',
    cancelLabel: 'Garder le trajet',
    reasonRequired: true
  };

  cancelBookingConfig = {
    title: 'Annuler la réservation',
    description: 'Veuillez indiquer la raison de l’annulation',
    placeholder: 'Raison...',
    confirmLabel: 'Confirmer l’annulation',
    cancelLabel: 'Garder ma place',
    reasonRequired: true
  };

 /*  viewPassengerProfile(b: Booking) {
      this.tripService.getPassengerProfile(b.tripId, b.passenger!.id)
        .subscribe({
          next: (res: any) => {
            this.selectedPassenger = res.data;
            this.selectedBookingId = b.id;
          }
        });
    } */

    viewPassengerProfile(tripId: string, passengerId: string): void {
      this.tripService.getPassengerProfile(tripId, passengerId)
        .subscribe({
          next: (res: any) => {
            console.log("res.data",res.data);
            this.selectedPassenger = res.data;
            //this.selectedBookingId = b.id;
          }
        });
    }
}