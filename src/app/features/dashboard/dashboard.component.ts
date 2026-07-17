
import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AdminService } from '../../core/services/admin.service';
import { DashboardStats } from '../../core/models/user.model';
import { LanguageService } from '../../core/services/language.service';
import { Trip } from '../../core/models/trip.model';
import { AuthService } from '../../core/services/auth.service';
import { TripService } from '../../core/services/trip.service';
import { UserService } from '../../core/services/user.service';


@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
   CommonModule,RouterLink
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit {
  loading = signal(true);
  langService = inject(LanguageService);
  auth = inject(AuthService);
  userService = inject(UserService);
  stats = signal<DashboardStats | null>(null);
  private tripService = inject(TripService);
  myTrips: Trip[] = [];
  maxUserGrowth = signal(1);
  maxRidesGrowth = signal(1);

  constructor(private adminService: AdminService) {}

   ngOnInit() {
        this.userService.getDashboardStats().subscribe({
         next: (res) => {
          const data: DashboardStats = res?.data ?? res;

          this.loading.set(false)
          this.stats.set(data);
         },
         error: () => { this.loading.set(false) }
      });

       this.tripService.getMyTrips().subscribe({ next: (res) => { this.myTrips = res.data || []; } });
   }

     barHeight1(amount: number): number {
        //if (!this.stats()?.monthlyEarnings.length) return 0;
        //const max = Math.max(...this.stats()?.monthlyEarnings.map((m: any) => m.amount), 1);
        const stats = this.stats();
        const earnings = stats?.monthlyEarnings ?? [];

        if (!earnings.length) return 0;

        const max = Math.max(...earnings.map(m => m.amount), 1);
         return (amount / max) * 100;
    }

     get currencyEntries() {
    	  const stats = this.stats();
    	  if (!stats?.earningsByCurrency) return [];

    	  const entries = Object.entries(stats.earningsByCurrency);
    	  const max = Math.max(...entries.map(([, v]) => Number(v)), 1);

    	  return entries.map(([key, value]) => ({
    		key,
    		value,
    		pct: (Number(value) / max) * 100,
    	  }));

     }

       barHeight(value: number, max: number): number {
           return Math.max(5, (value / max) * 100);
        }

}
