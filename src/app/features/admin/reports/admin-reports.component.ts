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
  styles: [`
    .page { padding: 2rem; max-width: 1100px; margin: 0 auto; }
    .page-header { margin-bottom: 1.25rem; }
    h1 { font-size: 1.4rem; font-weight: 700; margin: 0; }
    .loading { color: #64748b; padding: 2rem 0; }
    .empty { text-align: center; padding: 3rem; color: #64748b; background: #fff; border-radius: 12px; border: 1px solid #e5e7eb; }

    .filters { display: flex; gap: .5rem; margin-bottom: 1.25rem; flex-wrap: wrap; }
    .filter-btn { padding: .4rem .9rem; border-radius: 20px; border: 1.5px solid #e5e7eb; background: #fff; font-size: .8rem; cursor: pointer; }
    .filter-btn.active { background: #4f46e5; color: #fff; border-color: #4f46e5; }

    .table-wrap { background: #fff; border-radius: 12px; border: 1px solid #e5e7eb; overflow: hidden; }
    table { width: 100%; border-collapse: collapse; }
    th { padding: .875rem 1rem; font-size: .75rem; font-weight: 600; color: #64748b; text-transform: uppercase; background: #f8fafc; }
    td { padding: .875rem 1rem; border-top: 1px solid #f1f5f9; font-size: .875rem; vertical-align: middle; }
    .muted { color: #9ca3af; font-size: .8rem; }

    .type-pill { background: #ede9fe; color: #5b21b6; padding: .15rem .5rem; border-radius: 4px; font-size: .72rem; font-weight: 600; margin-right: .35rem; }
    .status-pill { padding: .2rem .6rem; border-radius: 20px; font-size: .75rem; font-weight: 600; }
    .s-pending   { background: #fef3c7; color: #92400e; }
    .s-reviewed  { background: #d1fae5; color: #065f46; }
    .s-dismissed { background: #f3f4f6; color: #374151; }
    .s-actioned  { background: #fee2e2; color: #991b1b; }

    .action-row { display: flex; gap: .35rem; }
    .btn-sm { padding: .25rem .7rem; border-radius: 6px; border: none; font-size: .78rem; font-weight: 600; cursor: pointer; }
    .btn-sm.green  { background: #d1fae5; color: #065f46; }
    .btn-sm.orange { background: #fef3c7; color: #92400e; }
    .btn-sm.red    { background: #fee2e2; color: #991b1b; }
    .btn-sm:hover  { filter: brightness(.93); }

    .pagination { display: flex; align-items: center; justify-content: center; gap: 1rem; padding: 1.25rem 0; font-size: .875rem; }
    .pagination button { padding: .4rem .9rem; border-radius: 6px; border: 1.5px solid #e5e7eb; background: #fff; cursor: pointer; }
    .pagination button:disabled { opacity: .4; }

    .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,.5); z-index: 100; display: flex; align-items: center; justify-content: center; padding: 1rem; }
    .modal { background: #fff; border-radius: 12px; padding: 2rem; width: 100%; max-width: 460px; }
    .modal h2 { margin: 0 0 .75rem; font-size: 1.1rem; }
    .modal p { color: #555; margin-bottom: 1rem; }
    .field { margin-bottom: 1rem; }
    .field label { display: block; font-size: .85rem; font-weight: 600; margin-bottom: .4rem; }
    .field textarea { width: 100%; padding: .7rem; border: 1.5px solid #e5e7eb; border-radius: 8px; font-size: .9rem; box-sizing: border-box; }
    .error-box { background: #fef2f2; border: 1px solid #fecaca; color: #b91c1c; padding: .7rem; border-radius: 8px; font-size: .85rem; margin-bottom: .75rem; }
    .modal-actions { display: flex; gap: .75rem; justify-content: flex-end; }
    .btn-outline { padding: .5rem 1rem; border-radius: 8px; border: 1.5px solid #e5e7eb; background: #fff; cursor: pointer; font-size: .875rem; }
    .btn-primary { padding: .5rem 1.25rem; border-radius: 8px; background: #4f46e5; color: #fff; border: none; font-size: .875rem; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: .5rem; }
    .btn-primary:disabled { opacity: .6; cursor: not-allowed; }
    .spin { width: 12px; height: 12px; border: 2px solid rgba(255,255,255,.4); border-top-color: #fff; border-radius: 50%; animation: spin .7s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
  `]
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
