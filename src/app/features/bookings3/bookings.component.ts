import { Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { TripService } from '../../core/services/trip.service';
import { Trip } from '../../core/models/trip.model';
import { AuthService } from '../../core/services/auth.service';
import { LanguageService } from '../../core/services/language.service';
import { RatingStarsComponent } from '../../shared/components/rating-stars/rating-stars.component';
import { CancelModalComponent } from '../../shared/components/cancel-modal/cancel-modal.component';
import { ReviewModalComponent } from '../../shared/components/review-modal/review-modal.component';

@Component({
  selector: 'app-bookings',
  standalone: true,
  imports: [CommonModule, RouterLink, RatingStarsComponent, CancelModalComponent, ReviewModalComponent],
  templateUrl: './bookings.component.html',
  styleUrls: ['./bookings.component.css']
  })



export class BookingsComponent implements OnInit {
  private tripService = inject(TripService);
  private authService = inject(AuthService);
  langService = inject(LanguageService);

  bookings: Trip[] = []; loading = true; tab = 'upcoming';
  showCancel = false; showReview = false; cancelling = false;
  cancelTrip: Trip | null = null; reviewTrip: Trip | null = null;
  errorMsg = ''; successMsg = '';

  get userId() { return this.authService.currentUser()?.id; }
  get upcoming() { return this.bookings.filter(t => new Date(t.departureTime) >= new Date() && t.status !== 'CANCELLED'); }
  get past() { return this.bookings.filter(t => new Date(t.departureTime) < new Date() || t.status === 'COMPLETED'); }
  get cancelled() { return this.bookings.filter(t => this.myBookingStatus(t) === 'CANCELLED' || t.status === 'CANCELLED'); }
  get activeList() { return this.tab === 'upcoming' ? this.upcoming : this.tab === 'past' ? this.past : this.cancelled; }

  myBookingStatus(trip: Trip): string {
    console.error('trip',trip);
    return trip.passengers.find(p => p.id === this.userId)?.bookingStatus || 'CONFIRMED';
  }

  ngOnInit() {
    this.tripService.getMyBookings().subscribe({
      next: (res) => { this.bookings = res.data || []; this.loading = false; },
      error: () => { this.loading = false; }
    });
  }

  openCancel(trip: Trip) { this.cancelTrip = trip; this.showCancel = true; }
  openReview(trip: Trip) { this.reviewTrip = trip; this.showReview = true; }

  cancelBooking(data: { reason: string; notify: boolean }) {
    if (!this.cancelTrip) return;
    this.cancelling = true;
    this.tripService.leave(this.cancelTrip.id, { tripId: this.cancelTrip.id, reason: data.reason, notifyDriver: data.notify }).subscribe({
      next: () => {
        const p = this.cancelTrip!.passengers.find(x => x.id === this.userId);
        console.error("statut",p);
        if (p) p.bookingStatus = 'CANCELLED';
        this.showCancel = false; this.cancelling = false; this.cancelTrip = null;
      },
      //error: () => { this.cancelling = false; }
      error: (e) => { this.errorMsg = e.error?.message || 'Erreur'; this.loading = false; this.cancelling = false; }
    });
  }

  onReviewed() {
    this.showReview = false;
    this.reviewTrip = null;
  }
}