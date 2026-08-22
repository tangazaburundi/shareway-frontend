import { Injectable, signal, computed } from '@angular/core';

export type AppMode = 'covoiturage' | 'taxi';

@Injectable({ providedIn: 'root' })
export class AppModeService {
  private readonly STORAGE_KEY = 'shareway_app_mode';
  private _mode = signal<AppMode>(this.load());

  mode = this._mode.asReadonly();
  isTaxi = computed(() => this._mode() === 'taxi');
  isCovoiturage = computed(() => this._mode() === 'covoiturage');

  setMode(mode: AppMode): void {
    this._mode.set(mode);
    localStorage.setItem(this.STORAGE_KEY, mode);
  }

  toggleMode(): void {
    this.setMode(this._mode() === 'taxi' ? 'covoiturage' : 'taxi');
  }

  private load(): AppMode {
    const stored = localStorage.getItem(this.STORAGE_KEY);
    if (stored === 'taxi' || stored === 'covoiturage') return stored;
    return 'covoiturage';
  }
}
