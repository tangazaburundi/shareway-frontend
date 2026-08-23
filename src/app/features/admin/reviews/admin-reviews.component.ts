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
  styleUrls: ['./admin-reviews.component.css']
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
