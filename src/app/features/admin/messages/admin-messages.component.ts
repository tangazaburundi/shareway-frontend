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
  styleUrls: ['./admin-messages.component.css']
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
