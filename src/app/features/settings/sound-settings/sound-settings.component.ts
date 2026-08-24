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
  styleUrls: ['./sound-settings.component.css']
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
    { type: 'ride-rendered', label: 'Course rendue' },
    { type: 'message', label: 'Message' },
    { type: 'sos', label: 'SOS' },
  ];

  private selectedSounds: Record<SoundType, string> = {
    'ride-request': 'classic',
    'ride-accepted': 'success',
    'ride-cancelled': 'alert',
    'ride-completed': 'tada',
    'ride-rendered': 'transfer',
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
          this.selectedSounds['ride-rendered'] = d.rideRenderedSound || 'transfer';
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
      rideRenderedSound: this.selectedSounds['ride-rendered'],
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
            'ride-rendered': res.data.rideRenderedSound,
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
