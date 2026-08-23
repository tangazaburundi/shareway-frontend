import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { RideService } from '../../../core/services/ride.service';
import { ToastService } from '../../../core/services/toast.service';
import { NotificationSoundService, SOUND_CATALOG, SoundType, SoundOption } from '../../../core/services/notification-sound.service';

@Component({
  selector: 'app-sound-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page">
      <div class="page-header">
        <button class="back-btn" (click)="goBack()">← Retour</button>
        <h1>Préférences sonores</h1>
        <span class="subtitle">Personnalisez les sons de notification</span>
      </div>

      @if (loading()) {
        <div class="skeleton-card"></div>
      } @else if (!userSoundConfigEnabled) {
        <div class="disabled-card">
          <div class="disabled-icon">🔒</div>
          <h3>Personnalisation désactivée</h3>
          <p>L'administrateur a désactivé la personnalisation des sons. Les sons par défaut sont utilisés.</p>
        </div>
      } @else {
        <div class="form-card">
          <h2>Volume</h2>
          <div class="form-group">
            <div class="volume-row">
              <span class="volume-icon">🔈</span>
              <input type="range" [(ngModel)]="volume" min="0" max="1" step="0.05" (ngModelChange)="onVolumeChange()" />
              <span class="volume-icon">🔊</span>
              <span class="volume-value">{{ (volume * 100) | number:'1.0-0' }}%</span>
            </div>
          </div>
        </div>

        @for (entry of soundTypes; track entry.type) {
          <div class="form-card">
            <h2>{{ entry.label }}</h2>
            <div class="sound-options">
              @for (opt of getOptions(entry.type); track opt.id) {
                <button
                  class="sound-option"
                  [class.active]="getSelected(entry.type) === opt.id"
                  (click)="selectSound(entry.type, opt.id)"
                >
                  <span class="sound-label">{{ opt.label }}</span>
                  <button class="preview-btn" (click)="preview(entry.type, opt.id); $event.stopPropagation()" title="Écouter">
                    ▶ Écouter
                  </button>
                </button>
              }
            </div>
          </div>
        }

        <div class="form-actions">
          <button class="btn-primary" (click)="save()" [disabled]="saving()">
            {{ saving() ? 'Enregistrement...' : 'Enregistrer' }}
          </button>
        </div>
      }
    </div>
  `,
  styles: [`
    .page { padding: 2rem; max-width: 600px; margin: 0 auto; }
    .page-header { margin-bottom: 1.5rem; }
    .page-header h1 { margin: 8px 0 4px; font-size: 1.5rem; font-weight: 700; }
    .subtitle { color: #6b7280; font-size: 0.9rem; }
    .back-btn {
      background: none; border: none; color: #2563eb; cursor: pointer;
      font-size: 0.9rem; font-weight: 500; padding: 0;
    }
    .back-btn:hover { text-decoration: underline; }
    .form-card {
      background: white; border: 1px solid #e5e7eb; border-radius: 12px;
      padding: 1.25rem; margin-bottom: 1rem;
    }
    .form-card h2 { margin: 0 0 1rem; font-size: 1rem; font-weight: 600; color: #1f2937; }
    .form-group { display: flex; flex-direction: column; gap: 4px; }
    .volume-row { display: flex; align-items: center; gap: 12px; }
    .volume-row input[type="range"] { flex: 1; accent-color: #2563eb; height: 6px; }
    .volume-icon { font-size: 1.2rem; }
    .volume-value { font-size: 0.9rem; font-weight: 600; color: #2563eb; min-width: 40px; }
    .sound-options { display: flex; flex-direction: column; gap: 8px; }
    .sound-option {
      display: flex; align-items: center; justify-content: space-between;
      padding: 12px 16px; border: 1px solid #e5e7eb; border-radius: 10px;
      background: white; cursor: pointer; transition: all 0.15s;
    }
    .sound-option:hover { border-color: #93c5fd; background: #f0f7ff; }
    .sound-option.active { border-color: #2563eb; background: #eff6ff; box-shadow: 0 0 0 2px rgba(37,99,235,0.15); }
    .sound-label { font-size: 0.9rem; font-weight: 500; color: #374151; }
    .preview-btn {
      background: #f3f4f6; border: 1px solid #d1d5db; border-radius: 8px;
      padding: 6px 14px; cursor: pointer; font-size: 0.8rem; font-weight: 500;
      color: #374151; transition: all 0.15s;
    }
    .preview-btn:hover { background: #e5e7eb; }
    .form-actions { margin-top: 1.5rem; }
    .btn-primary {
      background: #2563eb; color: white; padding: 12px 32px; border: none;
      border-radius: 8px; font-weight: 600; font-size: 1rem; cursor: pointer;
      width: 100%;
    }
    .btn-primary:hover { background: #1d4ed8; }
    .btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
    .disabled-card {
      background: white; border: 1px solid #e5e7eb; border-radius: 12px;
      padding: 3rem 2rem; text-align: center;
    }
    .disabled-icon { font-size: 3rem; margin-bottom: 1rem; }
    .disabled-card h3 { margin: 0 0 8px; color: #374151; }
    .disabled-card p { margin: 0; color: #6b7280; font-size: 0.9rem; }
    .skeleton-card { height: 200px; background: #f3f4f6; border-radius: 12px; animation: pulse 1.5s infinite; }
    @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.5; } }
  `]
})
export class SoundSettingsComponent implements OnInit {
  loading = signal(true);
  saving = signal(false);
  volume = 0.3;
  userSoundConfigEnabled = true;

  soundTypes: { type: SoundType; label: string }[] = [
    { type: 'ride-request', label: 'Demande de course' },
    { type: 'ride-accepted', label: 'Course acceptée' },
    { type: 'ride-cancelled', label: 'Course annulée' },
    { type: 'ride-completed', label: 'Course terminée' },
    { type: 'message', label: 'Message' },
    { type: 'sos', label: 'SOS' },
  ];

  private selectedSounds: Record<SoundType, string> = {
    'ride-request': 'classic',
    'ride-accepted': 'success',
    'ride-cancelled': 'alert',
    'ride-completed': 'tada',
    'message': 'ping',
    'sos': 'siren',
  };

  constructor(
    private rideService: RideService,
    private toast: ToastService,
    private router: Router,
    public soundService: NotificationSoundService
  ) {}

  ngOnInit() {
    this.checkAdminConfig();
    this.loadPrefs();
  }

  checkAdminConfig(): void {
    this.rideService.getSystemSettings().subscribe({
      next: (res) => {
        if (res.data && res.data['ride.user_sound_config_enabled']) {
          this.userSoundConfigEnabled = res.data['ride.user_sound_config_enabled'] === 'true';
        }
      },
      error: () => {}
    });
  }

  loadPrefs(): void {
    this.loading.set(true);
    this.rideService.getSoundPreferences().subscribe({
      next: (res) => {
        if (res && res.data) {
          const d = res.data;
          this.volume = d.notificationVolume ?? 0.3;
          this.selectedSounds['ride-request'] = d.rideRequestSound || 'classic';
          this.selectedSounds['ride-accepted'] = d.rideAcceptedSound || 'success';
          this.selectedSounds['ride-cancelled'] = d.rideCancelledSound || 'alert';
          this.selectedSounds['ride-completed'] = d.rideCompletedSound || 'tada';
          this.selectedSounds['message'] = d.messageSound || 'ping';
          this.selectedSounds['sos'] = d.sosSound || 'siren';
        }
        this.loading.set(false);
      },
      error: () => { this.loading.set(false); }
    });
  }

  getOptions(type: SoundType): SoundOption[] {
    return SOUND_CATALOG[type] || [];
  }

  getSelected(type: SoundType): string {
    return this.selectedSounds[type];
  }

  selectSound(type: SoundType, id: string): void {
    this.selectedSounds[type] = id;
  }

  preview(type: SoundType, id: string): void {
    this.soundService.setVolume(this.volume);
    this.soundService.preview(type, id);
  }

  onVolumeChange(): void {
    this.soundService.setVolume(this.volume);
  }

  goBack(): void {
    this.router.navigate(['/profile']);
  }

  save(): void {
    this.saving.set(true);
    this.rideService.updateSoundPreferences({
      rideRequestSound: this.selectedSounds['ride-request'],
      rideAcceptedSound: this.selectedSounds['ride-accepted'],
      rideCancelledSound: this.selectedSounds['ride-cancelled'],
      rideCompletedSound: this.selectedSounds['ride-completed'],
      messageSound: this.selectedSounds['message'],
      sosSound: this.selectedSounds['sos'],
      notificationVolume: this.volume,
    }).subscribe({
      next: (res) => {
        this.saving.set(false);
        if (res && res.data) {
          this.soundService.setVolume(res.data.notificationVolume);
          this.soundService.setPrefs({
            'ride-request': res.data.rideRequestSound,
            'ride-accepted': res.data.rideAcceptedSound,
            'ride-cancelled': res.data.rideCancelledSound,
            'ride-completed': res.data.rideCompletedSound,
            'message': res.data.messageSound,
            'sos': res.data.sosSound,
          });
        }
        this.toast.success('Préférences sonores sauvegardées');
      },
      error: () => {
        this.saving.set(false);
        this.toast.error('Erreur lors de la sauvegarde');
      }
    });
  }
}
