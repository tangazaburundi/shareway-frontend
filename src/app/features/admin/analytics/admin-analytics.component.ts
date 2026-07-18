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
              <span class="kpi-value">{{ stats()?.anonymousVisitors ?? 0 }}</span>
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
                    <span *ngIf="v.userFirstName">{{ v.userFirstName }} {{ v.userLastName }}</span>
                    <span *ngIf="!v.userFirstName" class="anonymous-badge">{{ langService.t('admin.analytics.anonymousUser') || 'Anonyme' }}</span>
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
  styles: [`
    :host { display: block; }

    .analytics-page {
      padding: 24px;
      max-width: 1400px;
      margin: 0 auto;
    }

    .page-header {
      margin-bottom: 28px;
    }

    .page-header h1 {
      font-size: 26px;
      font-weight: 700;
      color: #1a1a2e;
      margin: 0 0 4px;
    }

    .subtitle {
      color: #6b7280;
      font-size: 14px;
      margin: 0;
    }

    /* Loading */
    .loading-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 60px 0;
      color: #6b7280;
    }

    .spinner {
      width: 36px;
      height: 36px;
      border: 3px solid #e5e7eb;
      border-top-color: #1a8b82;
      border-radius: 50%;
      animation: spin 0.7s linear infinite;
      margin-bottom: 12px;
    }

    @keyframes spin { to { transform: rotate(360deg); } }

    /* KPI Grid */
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 16px;
      margin-bottom: 24px;
    }

    .kpi-card {
      background: #fff;
      border-radius: 12px;
      padding: 20px;
      display: flex;
      align-items: center;
      gap: 16px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04);
      transition: box-shadow 0.2s;
    }

    .kpi-card:hover {
      box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    }

    .kpi-icon {
      width: 48px;
      height: 48px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .kpi-icon i { width: 22px; height: 22px; color: #fff; }

    .bg-primary { background: #1a8b82; }
    .bg-blue { background: #3b82f6; }
    .bg-orange { background: #f59e0b; }
    .bg-green { background: #10b981; }
    .bg-red { background: #ef4444; }

    .kpi-info {
      display: flex;
      flex-direction: column;
    }

    .kpi-value {
      font-size: 24px;
      font-weight: 700;
      color: #1a1a2e;
      line-height: 1.2;
    }

    .kpi-label {
      font-size: 13px;
      color: #6b7280;
      margin-top: 2px;
    }

    /* Card */
    .card {
      background: #fff;
      border-radius: 12px;
      padding: 24px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04);
      margin-bottom: 24px;
    }

    .card-title {
      font-size: 16px;
      font-weight: 600;
      color: #1a1a2e;
      margin: 0 0 20px;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .card-title i { width: 20px; height: 20px; color: #1a8b82; }

    /* Bar Chart */
    .bar-chart {
      display: flex;
      align-items: flex-end;
      gap: 4px;
      height: 200px;
      padding-top: 24px;
    }

    .bar-col {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: flex-end;
      height: 100%;
      position: relative;
    }

    .bar-value {
      font-size: 10px;
      color: #6b7280;
      margin-bottom: 4px;
      opacity: 0;
      transition: opacity 0.2s;
    }

    .bar-col:hover .bar-value { opacity: 1; }

    .bar {
      width: 100%;
      max-width: 24px;
      background: linear-gradient(180deg, #1a8b82 0%, #15b8ae 100%);
      border-radius: 4px 4px 0 0;
      transition: height 0.4s ease;
      min-height: 2px;
    }

    .bar-label {
      font-size: 10px;
      color: #9ca3af;
      margin-top: 6px;
      text-align: center;
      white-space: nowrap;
    }

    /* Breakdown Grid */
    .breakdown-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 24px;
    }

    @media (max-width: 768px) {
      .breakdown-grid { grid-template-columns: 1fr; }
    }

    .breakdown-list {
      display: flex;
      flex-direction: column;
      gap: 14px;
    }

    .breakdown-row {}

    .breakdown-header {
      display: flex;
      justify-content: space-between;
      margin-bottom: 6px;
    }

    .breakdown-name {
      font-size: 14px;
      font-weight: 500;
      color: #374151;
    }

    .breakdown-count {
      font-size: 13px;
      font-weight: 600;
      color: #1a8b82;
    }

    .progress-track {
      width: 100%;
      height: 8px;
      background: #f3f4f6;
      border-radius: 4px;
      overflow: hidden;
    }

    .progress-fill {
      height: 100%;
      background: linear-gradient(90deg, #1a8b82, #15b8ae);
      border-radius: 4px;
      transition: width 0.5s ease;
    }

    .progress-fill-alt {
      background: linear-gradient(90deg, #3b82f6, #60a5fa);
    }

    /* Table */
    .table-card { padding-bottom: 16px; }

    .table-toolbar {
      margin-bottom: 16px;
    }

    .search-box {
      display: flex;
      align-items: center;
      gap: 8px;
      background: #f9fafb;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      padding: 8px 14px;
      max-width: 360px;
      transition: border-color 0.2s;
    }

    .search-box:focus-within {
      border-color: #1a8b82;
    }

    .search-box i { width: 18px; height: 18px; color: #9ca3af; }

    .search-box input {
      border: none;
      background: none;
      outline: none;
      font-size: 14px;
      width: 100%;
      color: #1a1a2e;
    }

    .table-wrapper {
      overflow-x: auto;
    }

    table {
      width: 100%;
      border-collapse: collapse;
    }

    th {
      text-align: left;
      font-size: 12px;
      font-weight: 600;
      color: #6b7280;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      padding: 10px 12px;
      border-bottom: 2px solid #f3f4f6;
      white-space: nowrap;
    }

    td {
      padding: 12px;
      font-size: 14px;
      color: #374151;
      border-bottom: 1px solid #f3f4f6;
      white-space: nowrap;
    }

    tr:hover td {
      background: #f9fafb;
    }

    .url-cell {
      max-width: 220px;
      overflow: hidden;
      text-overflow: ellipsis;
      color: #6b7280;
      font-size: 13px;
    }

    .anonymous-badge {
      color: #9ca3af;
      font-style: italic;
    }

    .cookie-badge {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      font-size: 12px;
      font-weight: 500;
      padding: 3px 8px;
      border-radius: 6px;
    }

    .cookie-badge i { width: 14px; height: 14px; }

    .cookie-badge.accepted {
      background: #ecfdf5;
      color: #059669;
    }

    .cookie-badge.rejected {
      background: #fef2f2;
      color: #dc2626;
    }

    .cookie-badge.pending {
      color: #9ca3af;
    }

    .empty-text {
      text-align: center;
      color: #9ca3af;
      padding: 24px;
      font-size: 14px;
    }

    /* Pagination */
    .pagination {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 16px;
      padding-top: 16px;
      border-top: 1px solid #f3f4f6;
      margin-top: 8px;
    }

    .btn-page {
      width: 36px;
      height: 36px;
      display: flex;
      align-items: center;
      justify-content: center;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      background: #fff;
      cursor: pointer;
      transition: all 0.2s;
    }

    .btn-page:hover:not(:disabled) {
      border-color: #1a8b82;
      color: #1a8b82;
    }

    .btn-page:disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }

    .btn-page i { width: 18px; height: 18px; }

    .page-info {
      font-size: 13px;
      color: #6b7280;
    }

    /* Responsive */
    @media (max-width: 640px) {
      .analytics-page { padding: 16px; }

      .kpi-grid {
        grid-template-columns: 1fr 1fr;
      }

      .bar-chart { height: 140px; }
    }
  `]
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
      next: (data: any) => {
        this.stats.set(data);

        const days = data?.last30Days ?? [];
        const mapped = days.map((d: any) => ({
          date: d.date,
          dateShort: this.shortDate(d.date),
          count: d.count ?? 0
        }));
        this.last30Days.set(mapped);
        this.maxDayCount.set(Math.max(1, ...mapped.map((d: any) => d.count)));

        this.byCountry.set(data?.byCountry ?? []);
        this.byCity.set(data?.byCity ?? []);

        this.loading.set(false);
      },
      error: () => this.loading.set(false)
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
