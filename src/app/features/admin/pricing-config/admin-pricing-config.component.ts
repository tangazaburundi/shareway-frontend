import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RideService } from '../../../core/services/ride.service';
import { ToastService } from '../../../core/services/toast.service';
import { PricingConfig } from '../../../core/models/ride.model';

@Component({
  selector: 'app-admin-pricing-config',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page">
      <div class="page-header">
        <div>
          <h1>Configuration tarifaire</h1>
          <span class="subtitle">Gérez les tarifs des courses on-demand (mode Uber)</span>
        </div>
        <button class="btn-primary" (click)="openCreate()">+ Nouvelle config</button>
      </div>

      @if (showForm()) {
      <div class="form-card">
        <h2>{{ editingId() ? 'Modifier' : 'Nouvelle' }} config tarifaire</h2>
        <div class="form-grid">
          <div class="form-group">
            <label>Nom *</label>
            <input [(ngModel)]="form.name" placeholder="Ex: Tarif standard" required [class.input-error]="hasError('name')" />
            @if (hasError('name')) {
              <span class="field-error">Le nom est obligatoire</span>
            }
          </div>
          <div class="form-group">
            <label>Devise *</label>
            <select [(ngModel)]="form.currency" required>
              <option value="FBU">FBU (Burundi)</option>
              <option value="FRW">FRW (Rwanda)</option>
              <option value="EUR">EUR (Euro)</option>
              <option value="USD">USD (Dollar)</option>
            </select>
          </div>
          <div class="form-group">
            <label>Prix de base *</label>
            <input [(ngModel)]="form.basePrice" type="number" step="0.01" min="0" required />
          </div>
          <div class="form-group">
            <label>Prix par km *</label>
            <input [(ngModel)]="form.pricePerKm" type="number" step="0.01" min="0" required />
          </div>
          <div class="form-group">
            <label>Prix par minute *</label>
            <input [(ngModel)]="form.pricePerMin" type="number" step="0.01" min="0" required />
          </div>
          <div class="form-group">
            <label>Prix minimum *</label>
            <input [(ngModel)]="form.minimumPrice" type="number" step="0.01" min="0" required />
          </div>
          <div class="form-group">
            <label>Multiplier surge</label>
            <input [(ngModel)]="form.surgeMultiplier" type="number" step="0.1" min="1" />
            <span class="hint">1.0 = pas de surge, 1.5 = +50%</span>
          </div>
          <div class="form-group">
            <label>Seuil chauffeurs (surge)</label>
            <input [(ngModel)]="form.surgeThreshold" type="number" min="1" />
            <span class="hint">Nb min chauffeurs dispo pour activer le surge</span>
          </div>
          <div class="form-group">
            <label>Frais plateforme (%)</label>
            <input [(ngModel)]="form.platformFeePercent" type="number" step="0.5" min="0" max="50" />
          </div>
          <div class="form-group">
            <label>Annulation gratuite (min)</label>
            <input [(ngModel)]="form.freeCancellationMinutes" type="number" min="0" />
          </div>
          <div class="form-group">
            <label>Active</label>
            <label class="toggle">
              <input type="checkbox" [(ngModel)]="form.active" />
              <span class="toggle-slider"></span>
            </label>
          </div>
        </div>
        <div class="form-actions">
          <button class="btn-primary" (click)="save()">{{ editingId() ? 'Mettre à jour' : 'Créer' }}</button>
          <button class="btn-secondary" (click)="cancelForm()">Annuler</button>
        </div>
      </div>
      }

      @if (loading()) {
        <div class="skeleton-grid">
          @for (i of [1,2,3]; track i) {
          <div class="skeleton-card"></div>
          }
        </div>
      } @else {
        <div class="config-grid">
          @for (config of configs(); track config.id) {
          <div class="config-card" [class.inactive]="!config.active">
            <div class="card-header">
              <span class="badge" [class.badge-success]="config.active" [class.badge-muted]="!config.active">
                {{ config.active ? 'Active' : 'Inactive' }}
              </span>
              <span class="currency">{{ config.currency }}</span>
            </div>
            <h3>{{ config.name }}</h3>
            <div class="config-details">
              <div class="detail-row">
                <span>Prix de base</span>
                <strong>{{ config.basePrice | number:'1.0-0' }}</strong>
              </div>
              <div class="detail-row">
                <span>Par km</span>
                <strong>{{ config.pricePerKm | number:'1.0-0' }}</strong>
              </div>
              <div class="detail-row">
                <span>Par minute</span>
                <strong>{{ config.pricePerMin | number:'1.0-0' }}</strong>
              </div>
              <div class="detail-row">
                <span>Minimum</span>
                <strong>{{ config.minimumPrice | number:'1.0-0' }}</strong>
              </div>
              <div class="detail-row">
                <span>Surge</span>
                <strong>{{ config.surgeMultiplier }}x</strong>
              </div>
              <div class="detail-row">
                <span>Frais plateforme</span>
                <strong>{{ config.platformFeePercent }}%</strong>
              </div>
              <div class="detail-row">
                <span>Annul. gratuite</span>
                <strong>{{ config.freeCancellationMinutes }} min</strong>
              </div>
            </div>
            <div class="card-actions">
              <button class="btn-edit" (click)="openEdit(config)">Modifier</button>
              <button class="btn-delete" (click)="confirmDelete(config.id)">Supprimer</button>
            </div>
          </div>
          } @empty {
            <p class="empty-state">Aucune configuration tarifaire. Créez-en une pour démarrer.</p>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .page { padding: 2rem; max-width: 1200px; margin: 0 auto; }
    .page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1.5rem; }
    .page-header h1 { margin: 0; font-size: 1.5rem; font-weight: 700; }
    .subtitle { color: #6b7280; font-size: 0.9rem; }
    .btn-primary { background: #2563eb; color: white; padding: 10px 20px; border: none; border-radius: 8px; font-weight: 600; cursor: pointer; }
    .btn-primary:hover { background: #1d4ed8; }
    .form-card { background: white; border: 1px solid #e5e7eb; border-radius: 12px; padding: 1.5rem; margin-bottom: 1.5rem; }
    .form-card h2 { margin: 0 0 1rem; font-size: 1.1rem; }
    .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
    .form-group { display: flex; flex-direction: column; gap: 4px; }
    .form-group label { font-size: 0.85rem; font-weight: 600; color: #374151; }
    .form-group input, .form-group select { padding: 10px 12px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 0.9rem; }
    .form-group input:focus, .form-group select:focus { outline: none; border-color: #2563eb; box-shadow: 0 0 0 3px rgba(37,99,235,0.1); }
    .input-error { border-color: #ef4444 !important; }
    .field-error { color: #ef4444; font-size: 0.8rem; }
    .hint { color: #9ca3af; font-size: 0.75rem; }
    .form-actions { display: flex; gap: 10px; margin-top: 1rem; }
    .btn-secondary { background: #f3f4f6; color: #374151; padding: 10px 20px; border: 1px solid #d1d5db; border-radius: 8px; cursor: pointer; }
    .toggle { position: relative; display: inline-block; width: 44px; height: 24px; cursor: pointer; }
    .toggle input { opacity: 0; width: 0; height: 0; }
    .toggle-slider { position: absolute; inset: 0; background: #ccc; border-radius: 24px; transition: 0.3s; }
    .toggle-slider::before { content: ''; position: absolute; height: 18px; width: 18px; left: 3px; bottom: 3px; background: white; border-radius: 50%; transition: 0.3s; }
    .toggle input:checked + .toggle-slider { background: #2563eb; }
    .toggle input:checked + .toggle-slider::before { transform: translateX(20px); }
    .config-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 1rem; }
    .config-card { background: white; border: 1px solid #e5e7eb; border-radius: 12px; padding: 1.25rem; border-left: 4px solid #2563eb; }
    .config-card.inactive { opacity: 0.6; border-left-color: #9ca3af; }
    .card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem; }
    .badge { padding: 2px 8px; border-radius: 12px; font-size: 0.75rem; font-weight: 600; }
    .badge-success { background: #dcfce7; color: #166534; }
    .badge-muted { background: #f3f4f6; color: #6b7280; }
    .currency { font-size: 0.85rem; color: #6b7280; font-weight: 600; }
    .config-card h3 { margin: 0 0 0.75rem; font-size: 1.1rem; }
    .config-details { display: flex; flex-direction: column; gap: 6px; margin-bottom: 1rem; }
    .detail-row { display: flex; justify-content: space-between; font-size: 0.85rem; color: #6b7280; }
    .detail-row strong { color: #111827; }
    .card-actions { display: flex; gap: 8px; }
    .btn-edit { flex: 1; padding: 8px; background: #eff6ff; color: #2563eb; border: 1px solid #bfdbfe; border-radius: 6px; font-weight: 500; cursor: pointer; }
    .btn-delete { flex: 1; padding: 8px; background: #fef2f2; color: #dc2626; border: 1px solid #fecaca; border-radius: 6px; font-weight: 500; cursor: pointer; }
    .empty-state { grid-column: 1 / -1; text-align: center; color: #9ca3af; padding: 2rem; }
    .skeleton-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 1rem; }
    .skeleton-card { height: 200px; background: #f3f4f6; border-radius: 12px; animation: pulse 1.5s infinite; }
    @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.5; } }
    @media (max-width: 640px) { .page { padding: 1rem; } .form-grid { grid-template-columns: 1fr; } .config-grid { grid-template-columns: 1fr; } }
  `]
})
export class AdminPricingConfigComponent implements OnInit {
  configs = signal<PricingConfig[]>([]);
  loading = signal(true);
  showForm = signal(false);
  editingId = signal<string | null>(null);
  submitted = signal(false);

  form: PricingConfig = {
    id: '', name: '', currency: 'FBU', basePrice: 0, pricePerKm: 0,
    pricePerMin: 0, minimumPrice: 0, surgeMultiplier: 1, surgeThreshold: 5,
    platformFeePercent: 15, freeCancellationMinutes: 2, active: true
  };

  constructor(private rideService: RideService, private toast: ToastService) {}

  ngOnInit() { this.loadConfigs(); }

  loadConfigs() {
    this.loading.set(true);
    this.rideService.getAllPricingConfigs().subscribe({
      next: (res) => { this.configs.set(res.data ?? []); this.loading.set(false); },
      error: () => { this.loading.set(false); }
    });
  }

  openCreate() {
    this.editingId.set(null);
    this.form = {
      id: '', name: '', currency: 'FBU', basePrice: 0, pricePerKm: 0,
      pricePerMin: 0, minimumPrice: 0, surgeMultiplier: 1, surgeThreshold: 5,
      platformFeePercent: 15, freeCancellationMinutes: 2, active: true
    };
    this.submitted.set(false);
    this.showForm.set(true);
  }

  openEdit(config: PricingConfig) {
    this.editingId.set(config.id);
    this.form = { ...config };
    this.submitted.set(false);
    this.showForm.set(true);
  }

  hasError(field: string): boolean {
    if (!this.submitted()) return false;
    if (field === 'name') return !this.form.name?.trim();
    return false;
  }

  save() {
    this.submitted.set(true);
    if (this.hasError('name')) return;

    const obs = this.editingId()
      ? this.rideService.updatePricingConfig(this.editingId()!, this.form)
      : this.rideService.createPricingConfig(this.form);

    obs.subscribe({
      next: () => {
        this.toast.success(this.editingId() ? 'Config mise à jour' : 'Config créée');
        this.showForm.set(false);
        this.loadConfigs();
      },
      error: () => this.toast.error('Erreur lors de la sauvegarde')
    });
  }

  confirmDelete(id: string) {
    if (!confirm('Supprimer cette config tarifaire ?')) return;
    this.rideService.deletePricingConfig(id).subscribe({
      next: () => { this.toast.success('Supprimée'); this.loadConfigs(); },
      error: () => this.toast.error('Erreur lors de la suppression')
    });
  }

  cancelForm() { this.showForm.set(false); }
}
