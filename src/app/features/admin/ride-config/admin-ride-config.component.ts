import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RideService } from '../../../core/services/ride.service';
import { ToastService } from '../../../core/services/toast.service';
import { NotificationSoundService, SOUND_CATALOG, SoundType, SoundOption } from '../../../core/services/notification-sound.service';

@Component({
  selector: 'app-admin-ride-config',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page">
      <div class="page-header">
        <div>
          <h1>Configuration des courses</h1>
          <span class="subtitle">Paramètres liés à la recherche, annulation et sons</span>
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
              <input type="number" [(ngModel)]="searchTimeout" min="1" max="30" placeholder="3" />
              <span class="hint">Temps maximum qu'un passager attend un chauffeur.</span>
            </div>
            <div class="form-group">
              <label>Rayon de relance après refus (km)</label>
              <input type="number" [(ngModel)]="rebroadcastRadius" min="1" max="50" placeholder="2" />
              <span class="hint">Rayon de recherche autour du point de prise en charge.</span>
            </div>
          </div>
        </div>

        <div class="form-card">
          <h2>Sons de notification</h2>
          <div class="form-group">
            <label>Volume des notifications sonores</label>
            <div class="volume-row">
              <input type="range" [(ngModel)]="notificationVolume" min="0" max="1" step="0.05" />
              <span class="volume-value">{{ (notificationVolume * 100) | number:'1.0-0' }}%</span>
            </div>
          </div>

          <div class="sounds-grid">
            @for (entry of soundTypes; track entry.type) {
              <div class="sound-section">
                <h3>{{ entry.label }}</h3>
                <div class="sound-options">
                  @for (opt of getOptions(entry.type); track opt.id) {
                    <button
                      class="sound-option"
                      [class.active]="getSelected(entry.type) === opt.id"
                      (click)="selectSound(entry.type, opt.id)"
                    >
                      <span class="sound-label">{{ opt.label }}</span>
                      <button class="preview-btn" (click)="preview(entry.type, opt.id); $event.stopPropagation()" title="Écouter">
                        ▶
                      </button>
                    </button>
                  }
                </div>
              </div>
            }
          </div>

          <div class="form-group toggle-group">
            <label>Autoriser les utilisateurs à personnaliser leurs sons</label>
            <label class="toggle">
              <input type="checkbox" [(ngModel)]="userSoundConfigEnabled" />
              <span class="toggle-slider"></span>
            </label>
            <span class="hint">
              {{ userSoundConfigEnabled ? 'Les utilisateurs peuvent choisir leurs propres sons depuis leur profil.' : 'Seuls les sons par défaut sont utilisés.' }}
            </span>
          </div>
        </div>

        <div class="form-actions">
          <button class="btn-primary" (click)="save()">Enregistrer</button>
        </div>

        <div class="info-card">
          <h3>Comment ça fonctionne ?</h3>
          <ul>
            <li>Lorsqu'un passager crée une course, le système cherche automatiquement le chauffeur le plus proche.</li>
            <li>Si un chauffeur est trouvé, il a le délai configuré pour accepter ou refuser.</li>
            <li>En cas de <strong>refus</strong>, le système relance tous les chauffeurs disponibles dans le rayon configuré.</li>
            <li>Si le délai est dépassé sans réponse, la course est automatiquement relancée puis annulée.</li>
            <li>Les sons ci-dessus sont les <strong>sounds par défaut</strong>. Si la personnalisation est activée, chaque utilisateur peut les changer.</li>
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
    .form-group { display: flex; flex-direction: column; gap: 4px; margin-bottom: 1rem; }
    .form-group label { font-size: 0.85rem; font-weight: 600; color: #374151; }
    .form-group input[type="number"] { padding: 10px 12px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 0.9rem; }
    .form-group input:focus { outline: none; border-color: #2563eb; box-shadow: 0 0 0 3px rgba(37,99,235,0.1); }
    .hint { color: #9ca3af; font-size: 0.75rem; margin-top: 2px; }
    .volume-row { display: flex; align-items: center; gap: 12px; }
    .volume-row input[type="range"] { flex: 1; accent-color: #2563eb; }
    .volume-value { font-size: 0.9rem; font-weight: 600; color: #2563eb; min-width: 40px; }
    .sounds-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1.25rem; margin-top: 1rem; }
    .sound-section h3 { font-size: 0.85rem; font-weight: 600; color: #374151; margin: 0 0 8px; }
    .sound-options { display: flex; flex-direction: column; gap: 6px; }
    .sound-option {
      display: flex; align-items: center; justify-content: space-between;
      padding: 8px 12px; border: 1px solid #e5e7eb; border-radius: 8px;
      background: white; cursor: pointer; transition: all 0.15s;
    }
    .sound-option:hover { border-color: #93c5fd; background: #f0f7ff; }
    .sound-option.active { border-color: #2563eb; background: #eff6ff; }
    .sound-label { font-size: 0.85rem; font-weight: 500; color: #374151; }
    .preview-btn {
      background: none; border: 1px solid #d1d5db; border-radius: 6px;
      padding: 2px 8px; cursor: pointer; font-size: 0.75rem; color: #6b7280;
      transition: all 0.15s;
    }
    .preview-btn:hover { background: #f3f4f6; color: #374151; }
    .toggle-group { flex-direction: row; align-items: center; gap: 12px; }
    .toggle { position: relative; display: inline-block; width: 44px; height: 24px; cursor: pointer; }
    .toggle input { opacity: 0; width: 0; height: 0; }
    .toggle-slider {
      position: absolute; top: 0; left: 0; right: 0; bottom: 0;
      background: #ccc; border-radius: 24px; transition: 0.3s;
    }
    .toggle-slider::before {
      content: ''; position: absolute; width: 18px; height: 18px;
      left: 3px; bottom: 3px; background: white; border-radius: 50%; transition: 0.3s;
    }
    .toggle input:checked + .toggle-slider { background: #2563eb; }
    .toggle input:checked + .toggle-slider::before { transform: translateX(20px); }
    .form-actions { margin-bottom: 1.5rem; }
    .btn-primary { background: #2563eb; color: white; padding: 10px 24px; border: none; border-radius: 8px; font-weight: 600; cursor: pointer; }
    .btn-primary:hover { background: #1d4ed8; }
    .info-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 1.25rem; }
    .info-card h3 { margin: 0 0 0.75rem; font-size: 1rem; }
    .info-card ul { margin: 0; padding-left: 1.25rem; }
    .info-card li { font-size: 0.85rem; color: #64748b; margin-bottom: 4px; }
    .skeleton-card { height: 200px; background: #f3f4f6; border-radius: 12px; animation: pulse 1.5s infinite; }
    @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.5; } }
    @media (max-width: 640px) { .page { padding: 1rem; } .form-grid, .sounds-grid { grid-template-columns: 1fr; } }
  `]
})
export class AdminRideConfigComponent implements OnInit {
  loading = signal(true);
  searchTimeout = 3;
  rebroadcastRadius = 2;
  notificationVolume = 0.3;
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
    public soundService: NotificationSoundService
  ) {}

  ngOnInit() { this.loadSettings(); }

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
    this.soundService.setVolume(this.notificationVolume);
    this.soundService.preview(type, id);
  }

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
          if (res.data['ride.notification_volume']) {
            this.notificationVolume = parseFloat(res.data['ride.notification_volume']) || 0.3;
          }
          if (res.data['ride.user_sound_config_enabled']) {
            this.userSoundConfigEnabled = res.data['ride.user_sound_config_enabled'] === 'true';
          }
          if (res.data['ride.default_ride_request_sound']) {
            this.selectedSounds['ride-request'] = res.data['ride.default_ride_request_sound'];
          }
          if (res.data['ride.default_ride_accepted_sound']) {
            this.selectedSounds['ride-accepted'] = res.data['ride.default_ride_accepted_sound'];
          }
          if (res.data['ride.default_ride_cancelled_sound']) {
            this.selectedSounds['ride-cancelled'] = res.data['ride.default_ride_cancelled_sound'];
          }
          if (res.data['ride.default_ride_completed_sound']) {
            this.selectedSounds['ride-completed'] = res.data['ride.default_ride_completed_sound'];
          }
          if (res.data['ride.default_message_sound']) {
            this.selectedSounds['message'] = res.data['ride.default_message_sound'];
          }
          if (res.data['ride.default_sos_sound']) {
            this.selectedSounds['sos'] = res.data['ride.default_sos_sound'];
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

    const settings: Record<string, string> = {
      'ride.search_timeout_minutes': String(this.searchTimeout),
      'ride.rebroadcast_radius_km': String(this.rebroadcastRadius),
      'ride.notification_volume': String(this.notificationVolume),
      'ride.user_sound_config_enabled': String(this.userSoundConfigEnabled),
      'ride.default_ride_request_sound': this.selectedSounds['ride-request'],
      'ride.default_ride_accepted_sound': this.selectedSounds['ride-accepted'],
      'ride.default_ride_cancelled_sound': this.selectedSounds['ride-cancelled'],
      'ride.default_ride_completed_sound': this.selectedSounds['ride-completed'],
      'ride.default_message_sound': this.selectedSounds['message'],
      'ride.default_sos_sound': this.selectedSounds['sos'],
    };

    const keys = Object.keys(settings);
    let done = 0;
    let failed = false;

    keys.forEach(key => {
      this.rideService.updateSystemSetting(key, settings[key]).subscribe({
        next: () => {
          done++;
          if (done === keys.length && !failed) {
            this.toast.success('Configuration sauvegardée');
            this.loadSettings();
          }
        },
        error: () => {
          failed = true;
          this.toast.error('Erreur lors de la sauvegarde');
        }
      });
    });
  }
}
