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
  styles: [`
    .page { padding: 2rem; max-width: 1100px; margin: 0 auto; }
    .page-header { margin-bottom: 1.5rem; }
    h1 { font-size: 1.4rem; font-weight: 700; margin: 0 0 .25rem; }
    .sub { color: #64748b; font-size: .875rem; margin: 0; }
    .loading { color: #64748b; padding: 2rem 0; }
    .empty { text-align: center; padding: 3rem; color: #64748b; background: #fff; border-radius: 12px; border: 1px solid #e5e7eb; }

    .doc-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 1rem; }
    .doc-card { background: #fff; border: 1.5px solid #e5e7eb; border-radius: 12px; padding: 1.25rem; }

    .doc-type { display: flex; align-items: center; gap: .75rem; margin-bottom: .875rem; }
    .type-icon { font-size: 1.75rem; }
    .type-label { font-size: .95rem; font-weight: 700; color: #1e293b; }
    .user-info { font-size: .8rem; color: #64748b; margin-top: .15rem; }

    .doc-meta { display: flex; flex-direction: column; gap: .2rem; margin-bottom: .75rem; }
    .filename { font-size: .85rem; color: #334155; font-family: monospace; }
    .date, .expires { font-size: .78rem; color: #94a3b8; }
    .expires { color: #f59e0b; }

    .preview-link {
      display: inline-block; font-size: .85rem; color: #4f46e5;
      text-decoration: none; margin-bottom: .875rem;
    }
    .preview-link:hover { text-decoration: underline; }

    .doc-actions { display: flex; gap: .75rem; }
    .btn-approve, .btn-reject-btn {
      flex: 1; padding: .5rem; border-radius: 8px; border: none;
      font-size: .875rem; font-weight: 600; cursor: pointer;
      display: flex; align-items: center; justify-content: center; gap: .4rem;
    }
    .btn-approve { background: #d1fae5; color: #065f46; }
    .btn-approve:hover:not(:disabled) { background: #a7f3d0; }
    .btn-approve:disabled { opacity: .5; cursor: not-allowed; }
    .btn-reject-btn { background: #fee2e2; color: #991b1b; }
    .btn-reject-btn:hover { background: #fecaca; }

    .error-inline { font-size: .8rem; color: #b91c1c; margin-top: .5rem; }

    /* Modal */
    .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,.5); z-index: 100; display: flex; align-items: center; justify-content: center; padding: 1rem; }
    .modal { background: #fff; border-radius: 12px; padding: 2rem; width: 100%; max-width: 460px; }
    .modal h2 { margin: 0 0 .5rem; font-size: 1.1rem; }
    .modal p { color: #555; font-size: .9rem; margin-bottom: 1rem; }
    .field { margin-bottom: 1rem; }
    .field label { display: block; font-size: .85rem; font-weight: 600; margin-bottom: .4rem; color: #333; }
    .field select, .field textarea {
      width: 100%; padding: .7rem; border: 1.5px solid #e5e7eb; border-radius: 8px;
      font-size: .9rem; box-sizing: border-box;
    }
    .field select:focus, .field textarea:focus { outline: none; border-color: #4f46e5; }
    .error-box { background: #fef2f2; border: 1px solid #fecaca; color: #b91c1c; padding: .7rem; border-radius: 8px; font-size: .85rem; margin-bottom: .75rem; }
    .modal-actions { display: flex; gap: .75rem; justify-content: flex-end; }
    .btn-cancel { padding: .5rem 1rem; border-radius: 8px; border: 1.5px solid #e5e7eb; background: #fff; cursor: pointer; font-size: .875rem; }
    .btn-danger { padding: .5rem 1.25rem; border-radius: 8px; background: #ef4444; color: #fff; border: none; font-size: .875rem; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: .5rem; }
    .btn-danger:disabled { opacity: .6; cursor: not-allowed; }
    .btn-danger:hover:not(:disabled) { background: #dc2626; }
    .spin { width: 12px; height: 12px; border: 2px solid rgba(255,255,255,.4); border-top-color: #fff; border-radius: 50%; animation: spin .7s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
  `]
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
