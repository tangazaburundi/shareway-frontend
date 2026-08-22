import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RideService } from '../../../core/services/ride.service';
import { ToastService } from '../../../core/services/toast.service';
import { SmsConfig, SmsProvider } from '../../../core/models/ride.model';

@Component({
  selector: 'app-admin-sms-config',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page">
      <div class="page-header">
        <div>
          <h1>Configuration SMS</h1>
          <span class="subtitle">Activez ou désactivez les notifications SMS pour les courses</span>
        </div>
      </div>

      @if (loading()) {
        <div class="skeleton-card"></div>
      } @else {
        <div class="form-card">
          <div class="form-grid">
            <div class="form-group">
              <label>Statut</label>
              <label class="toggle">
                <input type="checkbox" [(ngModel)]="form.enabled" (ngModelChange)="onToggle()" />
                <span class="toggle-slider"></span>
              </label>
              <span class="status-text" [class.active]="form.enabled">
                {{ form.enabled ? 'SMS activés' : 'SMS désactivés' }}
              </span>
            </div>

            <div class="form-group">
              <label>Fournisseur SMS</label>
              <select [(ngModel)]="form.provider">
                <option value="TWILIO">Twilio</option>
                <option value="AFRICAS_TALKING">Africa's Talking</option>
                <option value="DISABLED">Désactivé</option>
              </select>
              <span class="hint">Choisissez le fournisseur le moins cher pour votre région</span>
            </div>

            <div class="form-group">
              <label>Clé API</label>
              <input type="password" [(ngModel)]="form.apiKey" placeholder="API Key du fournisseur" />
            </div>

            <div class="form-group">
              <label>Secret API</label>
              <input type="password" [(ngModel)]="form.apiSecret" placeholder="API Secret du fournisseur" />
            </div>

            <div class="form-group">
              <label>Numéro expéditeur</label>
              <input [(ngModel)]="form.senderNumber" placeholder="+257 XX XXX XXX" />
            </div>

            <div class="form-group">
              <label>Nom expéditeur</label>
              <input [(ngModel)]="form.senderName" placeholder="ShareWay" />
            </div>
          </div>

          <div class="form-actions">
            <button class="btn-primary" (click)="save()">Enregistrer</button>
          </div>
        </div>

        <div class="info-card">
          <h3>Informations</h3>
          <ul>
            <li><strong>Twilio</strong> — Interface simple, tarification par message. Idéal pour démarrer.</li>
            <li><strong>Africa's Talking</strong> — Tarifs compétitifs en Afrique de l'Est. BIF supporté.</li>
            <li>Les SMS sont envoyés pour : demande de course, confirmation, arrivée chauffeur, course terminée.</li>
            <li>Vous pouvez désactiver les SMS à tout moment sans affecter les courses.</li>
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
    .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1.25rem; }
    .form-group { display: flex; flex-direction: column; gap: 4px; }
    .form-group label { font-size: 0.85rem; font-weight: 600; color: #374151; }
    .form-group input, .form-group select { padding: 10px 12px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 0.9rem; }
    .form-group input:focus, .form-group select:focus { outline: none; border-color: #2563eb; box-shadow: 0 0 0 3px rgba(37,99,235,0.1); }
    .hint { color: #9ca3af; font-size: 0.75rem; }
    .status-text { font-size: 0.85rem; font-weight: 600; color: #dc2626; }
    .status-text.active { color: #16a34a; }
    .toggle { position: relative; display: inline-block; width: 44px; height: 24px; cursor: pointer; }
    .toggle input { opacity: 0; width: 0; height: 0; }
    .toggle-slider { position: absolute; inset: 0; background: #ccc; border-radius: 24px; transition: 0.3s; }
    .toggle-slider::before { content: ''; position: absolute; height: 18px; width: 18px; left: 3px; bottom: 3px; background: white; border-radius: 50%; transition: 0.3s; }
    .toggle input:checked + .toggle-slider { background: #22c55e; }
    .toggle input:checked + .toggle-slider::before { transform: translateX(20px); }
    .form-actions { margin-top: 1.25rem; }
    .btn-primary { background: #2563eb; color: white; padding: 10px 24px; border: none; border-radius: 8px; font-weight: 600; cursor: pointer; }
    .btn-primary:hover { background: #1d4ed8; }
    .info-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 1.25rem; }
    .info-card h3 { margin: 0 0 0.75rem; font-size: 1rem; }
    .info-card ul { margin: 0; padding-left: 1.25rem; }
    .info-card li { font-size: 0.85rem; color: #64748b; margin-bottom: 4px; }
    .skeleton-card { height: 300px; background: #f3f4f6; border-radius: 12px; animation: pulse 1.5s infinite; }
    @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.5; } }
    @media (max-width: 640px) { .page { padding: 1rem; } .form-grid { grid-template-columns: 1fr; } }
  `]
})
export class AdminSmsConfigComponent implements OnInit {
  loading = signal(true);
  form: SmsConfig = {
    id: '', provider: 'DISABLED', enabled: false,
    apiKey: '', apiSecret: '', senderNumber: '', senderName: 'ShareWay'
  };

  constructor(private rideService: RideService, private toast: ToastService) {}

  ngOnInit() { this.loadConfig(); }

  loadConfig() {
    this.loading.set(true);
    this.rideService.getSmsConfig().subscribe({
      next: (res) => {
        if (res.data) this.form = res.data;
        this.loading.set(false);
      },
      error: () => { this.loading.set(false); }
    });
  }

  onToggle() {
    if (this.form.enabled && this.form.provider === 'DISABLED') {
      this.toast.error('Sélectionnez un fournisseur SMS avant d\'activer');
      this.form.enabled = false;
    }
  }

  save() {
    this.rideService.updateSmsConfig(this.form).subscribe({
      next: () => { this.toast.success('Configuration SMS sauvegardée'); this.loadConfig(); },
      error: () => this.toast.error('Erreur lors de la sauvegarde')
    });
  }
}
