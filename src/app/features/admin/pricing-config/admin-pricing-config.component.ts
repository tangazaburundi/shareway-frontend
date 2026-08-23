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
  styleUrls: ['./admin-pricing-config.component.css']
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
