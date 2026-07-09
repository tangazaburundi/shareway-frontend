import { Component, signal,OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AdminService } from '../../../core/services/admin.service';
import { DashboardStats } from '../../../core/models/user.model';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './admin-dashboard.component.html',
  styleUrl: './admin-dashboard.component.css'
})
export class AdminDashboardComponent implements OnInit {
  stats = signal<DashboardStats | null>(null);
  loading = signal(true);;
  section = 'dashboard';
  maxUserGrowth = signal(1);
  maxRidesGrowth = signal(1);

  constructor(public adminService: AdminService, private router: Router) {}

/*   ngOnInit() {
    this.admin.getDashboard().subscribe({
      next: r => { this.stats = r ?? {}; this.loading = false; },
      error: () => { this.loading = false; }
    });
  } */

  ngOnInit() {
      this.adminService.getDashboard().subscribe({
          next: (response: any) => {
              const data: DashboardStats = response?.data ?? response;
              console.error('data 1',data);
              this.stats.set(data);

              if (data.userGrowth?.length) {
                  this.maxUserGrowth.set(Math.max(...data.userGrowth.map((p: any) => p.count)) || 1);
              }

              if (data.ridesGrowth?.length) {
                  this.maxRidesGrowth.set(Math.max(...data.ridesGrowth.map((p: any) => p.count)) || 1);
              }

             this.loading.set(false);
         },
        error: () => this.loading.set(false)
      });

  }

  logout() {
    this.adminService.logout();
    this.router.navigate(['/admin/login']);
  }

  exportCsv() {
    this.adminService.exportUsersCsv().subscribe(blob => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = 'users.csv'; a.click();
      window.URL.revokeObjectURL(url);
    });
  }

  barHeight(value: number, max: number): number {
    return Math.max(5, (value / max) * 100);
  }

}
