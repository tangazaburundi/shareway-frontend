import { Component, inject, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { LanguageService } from '../../core/services/language.service';
import { AuthService } from '../../core/services/auth.service';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink, FormsModule, CommonModule],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {
  langService = inject(LanguageService);
  private router = inject(Router);
  private http = inject(HttpClient);
  authService = inject(AuthService);

  from = '';
  to = '';
  date = '';

  testimonials = [
    { index: 0, avatar: 'E', rating: 5 },
    { index: 1, avatar: 'C', rating: 5 },
    { index: 2, avatar: 'S', rating: 4 },
  ];

  stats: any = null;
  showStats = false;

  ngOnInit() {
    this.loadStats();
  }

  search(): void {
    if (this.from || this.to || this.date) {
      this.router.navigate(['/trips'], {
        queryParams: { from: this.from, to: this.to, date: this.date }
      });
    }
  }

  private loadStats() {
    this.http.get(`${environment.apiUrl}/public/stats`).subscribe({
      next: (res: any) => {
        this.stats = res?.data ?? res;
        const isAdmin = this.authService.currentUser()?.systemRole === 'SUPER_ADMIN' ||
                        this.authService.currentUser()?.systemRole === 'ADMIN';
        if (isAdmin) {
          this.showStats = true;
        } else if (this.stats?.showHomepageStats) {
          this.showStats = true;
        }
      },
      error: () => {}
    });
  }
}
