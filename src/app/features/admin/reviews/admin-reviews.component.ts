import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminService, ReviewRow } from '../../../core/services/admin.service';

@Component({
  selector: 'app-admin-reviews',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="page">
      <div class="page-header">
        <h1>⭐ Modération des avis</h1>
        <p class="sub">Avis signalés en attente de validation</p>
      </div>

      <div *ngIf="loading" class="loading">Chargement…</div>

      <div *ngIf="!loading && reviews.length === 0" class="empty">
        ✅ Aucun avis signalé en attente de modération.
      </div>

      <div class="cards">
        <div *ngFor="let r of reviews" class="review-card">

          <div class="review-header">
            <div class="author-info">
              <div class="avatar">{{ r.author.firstName[0] }}</div>
              <div>
                <strong>{{ r.author.firstName }} {{ r.author.lastName }}</strong>
                <div class="type-badge">{{ typeLabel(r.type) }}</div>
              </div>
            </div>
            <div class="stars">
              <span *ngFor="let s of [1,2,3,4,5]" [class.filled]="s <= r.rating">★</span>
            </div>
          </div>

          <p class="comment">{{ r.comment || '(Pas de commentaire)' }}</p>

          <div class="review-meta">
            <span class="trip-link">Trajet : {{ r.tripId | slice:0:8 }}…</span>
            <span>{{ r.createdAt | date:'dd/MM/yyyy HH:mm' }}</span>
          </div>

          <div class="review-actions">
            <button class="btn-approve" (click)="approve(r)" [disabled]="acting === r.id">
              <span *ngIf="acting === r.id" class="spin"></span>
              ✅ Approuver
            </button>
            <button class="btn-reject" (click)="reject(r)" [disabled]="acting === r.id">
              <span *ngIf="acting === r.id" class="spin"></span>
              ❌ Rejeter / Masquer
            </button>
          </div>

          <div *ngIf="errors[r.id]" class="error-inline">❌ {{ errors[r.id] }}</div>
        </div>
      </div>

      <!-- Pagination -->
      <div *ngIf="!loading && totalPages > 1" class="pagination">
        <button [disabled]="page === 0" (click)="prev()">← Précédent</button>
        <span>Page {{ page + 1 }} / {{ totalPages }}</span>
        <button [disabled]="page >= totalPages - 1" (click)="next()">Suivant →</button>
      </div>
    </div>
  `,
  styles: [`
    .page { padding: 2rem; max-width: 900px; margin: 0 auto; }
    .page-header { margin-bottom: 1.5rem; }
    h1 { font-size: 1.4rem; font-weight: 700; margin: 0 0 .25rem; }
    .sub { color: #64748b; font-size: .875rem; margin: 0; }
    .loading { color: #64748b; padding: 2rem 0; }
    .empty { text-align: center; padding: 3rem; color: #64748b; background: #fff; border-radius: 12px; border: 1px solid #e5e7eb; }

    .cards { display: flex; flex-direction: column; gap: 1rem; }
    .review-card {
      background: #fff; border: 1.5px solid #fbbf24; border-radius: 12px; padding: 1.25rem;
    }
    .review-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: .75rem; }
    .author-info { display: flex; align-items: center; gap: .75rem; }
    .avatar {
      width: 36px; height: 36px; border-radius: 50%; background: #4f46e5; color: #fff;
      display: flex; align-items: center; justify-content: center; font-weight: 700;
    }
    .type-badge { font-size: .75rem; color: #6b7280; margin-top: .1rem; }
    .stars span { color: #d1d5db; font-size: 1.1rem; }
    .stars span.filled { color: #f59e0b; }

    .comment { color: #374151; font-size: .9rem; margin: .75rem 0; line-height: 1.5; }
    .review-meta { display: flex; gap: 1rem; font-size: .8rem; color: #9ca3af; margin-bottom: .75rem; }

    .review-actions { display: flex; gap: .75rem; }
    .btn-approve, .btn-reject {
      padding: .5rem 1.25rem; border-radius: 8px; border: none;
      font-size: .875rem; font-weight: 600; cursor: pointer;
      display: flex; align-items: center; gap: .5rem; transition: opacity .15s;
    }
    .btn-approve { background: #d1fae5; color: #065f46; }
    .btn-approve:hover:not(:disabled) { background: #a7f3d0; }
    .btn-reject  { background: #fee2e2; color: #991b1b; }
    .btn-reject:hover:not(:disabled)  { background: #fecaca; }
    .btn-approve:disabled, .btn-reject:disabled { opacity: .6; cursor: not-allowed; }

    .error-inline { font-size: .8rem; color: #b91c1c; margin-top: .5rem; }

    .pagination {
      display: flex; align-items: center; justify-content: center; gap: 1rem;
      padding: 1.5rem 0; font-size: .875rem;
    }
    .pagination button {
      padding: .4rem .9rem; border-radius: 6px; border: 1.5px solid #e5e7eb;
      background: #fff; cursor: pointer;
    }
    .pagination button:disabled { opacity: .4; cursor: not-allowed; }

    .spin {
      width: 12px; height: 12px;
      border: 2px solid rgba(0,0,0,.2); border-top-color: currentColor;
      border-radius: 50%; animation: spin .7s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
  `]
})
export class AdminReviewsComponent implements OnInit {
  reviews:    ReviewRow[] = [];
  loading     = false;
  page        = 0;
  totalPages  = 1;
  acting:     string | null = null;
  errors:     Record<string, string> = {};

  constructor(private svc: AdminService) {}
  ngOnInit() { this.load(); }

  load() {
    this.loading = true;
    this.svc.getFlaggedReviews(this.page).subscribe({
      next: r => {
        this.reviews    = r.data?.content ?? [];
        this.totalPages = r.data?.totalPages ?? 1;
        this.loading    = false;
      },
      error: () => { this.loading = false; }
    });
  }

  approve(r: ReviewRow) {
    this.acting = r.id;
    this.svc.approveReview(r.id).subscribe({
      next: () => { this.reviews = this.reviews.filter(x => x.id !== r.id); this.acting = null; },
      error: err => { this.errors[r.id] = err.error?.message || 'Erreur'; this.acting = null; }
    });
  }

  reject(r: ReviewRow) {
    this.acting = r.id;
    this.svc.rejectReview(r.id).subscribe({
      next: () => { this.reviews = this.reviews.filter(x => x.id !== r.id); this.acting = null; },
      error: err => { this.errors[r.id] = err.error?.message || 'Erreur'; this.acting = null; }
    });
  }

  typeLabel(t: string) {
    return t === 'PASSENGER_TO_DRIVER' ? 'Passager → Conducteur' : 'Conducteur → Passager';
  }

  prev() { if (this.page > 0) { this.page--; this.load(); } }
  next() { if (this.page < this.totalPages - 1) { this.page++; this.load(); } }
}
