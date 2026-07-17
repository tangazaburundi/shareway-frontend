import { Component, OnInit, signal, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { LanguageService } from '../../core/services/language.service';
import { UserService, PassengerDashboard } from '../../core/services/user.service';

@Component({
  selector: 'app-passenger-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './passenger-dashboard.component.html',
  styleUrl: './passenger-dashboard.component.css'
})
export class PassengerDashboardComponent implements OnInit {
  loading = signal(true);
  langService = inject(LanguageService);
  dash = signal<PassengerDashboard | null>(null);

  currencyEntries = computed(() => {
    const d = this.dash();
    if (!d?.totalSpentByCurrency) return [];
    return Object.entries(d.totalSpentByCurrency).map(([key, value]) => ({ key, value }));
  });

  maxCurrency = computed(() => {
    const entries = this.currencyEntries();
    if (!entries.length) return 1;
    return Math.max(...entries.map(e => e.value), 1);
  });

  constructor(private userService: UserService) {}

  ngOnInit() {
    this.userService.getPassengerDashboard().subscribe({
      next: (res) => {
        this.dash.set(res.data ?? null);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  barHeight(value: number, max: number): number {
    return Math.max(5, (value / max) * 100);
  }
}
