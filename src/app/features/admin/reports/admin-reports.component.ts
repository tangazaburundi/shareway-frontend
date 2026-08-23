import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService, ReportRow } from '../../../core/services/admin.service';

@Component({
  selector: 'app-admin-reports',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page">
      <div class="page-header">
        <h1>🚩 Signalements</h1>
      </div>

      <!-- Filtres -->
      <div class="filters">
        <button *ngFor="let s of statusOptions" class="filter-btn"
                [class.active]="filterStatus === s.val"
                (click)="filterStatus = s.val; page = 0; load()">
          {{ s.label }}
        </button>
      </div>

      <div *ngIf="loading" class="loading">Chargement…</div>
      <div *ngIf="!loading && reports.length === 0" class="empty">Aucun signalement {{ filterStatus ? 'avec ce statut' : '' }}.</div>

      <div class="table-wrap" *ngIf="!loading && reports.length > 0">
        <table>
          <thead>
            <tr>
              <th>Signaleur</th>
              <th>Cible</th>
              <th>Raison</th>
              <th>Statut</th>
              <th>Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let r of reports">
              <td>{{ r.reporter?.firstName }} {{ r.reporter?.lastName }}</td>
              <td>
                <span class="type-pill">{{ r.targetType }}</span>
                <span class="muted">{{ r.targetId | slice:0:8 }}…</span>
              </td>
              <td>{{ reasonLabel(r.reason) }}</td>
              <td><span class="status-pill" [class]="'s-' + r.status.toLowerCase()">{{ statusLabel(r.status) }}</span></td>
              <td class="muted">{{ r.createdAt | date:'dd/MM/yy HH:mm' }}</td>
              <td>
                <div class="action-row" *ngIf="r.status === 'PENDING'">
                  <button class="btn-sm green" (click)="openAction(r, 'REVIEWED')">✅ Traité</button>
                  <button class="btn-sm orange" (click)="openAction(r, 'DISMISSED')">🙈 Ignorer</button>
                  <button class="btn-sm red" (click)="openAction(r, 'ACTIONED')">🚫 Sanctionner</button>
                </div>
                <span *ngIf="r.status !== 'PENDING'" class="muted">—</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div class="pagination" *ngIf="totalPages > 1">
        <button [disabled]="page === 0" (click)="prev()">←</button>
        <span>{{ page + 1 }} / {{ totalPages }}</span>
        <button [disabled]="page >= totalPages - 1" (click)="next()">→</button>
      </div>

      <!-- Modal action -->
      <div *ngIf="showModal" class="modal-overlay" (click)="closeModal()">
        <div class="modal" (click)="$event.stopPropagation()">
          <h2>Traiter le signalement</h2>
          <p>Action : <strong>{{ pendingAction }}</strong></p>
          <div class="field">
            <label>Action entreprise (optionnel)</label>
            <textarea [(ngModel)]="actionTaken" rows="3" placeholder="Ex : Compte bloqué, avis supprimé…"></textarea>
          </div>
          <div *ngIf="modalError" class="error-box">❌ {{ modalError }}</div>
          <div class="modal-actions">
            <button class="btn-outline" (click)="closeModal()">Annuler</button>
            <button class="btn-primary" (click)="confirmAction()" [disabled]="acting">
              <span *ngIf="acting" class="spin"></span>
              Confirmer
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./admin-reports.component.css']
})
export class AdminReportsComponent implements OnInit {
  reports:      ReportRow[] = [];
  loading       = false;
  filterStatus  = '';
  page          = 0;
  totalPages    = 1;
  acting        = false;
  showModal     = false;
  pendingReport: ReportRow | null = null;
  pendingAction  = '';
  actionTaken    = '';
  modalError:    string | null = null;

  statusOptions = [
    { val: '', label: 'Tous' },
    { val: 'PENDING',   label: '⏳ En attente' },
    { val: 'REVIEWED',  label: '✅ Traité' },
    { val: 'DISMISSED', label: '🙈 Ignoré' },
    { val: 'ACTIONED',  label: '🚫 Sanctionné' },
  ];

  constructor(private svc: AdminService) {}
  ngOnInit() { this.load(); }

  load() {
    this.loading = true;
    this.svc.getReports(this.filterStatus || undefined, this.page).subscribe({
      next: r => { this.reports = r.data?.content ?? []; this.totalPages = r.data?.totalPages ?? 1; this.loading = false; },
      error: () => { this.loading = false; }
    });
  }

  openAction(r: ReportRow, action: string) {
    this.pendingReport = r; this.pendingAction = action;
    this.actionTaken = ''; this.modalError = null; this.showModal = true;
  }
  closeModal() { this.showModal = false; this.pendingReport = null; }

  confirmAction() {
    if (!this.pendingReport) return;
    this.acting = true; this.modalError = null;
    this.svc.reviewReport(this.pendingReport.id, this.pendingAction, this.actionTaken || undefined).subscribe({
      next: (r: any) => {
        const idx = this.reports.findIndex(x => x.id === this.pendingReport!.id);
        if (idx >= 0 && r.data) this.reports[idx] = r.data;
        this.acting = false; this.closeModal();
      },
      error: (err: any) => { this.modalError = err.error?.message || 'Erreur'; this.acting = false; }
    });
  }

  prev() { if (this.page > 0) { this.page--; this.load(); } }
  next() { if (this.page < this.totalPages - 1) { this.page++; this.load(); } }

  reasonLabel(r: string) {
    const m: Record<string,string> = { SPAM:'Spam', HARASSMENT:'Harcèlement', INAPPROPRIATE_CONTENT:'Contenu inapproprié', FRAUD:'Fraude', FAKE_PROFILE:'Faux profil', DANGEROUS_DRIVING:'Conduite dangereuse', OTHER:'Autre' };
    return m[r] ?? r;
  }
  statusLabel(s: string) {
    const m: Record<string,string> = { PENDING:'En attente', REVIEWED:'Traité', DISMISSED:'Ignoré', ACTIONED:'Sanctionné' };
    return m[s] ?? s;
  }
}
