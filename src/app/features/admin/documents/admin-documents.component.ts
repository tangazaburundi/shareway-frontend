import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService, DocumentRow } from '../../../core/services/admin.service';

@Component({
  selector: 'app-admin-documents',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page">
      <div class="page-header">
        <h1>📄 Documents à valider</h1>
        <p class="sub">Permis de conduire, cartes grises, pièces d'identité</p>
      </div>

      <div *ngIf="loading" class="loading">Chargement…</div>

      <div *ngIf="!loading && docs.length === 0" class="empty">
        ✅ Aucun document en attente de validation.
      </div>

      <div class="doc-grid" *ngIf="!loading && docs.length > 0">
        <div *ngFor="let d of docs" class="doc-card">

          <div class="doc-type">
            <span class="type-icon">{{ typeIcon(d.type) }}</span>
            <div>
              <div class="type-label">{{ typeLabel(d.type) }}</div>
              <div class="user-info" *ngIf="d.user">
                {{ d.user.firstName }} {{ d.user.lastName }}
              </div>
            </div>
          </div>

          <div class="doc-meta">
            <span class="filename">{{ d.fileName || 'Document' }}</span>
            <span class="date">{{ d.createdAt | date:'dd/MM/yyyy' }}</span>
            <span *ngIf="d.expiresAt" class="expires">
              Expire le {{ d.expiresAt | date:'dd/MM/yyyy' }}
            </span>
          </div>

          <!-- Aperçu du document -->
          <a [href]="d.fileUrl" target="_blank" class="preview-link">
            👁️ Voir le document
          </a>

          <div class="doc-actions">
            <button class="btn-approve" (click)="approve(d)" [disabled]="acting === d.id">
              <span *ngIf="acting === d.id" class="spin"></span>
              ✅ Approuver
            </button>
            <button class="btn-reject-btn" (click)="openReject(d)">
              ❌ Rejeter
            </button>
          </div>

          <div *ngIf="errors[d.id]" class="error-inline">❌ {{ errors[d.id] }}</div>
        </div>
      </div>

      <!-- Modal rejet -->
      <div *ngIf="showRejectModal" class="modal-overlay" (click)="closeReject()">
        <div class="modal" (click)="$event.stopPropagation()">
          <h2>❌ Rejeter le document</h2>
          <p>Le propriétaire sera notifié avec la raison du rejet.</p>
          <div class="field">
            <label>Raison du rejet *</label>
            <select [(ngModel)]="rejectReason">
              <option value="">Choisir une raison…</option>
              <option value="Document illisible">Document illisible ou flou</option>
              <option value="Document expiré">Document expiré</option>
              <option value="Document non conforme">Document non conforme</option>
              <option value="Mauvais type de document">Mauvais type de document</option>
              <option value="Identité non vérifiable">Identité non vérifiable</option>
            </select>
          </div>
          <div class="field">
            <label>Précision (optionnel)</label>
            <textarea [(ngModel)]="rejectDetail" rows="2" placeholder="Détails supplémentaires…"></textarea>
          </div>
          <div *ngIf="modalError" class="error-box">❌ {{ modalError }}</div>
          <div class="modal-actions">
            <button class="btn-cancel" (click)="closeReject()">Annuler</button>
            <button class="btn-danger" (click)="confirmReject()" [disabled]="!rejectReason || acting !== null">
              <span *ngIf="acting" class="spin"></span>
              Rejeter
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./admin-documents.component.css']
})
export class AdminDocumentsComponent implements OnInit {
  docs:         DocumentRow[] = [];
  loading       = false;
  acting:       string | null = null;
  errors:       Record<string, string> = {};

  showRejectModal = false;
  targetDoc:      DocumentRow | null = null;
  rejectReason    = '';
  rejectDetail    = '';
  modalError:     string | null = null;

  constructor(private svc: AdminService) {}
  ngOnInit() { this.load(); }

  load() {
    this.loading = true;
    this.svc.getPendingDocuments().subscribe({
      next: r => { this.docs = r.data ?? []; this.loading = false; },
      error: () => { this.loading = false; }
    });
  }

  approve(d: DocumentRow) {
    this.acting = d.id;
    this.svc.approveDocument(d.id).subscribe({
      next: () => { this.docs = this.docs.filter(x => x.id !== d.id); this.acting = null; },
      error: err => { this.errors[d.id] = err.error?.message || 'Erreur'; this.acting = null; }
    });
  }

  openReject(d: DocumentRow) {
    this.targetDoc = d; this.rejectReason = ''; this.rejectDetail = '';
    this.modalError = null; this.showRejectModal = true;
  }
  closeReject() { this.showRejectModal = false; this.targetDoc = null; }

  confirmReject() {
    if (!this.targetDoc || !this.rejectReason) return;
    this.acting = this.targetDoc.id; this.modalError = null;
    const fullReason = this.rejectDetail
      ? `${this.rejectReason} — ${this.rejectDetail}`
      : this.rejectReason;

    this.svc.rejectDocument(this.targetDoc.id, fullReason).subscribe({
      next: () => {
        this.docs = this.docs.filter(x => x.id !== this.targetDoc!.id);
        this.acting = null; this.closeReject();
      },
      error: (err : any) => { this.modalError = err.error?.message || 'Erreur'; this.acting = null; }
    });
  }

  typeLabel(t: string): string {
    const m: Record<string,string> = {
      ID_CARD: "Carte d'identité", PASSPORT: 'Passeport',
      DRIVER_LICENSE: 'Permis de conduire',
      VEHICLE_REGISTRATION: 'Carte grise', INSURANCE: 'Assurance'
    };
    return m[t] ?? t;
  }
  typeIcon(t: string): string {
    const m: Record<string,string> = {
      ID_CARD: '🪪', PASSPORT: '📘', DRIVER_LICENSE: '🚗',
      VEHICLE_REGISTRATION: '📋', INSURANCE: '🛡️'
    };
    return m[t] ?? '📄';
  }
}
