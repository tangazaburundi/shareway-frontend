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
  styleUrls: ['./admin-sms-config.component.css']
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
