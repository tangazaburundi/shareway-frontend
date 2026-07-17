import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { TripService } from '../../../core/services/trip.service';
import { Trip, Currency } from '../../../core/models/trip.model';
import { RatingStarsComponent } from '../../../shared/components/rating-stars/rating-stars.component';
import { CurrencySelectorComponent } from '../../../shared/components/currency-selector/currency-selector.component';
import { LanguageService } from '../../../core/services/language.service';

@Component({ selector: 'app-trip-search', standalone: true,
  imports: [ReactiveFormsModule, FormsModule, CommonModule, RouterLink, RatingStarsComponent, CurrencySelectorComponent],
  templateUrl: './trip-search.component.html', styleUrls: ['./trip-search.component.css'] })
export class TripSearchComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private tripService = inject(TripService);
  private fb = inject(FormBuilder);
  langService = inject(LanguageService);

  searchForm = this.fb.group({ departureCity: [''], arrivalCity: [''], date: [''], seats: [1], maxPrice: [null] });
  trips: Trip[] = []; loading = false; searched = false; showFilters = false;
  filterCurrency: Currency = 'FBU'; minRating = 0; timeFrom = ''; timeTo = '';
  prefFilters: Record<string, boolean> = { music: false, smoking: false, pets: false };

  ngOnInit(): void {
    this.route.queryParams.subscribe(p => {
      if (p['from'] || p['to'] || p['date'])
      this.searchForm.patchValue({ departureCity: p['from'], arrivalCity: p['to'], date: p['date'] });
      if (p['from'] || p['to'] || p['date']) this.search();
    });
  }

  search(): void {
    const { departureCity, arrivalCity, date, seats, maxPrice } = this.searchForm.value;
    //if (!departureCity && !arrivalCity ) return;
    this.loading = true; this.searched = true;
    this.tripService.search({
      departureCity: departureCity!, arrivalCity: arrivalCity!, date: date!, seats: seats || 1,
      maxPrice: maxPrice || undefined, currency: this.filterCurrency,
      minRating: this.minRating || undefined,
      departureTime: this.timeFrom || undefined, arrivalTime: this.timeTo || undefined,
      music: this.prefFilters['music'] || undefined,
      smoking: this.prefFilters['smoking'] || undefined,
      pets: this.prefFilters['pets'] || undefined,
    }).subscribe({
      next: (res) => { this.trips = res.data?.content || []; this.loading = false; },
      error: () => { this.loading = false; }
    });
  }

  resetFilters(): void {
    this.filterCurrency = 'FBU'; this.minRating = 0; this.timeFrom = ''; this.timeTo = '';
    this.prefFilters = { music: false, smoking: false, pets: false };
    this.searchForm.patchValue({ maxPrice: null });
  }
}