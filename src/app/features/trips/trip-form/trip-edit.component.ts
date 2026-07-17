import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { TripService } from '../../../core/services/trip.service';
import { Trip, UpdateTripRequest, TripPreferences } from '../../../core/models/trip.model';
import { TripPreferencesComponent } from '../trip-preferences/trip-preferences.component';
import { FrenchDatePipe } from '../../../core/pipes/french-date.pipe';

@Component({
  selector: 'app-trip-edit',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, TripPreferencesComponent, FrenchDatePipe],
  templateUrl: './trip-edit.component.html',
  styleUrls: ['./trip-edit.component.css']
})
export class TripEditComponent implements OnInit {

  tripId   = '';
  trip:    Trip | null = null;
  loading  = true;
  saving   = false;
  errorMessage: string | null = null;

  form: UpdateTripRequest = {};
  preferences: TripPreferences = {
    music: false, smoking: false, pets: false,
    talking: false, airConditioning: false,
    smallLuggage: false, largeLuggage: false
  };

  departureTimeLocal = '';
  confirmedCount = 0;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private tripService: TripService
  ) {}

  ngOnInit() {
    this.tripId = this.route.snapshot.paramMap.get('id') || '';
    this.load();
  }

  load() {
    this.loading = true;
    this.tripService.getById(this.tripId).subscribe({
      next: r => {
        this.trip = r.data!;
        this.confirmedCount = this.trip.passengers
          .filter(p => p.bookingStatus === 'CONFIRMED' || p.bookingStatus === 'PENDING')
          .reduce((sum) => sum + 1, 0);

        this.form = {
          departureCity:    this.trip.departureCity,
          arrivalCity:      this.trip.arrivalCity,
          departureAddress: this.trip.departureAddress,
          arrivalAddress:   this.trip.arrivalAddress,
          departureTime:    this.trip.departureTime,
          totalSeats:       this.trip.totalSeats,
          pricePerSeat:     this.trip.pricePerSeat,
          currency:         this.trip.currency,
          description:      this.trip.description,
        };

        // Convertir ISO → format datetime-local (yyyy-MM-ddTHH:mm)
        const d = new Date(this.trip.departureTime);
        const pad = (n: number) => String(n).padStart(2, '0');
        this.departureTimeLocal =
          `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;

        if (this.trip.preferences) {
          this.preferences = { ...this.trip.preferences };
        }

        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
  }

  save() {
    if (!this.trip) return;
    this.saving = true;
    this.errorMessage = null;

    // Reconvertir datetime-local → ISO
    if (this.departureTimeLocal) {
      this.form.departureTime = new Date(this.departureTimeLocal).toISOString();
    }
    this.form.preferences = this.preferences;

    // Validation locale : places >= réservations actives
    if (this.form.totalSeats! < this.confirmedCount) {
      this.errorMessage = `Impossible de réduire à ${this.form.totalSeats} places : ${this.confirmedCount} réservation(s) active(s).`;
      this.saving = false;
      return;
    }

    this.tripService.update(this.tripId, this.form).subscribe({
      next: () => {
        this.saving = false;
        this.router.navigate(['/trips', this.tripId]);
      },
      error: err => {
        this.errorMessage = err.error?.message || 'Une erreur est survenue lors de la modification.';
        this.saving = false;
      }
    });
  }

  cancel() {
    this.router.navigate(['/trips', this.tripId]);
  }
}
