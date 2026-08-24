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
            <div class="form-group">
              <label>Pénalité après annulation/rendu (minutes)</label>
              <input type="number" [(ngModel)]="driverCooldown" min="0" max="120" />
              <span class="hint">Durée pendant laquelle un chauffeur ne peut pas se remettre en ligne après avoir rendu ou annulé une course acceptée. 0 = désactivé.</span>
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
  styleUrls: ['./admin-ride-config.component.css']
})
export class AdminRideConfigComponent implements OnInit {
  loading = signal(true);
  searchTimeout = 3;
  rebroadcastRadius = 2;
  driverCooldown = 15;
  notificationVolume = 0.3;
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
          if (res.data['ride.driver_cooldown_minutes']) {
            this.driverCooldown = parseInt(res.data['ride.driver_cooldown_minutes'], 10) || 15;
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
          if (res.data['ride.default_ride_rendered_sound']) {
            this.selectedSounds['ride-rendered'] = res.data['ride.default_ride_rendered_sound'];
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
    if (this.driverCooldown < 0 || this.driverCooldown > 120) {
      this.toast.error('Le délai de pénalité doit être entre 0 et 120 minutes');
      return;
    }

    const settings: Record<string, string> = {
      'ride.search_timeout_minutes': String(this.searchTimeout),
      'ride.rebroadcast_radius_km': String(this.rebroadcastRadius),
      'ride.driver_cooldown_minutes': String(this.driverCooldown),
      'ride.notification_volume': String(this.notificationVolume),
      'ride.user_sound_config_enabled': String(this.userSoundConfigEnabled),
      'ride.default_ride_request_sound': this.selectedSounds['ride-request'],
      'ride.default_ride_accepted_sound': this.selectedSounds['ride-accepted'],
      'ride.default_ride_cancelled_sound': this.selectedSounds['ride-cancelled'],
      'ride.default_ride_completed_sound': this.selectedSounds['ride-completed'],
      'ride.default_ride_rendered_sound': this.selectedSounds['ride-rendered'],
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
