import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { TripService } from '../../core/services/trip.service';
import { Trip } from '../../core/models/trip.model';
import { LanguageService } from '../../core/services/language.service';

@Component({ selector: 'app-share', standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './share.component.html', styleUrls: ['./share.component.css'] })
export class ShareComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private tripService = inject(TripService);
  langService = inject(LanguageService);
  trip: Trip | null = null; loading = true;

  ngOnInit() {
    const token = this.route.snapshot.paramMap.get('token')!;
    this.tripService.getByShareToken(token).subscribe({
      next: (res) => { this.trip = res.data!; this.loading = false; },
      error: () => { this.loading = false; }
    });
  }
}