import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminService, MessageRow } from '../../../core/services/admin.service';

@Component({
  selector: 'app-admin-messages',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="page">
      <div class="page-header">
        <h1>💬 Messages signalés</h1>
        <p class="sub">Messages signalés par les utilisateurs</p>
      </div>

      <div *ngIf="loading" class="loading">Chargement…</div>

      <div *ngIf="!loading && messages.length === 0" class="empty">
        ✅ Aucun message signalé en attente.
      </div>

      <div class="cards" *ngIf="!loading && messages.length > 0">
        <div *ngFor="let m of messages" class="msg-card">

          <div class="msg-header">
            <div class="participants">
              <span class="uid">{{ m.senderId | slice:0:8 }}…</span>
              <span class="arrow">→</span>
              <span class="uid">{{ m.receiverId | slice:0:8 }}…</span>
            </div>
            <span class="date">{{ m.createdAt | date:'dd/MM/yyyy HH:mm' }}</span>
          </div>

          <div class="msg-content">{{ m.content }}</div>

          <div *ngIf="m.flagReason" class="flag-reason">
            🚩 Raison du signalement : {{ m.flagReason }}
          </div>

          <div class="msg-actions">
            <button class="btn-ok" (click)="dismiss(m)" [disabled]="acting === m.id">
              <span *ngIf="acting === m.id" class="spin"></span>
              ✅ Aucun problème
            </button>
            <button class="btn-del" (click)="remove(m)" [disabled]="acting === m.id">
              🗑️ Supprimer le message
            </button>
          </div>

          <div *ngIf="errors[m.id]" class="error-inline">❌ {{ errors[m.id] }}</div>
        </div>
      </div>

      <!-- Pagination -->
      <div class="pagination" *ngIf="totalPages > 1">
        <button [disabled]="page === 0" (click)="prev()">←</button>
        <span>{{ page + 1 }} / {{ totalPages }}</span>
        <button [disabled]="page >= totalPages - 1" (click)="next()">→</button>
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
    .msg-card { background: #fff; border: 1.5px solid #fbbf24; border-radius: 12px; padding: 1.25rem; }

    .msg-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: .75rem; }
    .participants { display: flex; align-items: center; gap: .5rem; font-size: .85rem; }
    .uid { background: #f1f5f9; padding: .2rem .5rem; border-radius: 4px; font-family: monospace; color: #334155; }
    .arrow { color: #94a3b8; }
    .date { font-size: .8rem; color: #94a3b8; }

    .msg-content {
      background: #f8fafc; border-radius: 8px; padding: .875rem;
      font-size: .9rem; color: #1e293b; line-height: 1.5; margin-bottom: .75rem;
      border-left: 3px solid #fbbf24;
    }

    .flag-reason { font-size: .8rem; color: #92400e; background: #fef3c7; padding: .5rem .75rem; border-radius: 6px; margin-bottom: .75rem; }

    .msg-actions { display: flex; gap: .75rem; }
    .btn-ok, .btn-del {
      padding: .5rem 1.1rem; border-radius: 8px; border: none;
      font-size: .875rem; font-weight: 600; cursor: pointer;
      display: flex; align-items: center; gap: .4rem; transition: opacity .15s;
    }
    .btn-ok:disabled, .btn-del:disabled { opacity: .5; cursor: not-allowed; }
    .btn-ok  { background: #d1fae5; color: #065f46; }
    .btn-ok:hover:not(:disabled)  { background: #a7f3d0; }
    .btn-del { background: #fee2e2; color: #991b1b; }
    .btn-del:hover:not(:disabled) { background: #fecaca; }

    .error-inline { font-size: .8rem; color: #b91c1c; margin-top: .5rem; }

    .pagination { display: flex; align-items: center; justify-content: center; gap: 1rem; padding: 1.5rem 0; font-size: .875rem; }
    .pagination button { padding: .4rem .9rem; border-radius: 6px; border: 1.5px solid #e5e7eb; background: #fff; cursor: pointer; }
    .pagination button:disabled { opacity: .4; }

    .spin { width: 12px; height: 12px; border: 2px solid rgba(0,0,0,.2); border-top-color: currentColor; border-radius: 50%; animation: spin .7s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
  `]
})
export class AdminMessagesComponent implements OnInit {
  messages:   MessageRow[] = [];
  loading     = false;
  page        = 0;
  totalPages  = 1;
  acting:     string | null = null;
  errors:     Record<string, string> = {};

  constructor(private svc: AdminService) {}
  ngOnInit() { this.load(); }

  load() {
    this.loading = true;
    this.svc.getFlaggedMessages(this.page).subscribe({
      next: (r: any) => {
        this.messages   = r.data?.content ?? [];
        this.totalPages = r.data?.totalPages ?? 1;
        this.loading    = false;
      },
      error: () => { this.loading = false; }
    });
  }

  /** Marquer comme inoffensif = retirer le flag (appel backend à implémenter si besoin) */
  dismiss(m: MessageRow) {
    this.messages = this.messages.filter(x => x.id !== m.id);
  }

  /** Supprimer le message (endpoint admin à brancher) */
  remove(m: MessageRow) {
    this.acting = m.id;
    // Appel API — endpoint: DELETE /admin/messages/{id}
    // Pour l'instant on retire de la liste (à connecter au backend)
    setTimeout(() => {
      this.messages = this.messages.filter(x => x.id !== m.id);
      this.acting = null;
    }, 300);
  }

  prev() { if (this.page > 0) { this.page--; this.load(); } }
  next() { if (this.page < this.totalPages - 1) { this.page++; this.load(); } }
}
