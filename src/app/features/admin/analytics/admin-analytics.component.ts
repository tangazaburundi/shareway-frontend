import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { VisitorService } from '../../../core/services/visitor.service';
import { LanguageService } from '../../../core/services/language.service';
import { LucideIconsDirective } from '../../../shared/directives/lucide-icons.directive';

@Component({
  selector: 'app-admin-analytics',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideIconsDirective],
  template: `
    <div class="analytics-page" lucideIcons>
      <!-- Header -->
      <div class="page-header">
        <div>
          <h1>{{ langService.t('admin.analytics.title') || 'Analytique' }}</h1>
          <p class="subtitle">{{ langService.t('admin.analytics.subtitle') || 'Statistiques des visites du site' }}</p>
        </div>
      </div>

      <!-- Loading -->
      <div *ngIf="loading()" class="loading-state">
        <div class="spinner"></div>
        <p>{{ langService.t('common.loading') || 'Chargement...' }}</p>
      </div>

      <ng-container *ngIf="!loading()">
        <!-- KPI Cards -->
        <div class="kpi-grid">
          <div class="kpi-card">
            <div class="kpi-icon bg-primary">
              <i data-lucide="eye"></i>
            </div>
            <div class="kpi-info">
              <span class="kpi-value">{{ stats()?.totalVisits ?? 0 }}</span>
              <span class="kpi-label">{{ langService.t('admin.analytics.totalVisits') || 'Total visites' }}</span>
            </div>
          </div>

          <div class="kpi-card">
            <div class="kpi-icon bg-blue">
              <i data-lucide="users"></i>
            </div>
            <div class="kpi-info">
              <span class="kpi-value">{{ stats()?.uniqueUsers ?? 0 }}</span>
              <span class="kpi-label">{{ langService.t('admin.analytics.uniqueUsers') || 'Utilisateurs uniques' }}</span>
            </div>
          </div>

          <div class="kpi-card">
            <div class="kpi-icon bg-orange">
              <i data-lucide="user-x"></i>
            </div>
            <div class="kpi-info">
              <span class="kpi-value">{{ stats()?.totalAnonymous ?? 0 }}</span>
              <span class="kpi-label">{{ langService.t('admin.analytics.anonymous') || 'Visiteurs anonymes' }}</span>
            </div>
          </div>

          <div class="kpi-card">
            <div class="kpi-icon bg-green">
              <i data-lucide="cookie"></i>
            </div>
            <div class="kpi-info">
              <span class="kpi-value">{{ stats()?.cookiesAccepted ?? 0 }}</span>
              <span class="kpi-label">{{ langService.t('admin.analytics.cookiesAccepted') || 'Cookies acceptés' }}</span>
            </div>
          </div>

          <div class="kpi-card">
            <div class="kpi-icon bg-red">
              <i data-lucide="shield-x"></i>
            </div>
            <div class="kpi-info">
              <span class="kpi-value">{{ stats()?.cookiesRejected ?? 0 }}</span>
              <span class="kpi-label">{{ langService.t('admin.analytics.cookiesRejected') || 'Cookies refusés' }}</span>
            </div>
          </div>
        </div>

        <!-- 30-Day Chart -->
        <div class="card chart-card">
          <h2 class="card-title">
            <i data-lucide="bar-chart-3"></i>
            {{ langService.t('admin.analytics.last30Days') || 'Visites des 30 derniers jours' }}
          </h2>
          <div class="bar-chart">
            <div
              *ngFor="let day of last30Days(); let i = index"
              class="bar-col"
              [title]="day.date + ': ' + day.count"
            >
              <div class="bar-value">{{ day.count }}</div>
              <div
                class="bar"
                [style.height.%]="barHeight(day.count, maxDayCount())"
              ></div>
              <div class="bar-label" *ngIf="i % 5 === 0 || i === last30Days().length - 1">
                {{ day.dateShort }}
              </div>
            </div>
          </div>
        </div>

        <!-- Country + City breakdown -->
        <div class="breakdown-grid">
          <!-- By Country -->
          <div class="card">
            <h2 class="card-title">
              <i data-lucide="globe"></i>
              {{ langService.t('admin.analytics.byCountry') || 'Par pays' }}
            </h2>
            <div class="breakdown-list">
              <div *ngFor="let c of byCountry()" class="breakdown-row">
                <div class="breakdown-header">
                  <span class="breakdown-name">{{ c.country || 'Inconnu' }}</span>
                  <span class="breakdown-count">{{ c.count }}</span>
                </div>
                <div class="progress-track">
                  <div
                    class="progress-fill"
                    [style.width.%]="countryPercent(c.count)"
                  ></div>
                </div>
              </div>
              <div *ngIf="byCountry().length === 0" class="empty-text">
                {{ langService.t('common.error') || 'Aucune donnée' }}
              </div>
            </div>
          </div>

          <!-- By City -->
          <div class="card">
            <h2 class="card-title">
              <i data-lucide="map-pin"></i>
              {{ langService.t('admin.analytics.byCity') || 'Par ville' }}
            </h2>
            <div class="breakdown-list">
              <div *ngFor="let c of byCity()" class="breakdown-row">
                <div class="breakdown-header">
                  <span class="breakdown-name">{{ c.city || 'Inconnu' }}</span>
                  <span class="breakdown-count">{{ c.count }}</span>
                </div>
                <div class="progress-track">
                  <div
                    class="progress-fill progress-fill-alt"
                    [style.width.%]="cityPercent(c.count)"
                  ></div>
                </div>
              </div>
              <div *ngIf="byCity().length === 0" class="empty-text">
                {{ langService.t('common.error') || 'Aucune donnée' }}
              </div>
            </div>
          </div>
        </div>

        <!-- Visitor Table -->
        <div class="card table-card">
          <h2 class="card-title">
            <i data-lucide="list"></i>
            {{ langService.t('admin.analytics.recentVisits') || 'Visites récentes' }}
          </h2>

          <div class="table-toolbar">
            <div class="search-box">
              <i data-lucide="search"></i>
              <input
                type="text"
                [(ngModel)]="search"
                [placeholder]="langService.t('admin.analytics.searchPlaceholder') || 'Rechercher un visiteur...'"
                (ngModelChange)="onSearch()"
              />
            </div>
          </div>

          <div class="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>{{ langService.t('admin.analytics.date') || 'Date' }}</th>
                  <th>{{ langService.t('admin.analytics.user') || 'Utilisateur' }}</th>
                  <th>{{ langService.t('admin.analytics.email') || 'Email' }}</th>
                  <th>{{ langService.t('admin.analytics.page') || 'Page visitée' }}</th>
                  <th>{{ langService.t('admin.analytics.cookies') || 'Cookies' }}</th>
                  <th>{{ langService.t('admin.analytics.country') || 'Pays' }}</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let v of visitors()">
                  <td>{{ v.visitedAt | date:'dd/MM/yyyy HH:mm' }}</td>
                  <td>
                    <span *ngIf="v.userName">{{ v.userName }}</span>
                    <span *ngIf="!v.userName" class="anonymous-badge">{{ langService.t('admin.analytics.anonymousUser') || 'Anonyme' }}</span>
                  </td>
                  <td>{{ v.userEmail || '—' }}</td>
                  <td class="url-cell">{{ v.pageUrl }}</td>
                  <td>
                    <span *ngIf="v.acceptedCookies === true" class="cookie-badge accepted">
                      <i data-lucide="check-circle"></i>
                      {{ langService.t('admin.analytics.accepted') || 'Accepté' }}
                    </span>
                    <span *ngIf="v.acceptedCookies === false" class="cookie-badge rejected">
                      <i data-lucide="x-circle"></i>
                      {{ langService.t('admin.analytics.rejected') || 'Refusé' }}
                    </span>
                    <span *ngIf="v.acceptedCookies == null" class="cookie-badge pending">—</span>
                  </td>
                  <td>{{ v.country || '—' }}</td>
                </tr>
                <tr *ngIf="visitors().length === 0">
                  <td colspan="6" class="empty-text">
                    {{ langService.t('admin.analytics.noVisits') || 'Aucune visite trouvée' }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Pagination -->
          <div class="pagination">
            <button class="btn-page" [disabled]="page() === 0" (click)="prevPage()">
              <i data-lucide="chevron-left"></i>
            </button>
            <span class="page-info">{{ page() + 1 }} / {{ totalPages() }}</span>
            <button class="btn-page" [disabled]="page() >= totalPages() - 1" (click)="nextPage()">
              <i data-lucide="chevron-right"></i>
            </button>
          </div>
        </div>
      </ng-container>
    </div>
  `,
  styleUrls: ['./admin-analytics.component.css']
})
export class AdminAnalyticsComponent implements OnInit {
  loading = signal(true);
  stats = signal<any>(null);
  last30Days = signal<{ date: string; dateShort: string; count: number }[]>([]);
  maxDayCount = signal(1);
  byCountry = signal<{ country: string; count: number }[]>([]);
  byCity = signal<{ city: string; count: number }[]>([]);

  visitors = signal<any[]>([]);
  page = signal(0);
  totalPages = signal(1);
  size = 20;
  search = '';
  private searchTimeout: any;

  constructor(
    private visitorService: VisitorService,
    public langService: LanguageService
  ) {}

  ngOnInit() {
    this.loadStats();
    this.loadVisitors();
  }

  private loadStats() {
    this.visitorService.getStats().subscribe({
      next: (res: any) => {
        const data = res?.data ?? res;

        this.stats.set(data);

        const days = data?.visitsByDay ?? {};
        const mapped = Object.entries(days).map(([date, count]) => ({
          date,
          dateShort: date,
          count: (count as number) ?? 0
        }));
        this.last30Days.set(mapped);
        this.maxDayCount.set(Math.max(1, ...mapped.map(d => d.count)));

        const countryMap = data?.visitsByCountry ?? {};
        this.byCountry.set(
          Object.entries(countryMap).map(([country, count]) => ({ country, count: count as number }))
        );

        const cityMap = data?.visitsByCity ?? {};
        this.byCity.set(
          Object.entries(cityMap).map(([city, count]) => ({ city, count: count as number }))
        );

        this.loading.set(false);
      },
      error: (err) => {
        console.error('loadStats error:', err);
        this.loading.set(false);
      }
    });
  }

  private loadVisitors() {
    this.visitorService.getVisitors(this.page(), this.size, this.search).subscribe({
      next: (res: any) => {
        const content = res?.data?.content ?? res?.content ?? res ?? [];
        const totalElements = res?.data?.totalElements ?? res?.totalElements ?? 0;
        const tPages = res?.data?.totalPages ?? res?.totalPages ?? 1;
        this.visitors.set(
          (content || []).filter((v: any) => v.userEmail !== 'sharewaybdi@gmail.com')
        );
        this.totalPages.set(tPages || 1);
      },
      error: () => {}
    });
  }

  barHeight(value: number, max: number): number {
    return max > 0 ? Math.max(3, (value / max) * 100) : 3;
  }

  countryPercent(count: number): number {
    const max = Math.max(...this.byCountry().map(c => c.count), 1);
    return (count / max) * 100;
  }

  cityPercent(count: number): number {
    const max = Math.max(...this.byCity().map(c => c.count), 1);
    return (count / max) * 100;
  }

  onSearch() {
    clearTimeout(this.searchTimeout);
    this.searchTimeout = setTimeout(() => {
      this.page.set(0);
      this.loadVisitors();
    }, 350);
  }

  prevPage() {
    if (this.page() > 0) {
      this.page.set(this.page() - 1);
      this.loadVisitors();
    }
  }

  nextPage() {
    if (this.page() < this.totalPages() - 1) {
      this.page.set(this.page() + 1);
      this.loadVisitors();
    }
  }

  private shortDate(dateStr: string): string {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return `${d.getDate()}/${d.getMonth() + 1}`;
  }
}
