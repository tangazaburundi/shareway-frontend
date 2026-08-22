import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RideService } from '../../../core/services/ride.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-admin-ride-config',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page">
      <div class="page-header">
        <div>
          <h1>Configuration des courses</h1>
          <span class="subtitle">Paramètres liés à la recherche et à l'annulation automatique des courses</span>
        </div>
      </div>

      @if (loading()) {
        <div class="skeleton-card"></div>
      } @else {
        <div class="form-card">
          <h2>Recherche de chauffeur</h2>
          <div class="form-grid">
            <div class="form-group">
              <label>Délai d'attente maximal (minutes)</label>
              <input
                type="number"
                [(ngModel)]="searchTimeout"
                min="1"
                max="30"
                placeholder="3"
              />
              <span class="hint">
                Temps maximum (en minutes) qu'un passager attend un chauffeur.
                Passé ce délai, la course est automatiquement annulée.
              </span>
            </div>

            <div class="form-group">
              <label>Rayon de relance après refus (km)</label>
              <input
                type="number"
                [(ngModel)]="rebroadcastRadius"
                min="1"
                max="50"
                placeholder="2"
              />
              <span class="hint">
                Lorsqu'un chauffeur refuse, le système cherche les autres chauffeurs
                disponibles dans ce rayon (en km) autour du point de prise en charge.
              </span>
            </div>
          </div>

          <div class="form-actions">
            <button class="btn-primary" (click)="save()">Enregistrer</button>
          </div>
        </div>

        <div class="info-card">
          <h3>Comment ça fonctionne ?</h3>
          <ul>
            <li>Lorsqu'un passager crée une course, le système cherche automatiquement le chauffeur le plus proche.</li>
            <li>Si un chauffeur est trouvé, il a le délai configuré pour accepter ou refuser.</li>
            <li>En cas de <strong>refus</strong>, le système relance tous les chauffeurs disponibles dans le rayon configuré.</li>
            <li>Si le délai est dépassé sans réponse, la course est annulée automatiquement et le passager en est notifié.</li>
            <li><strong>Délai par défaut</strong> : 3 minutes. <strong>Rayon par défaut</strong> : 2 km.</li>
          </ul>
        </div>
      }
    </div>
  `,
  styles: [`
    .page { padding: 2rem; max-width: 800px; margin: 0 auto; }
    .page-header { margin-bottom: 1.5rem; }
    .page-header h1 { margin: 0; font-size: 1.5rem; font-weight: 700; }
    .subtitle { color: #6b7280; font-size: 0.9rem; }
    .form-card { background: white; border: 1px solid #e5e7eb; border-radius: 12px; padding: 1.5rem; margin-bottom: 1.5rem; }
    .form-card h2 { margin: 0 0 1rem; font-size: 1.1rem; font-weight: 600; color: #1f2937; }
    .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1.25rem; }
    .form-group { display: flex; flex-direction: column; gap: 4px; }
    .form-group label { font-size: 0.85rem; font-weight: 600; color: #374151; }
    .form-group input { padding: 10px 12px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 0.9rem; }
    .form-group input:focus { outline: none; border-color: #2563eb; box-shadow: 0 0 0 3px rgba(37,99,235,0.1); }
    .hint { color: #9ca3af; font-size: 0.75rem; margin-top: 2px; }
    .form-actions { margin-top: 1.25rem; }
    .btn-primary { background: #2563eb; color: white; padding: 10px 24px; border: none; border-radius: 8px; font-weight: 600; cursor: pointer; }
    .btn-primary:hover { background: #1d4ed8; }
    .info-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 1.25rem; }
    .info-card h3 { margin: 0 0 0.75rem; font-size: 1rem; }
    .info-card ul { margin: 0; padding-left: 1.25rem; }
    .info-card li { font-size: 0.85rem; color: #64748b; margin-bottom: 4px; }
    .skeleton-card { height: 200px; background: #f3f4f6; border-radius: 12px; animation: pulse 1.5s infinite; }
    @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.5; } }
    @media (max-width: 640px) { .page { padding: 1rem; } .form-grid { grid-template-columns: 1fr; } }
  `]
})
export class AdminRideConfigComponent implements OnInit {
  loading = signal(true);
  searchTimeout = 3;
  rebroadcastRadius = 2;

  constructor(private rideService: RideService, private toast: ToastService) {}

  ngOnInit() { this.loadSettings(); }

  loadSettings() {
    this.loading.set(true);
    this.rideService.getSystemSettings().subscribe({
      next: (res) => {
        if (res.data) {
          if (res.data['ride.search_timeout_minutes']) {
            this.searchTimeout = parseInt(res.data['ride.search_timeout_minutes'], 10) || 3;
          }
          if (res.data['ride.rebroadcast_radius_km']) {
            this.rebroadcastRadius = parseInt(res.data['ride.rebroadcast_radius_km'], 10) || 2;
          }
        }
        this.loading.set(false);
      },
      error: () => { this.loading.set(false); }
    });
  }

  save() {
    if (this.searchTimeout < 1 || this.searchTimeout > 30) {
      this.toast.error('Le délai doit être entre 1 et 30 minutes');
      return;
    }
    if (this.rebroadcastRadius < 1 || this.rebroadcastRadius > 50) {
      this.toast.error('Le rayon doit être entre 1 et 50 km');
      return;
    }
    this.rideService.updateSystemSetting('ride.search_timeout_minutes', String(this.searchTimeout)).subscribe({
      next: () => {
        this.rideService.updateSystemSetting('ride.rebroadcast_radius_km', String(this.rebroadcastRadius)).subscribe({
          next: () => { this.toast.success('Configuration sauvegardée'); this.loadSettings(); },
          error: () => this.toast.error('Erreur lors de la sauvegarde du rayon')
        });
      },
      error: () => this.toast.error('Erreur lors de la sauvegarde')
    });
  }
}
