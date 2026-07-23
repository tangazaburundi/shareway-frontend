import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { TripService } from '../../../core/services/trip.service';
import { LanguageService } from '../../../core/services/language.service';
import { Currency, WeekDay } from '../../../core/models/trip.model';
import { CurrencySelectorComponent } from '../../../shared/components/currency-selector/currency-selector.component';

@Component({ selector: 'app-trip-create', standalone: true,
  imports: [ReactiveFormsModule, FormsModule, CommonModule, RouterLink, CurrencySelectorComponent],
  templateUrl: './trip-create.component.html', styleUrls: ['./trip-create.component.css'] })
export class TripCreateComponent {
  private fb = inject(FormBuilder);
  private tripService = inject(TripService);
  private router = inject(Router);
  langService = inject(LanguageService);

  selectedCurrency: Currency = 'FBU';
  weekDays: WeekDay[] = ['MON','TUE','WED','THU','FRI','SAT','SUN'];
  selectedDays: WeekDay[] = [];
  prefKeys = ['music','smoking','pets','talking','ac','largeLuggage','smallLuggage'];
  stops: { city: string; address: string }[] = [];

  form = this.fb.group({
    departureCity: ['', Validators.required], arrivalCity: ['', Validators.required],
    departureAddress: [''], arrivalAddress: [''],
    departureTime: ['', Validators.required], arrivalTime: [''],
    totalSeats: [2, [Validators.required, Validators.min(1), Validators.max(8)]],
    pricePerSeat: [0, [Validators.required, Validators.min(0.01)]],
    description: [''], isRecurring: [false],
    frequency: ['WEEKLY'], recurringEndDate: [''],
    pref_music: [false], pref_smoking: [false], pref_pets: [false], pref_talking: [true],
    pref_ac: [false],
    pref_largeLuggage: [false],  pref_smallLuggage: [false],
  });

  loading = false; error = '';

  isInvalid(f: string): boolean { const c = this.form.get(f); return !!(c?.invalid && c?.touched); }
  isDaySelected(d: WeekDay): boolean { return this.selectedDays.includes(d); }
  toggleDay(d: WeekDay): void {
    this.selectedDays = this.isDaySelected(d) ? this.selectedDays.filter(x => x !== d) : [...this.selectedDays, d];
  }
  addStop(): void { this.stops.push({ city: '', address: '' }); }
  removeStop(i: number): void { this.stops.splice(i, 1); }

  submit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.loading = true; this.error = '';
    const v = this.form.value;
    const payload: any = {
      departureCity: v.departureCity, arrivalCity: v.arrivalCity,
      departureAddress: v.departureAddress, arrivalAddress: v.arrivalAddress,
      departureTime: v.departureTime, arrivalTime: v.arrivalTime,
      totalSeats: v.totalSeats, pricePerSeat: v.pricePerSeat, currency: this.selectedCurrency,
      description: v.description, isRecurring: v.isRecurring, frequency: v.frequency,
      recurringDays: this.selectedDays, recurringEndDate: v.recurringEndDate,
      stopPoints: this.stops.filter(s => s.city).map((s, i) => ({ ...s, order: i + 1 })),
      preferences: {
         music: v.pref_music,
         smoking: v.pref_smoking,
         pets: v.pref_pets,
         talking: v.pref_talking,
         airConditioning: v.pref_ac,
         largeLuggage: v.pref_largeLuggage,
         smallLuggage: v.pref_smallLuggage
      }
    };
    this.tripService.create(payload).subscribe({
      next: (res) => this.router.navigate(['/trips', res.data!.id]),
      error: (err) => { this.error = err.error?.message || 'Erreur'; this.loading = false; }
    });
  }
}