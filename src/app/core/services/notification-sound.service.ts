import { Injectable, signal } from '@angular/core';

export type SoundType = 'ride-request' | 'ride-accepted' | 'ride-cancelled' | 'ride-completed' | 'sos' | 'message';

export interface SoundOption {
  id: string;
  label: string;
}

export const SOUND_CATALOG: Record<SoundType, SoundOption[]> = {
  'ride-request': [
    { id: 'classic', label: 'Classique (3s)' },
    { id: 'urgent', label: 'Urgent (3s)' },
    { id: 'alarme', label: 'Alarme (3s)' },
    { id: 'police', label: 'Police' },
    { id: 'horror', label: 'Horreur' },
    { id: 'marimba', label: 'Marimba' },
    { id: 'doorbell', label: 'Sonnette' },
    { id: 'ring', label: 'Téléphone' },
    { id: 'siren-long', label: 'Sirène longue (3s)' },
    { id: 'vibrate', label: 'Vibration' },
  ],
  'ride-accepted': [
    { id: 'success', label: 'Succès' },
    { id: 'ding', label: 'Ding' },
    { id: 'fanfare', label: 'Fanfare' },
  ],
  'ride-cancelled': [
    { id: 'alert', label: 'Alerte' },
    { id: 'buzzer', label: 'Buzzer' },
    { id: 'low', label: 'Tombant' },
    { id: 'cry', label: 'Pleur' },
    { id: 'sigh', label: 'Soupir' },
    { id: 'thud', label: 'Sourde' },
    { id: 'fail', label: 'Echec' },
    { id: 'wah', label: 'Wah-wah' },
  ],
  'ride-completed': [
    { id: 'tada', label: 'Tada' },
    { id: 'done', label: 'Terminé' },
    { id: 'star', label: 'Etoile' },
    { id: 'bell', label: 'Clochette' },
    { id: 'applause', label: 'Applaudissement' },
    { id: 'cheer', label: 'Hourra' },
  ],
  'message': [
    { id: 'ping', label: 'Ping' },
    { id: 'pop', label: 'Pop' },
    { id: 'bubble', label: 'Bulle' },
  ],
  'sos': [
    { id: 'siren', label: 'Sirène' },
    { id: 'alarm', label: 'Alarme' },
  ],
};

@Injectable({ providedIn: 'root' })
export class NotificationSoundService {
  private ctx: AudioContext | null = null;
  private _enabled = signal(true);
  enabled = this._enabled.asReadonly();
  private _volume = signal(0.3);
  volume = this._volume.asReadonly();
  private lastPlayed = new Map<SoundType, number>();
  private readonly DEBOUNCE_MS = 1500;

  private _prefs = signal<Record<SoundType, string>>({
    'ride-request': 'classic',
    'ride-accepted': 'success',
    'ride-cancelled': 'alert',
    'ride-completed': 'tada',
    'message': 'ping',
    'sos': 'siren',
  });
  prefs = this._prefs.asReadonly();

  private async getCtx(): Promise<AudioContext | null> {
    try {
      if (!this.ctx || this.ctx.state === 'closed') {
        this.ctx = new AudioContext();
      }
      if (this.ctx.state === 'suspended') {
        await this.ctx.resume();
      }
      return this.ctx;
    } catch {
      return null;
    }
  }

  toggle(): void {
    this._enabled.update(v => !v);
  }

  setVolume(v: number): void {
    this._volume.set(Math.max(0, Math.min(1, v)));
  }

  setPrefs(p: Record<SoundType, string>): void {
    this._prefs.set(p);
  }

  play(type: SoundType): void {
    if (!this._enabled()) return;

    const now = Date.now();
    const last = this.lastPlayed.get(type) ?? 0;
    if (now - last < this.DEBOUNCE_MS) return;
    this.lastPlayed.set(type, now);

    const soundId = this._prefs()[type];

    this.getCtx().then(ctx => {
      if (!ctx) return;
      this.playSound(ctx, type, soundId);
    });
  }

  preview(type: SoundType, soundId: string): void {
    this.getCtx().then(ctx => {
      if (!ctx) return;
      this.playSound(ctx, type, soundId);
    });
  }

  private playSound(ctx: AudioContext, type: SoundType, soundId: string): void {
    const vol = this._volume();
    switch (type) {
      case 'ride-request':    this.playRideRequest(ctx, soundId, vol);    break;
      case 'ride-accepted':   this.playRideAccepted(ctx, soundId, vol);   break;
      case 'ride-cancelled':  this.playRideCancelled(ctx, soundId, vol);  break;
      case 'ride-completed':  this.playRideCompleted(ctx, soundId, vol);  break;
      case 'message':         this.playMessage(ctx, soundId, vol);        break;
      case 'sos':             this.playSOS(ctx, soundId, vol);            break;
    }
  }

  // ── ride-request ────────────────────────────────────────────────
  private playRideRequest(ctx: AudioContext, id: string, vol: number): void {
    const now = ctx.currentTime;
    switch (id) {
      case 'classic': {
        const totalDuration = 3;
        const beepDuration = 0.15;
        const silenceDuration = 0.15;
        const cycleDuration = beepDuration + silenceDuration;
        const repeatCount = Math.floor(totalDuration / cycleDuration);
        for (let i = 0; i < repeatCount; i++) {
          const delay = i * cycleDuration;
          const freq = i % 2 === 0 ? 880 : 1100;
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.value = freq;
          gain.gain.setValueAtTime(0, now + delay);
          gain.gain.linearRampToValueAtTime(vol, now + delay + 0.01);
          gain.gain.setValueAtTime(vol, now + delay + beepDuration - 0.02);
          gain.gain.exponentialRampToValueAtTime(0.001, now + delay + beepDuration);
          osc.connect(gain); gain.connect(ctx.destination);
          osc.start(now + delay); osc.stop(now + delay + beepDuration);
        }
        break;
      }
      case 'urgent': {
        const totalDuration = 3;
        const beepDur = 0.08;
        const gap = 0.07;
        const count = Math.floor(totalDuration / (beepDur + gap));
        for (let i = 0; i < count; i++) {
          const delay = i * (beepDur + gap);
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'square';
          osc.frequency.value = 1200;
          gain.gain.setValueAtTime(0, now + delay);
          gain.gain.linearRampToValueAtTime(vol * 0.6, now + delay + 0.005);
          gain.gain.exponentialRampToValueAtTime(0.001, now + delay + beepDur);
          osc.connect(gain); gain.connect(ctx.destination);
          osc.start(now + delay); osc.stop(now + delay + beepDur);
        }
        break;
      }
      case 'doorbell': {
        [0, 0.25].forEach((delay, i) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.value = i === 0 ? 660 : 550;
          gain.gain.setValueAtTime(vol * 0.5, now + delay);
          gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.4);
          osc.connect(gain); gain.connect(ctx.destination);
          osc.start(now + delay); osc.stop(now + delay + 0.45);
        });
        break;
      }
      case 'ring': {
        for (let ring = 0; ring < 2; ring++) {
          for (let i = 0; i < 4; i++) {
            const delay = ring * 0.8 + i * 0.1;
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.value = i % 2 === 0 ? 440 : 480;
            gain.gain.setValueAtTime(vol * 0.45, now + delay);
            gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.08);
            osc.connect(gain); gain.connect(ctx.destination);
            osc.start(now + delay); osc.stop(now + delay + 0.1);
          }
        }
        break;
      }
      case 'alarme': {
        for (let i = 0; i < 6; i++) {
          const delay = i * 0.45;
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(800, now + delay);
          osc.frequency.linearRampToValueAtTime(1200, now + delay + 0.2);
          osc.frequency.linearRampToValueAtTime(800, now + delay + 0.4);
          gain.gain.setValueAtTime(0, now + delay);
          gain.gain.linearRampToValueAtTime(vol * 0.5, now + delay + 0.01);
          gain.gain.setValueAtTime(vol * 0.5, now + delay + 0.35);
          gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.42);
          osc.connect(gain); gain.connect(ctx.destination);
          osc.start(now + delay); osc.stop(now + delay + 0.43);
        }
        break;
      }
      case 'police': {
        const totalDuration = 3;
        const beepDur = 0.12;
        const gap = 0.08;
        const count = Math.floor(totalDuration / (beepDur + gap));
        for (let i = 0; i < count; i++) {
          const delay = i * (beepDur + gap);
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'square';
          osc.frequency.value = i % 3 === 0 ? 700 : i % 3 === 1 ? 1000 : 1400;
          gain.gain.setValueAtTime(0, now + delay);
          gain.gain.linearRampToValueAtTime(vol * 0.45, now + delay + 0.005);
          gain.gain.exponentialRampToValueAtTime(0.001, now + delay + beepDur);
          osc.connect(gain); gain.connect(ctx.destination);
          osc.start(now + delay); osc.stop(now + delay + beepDur + 0.01);
        }
        break;
      }
      case 'horror': {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(200, now);
        osc.frequency.linearRampToValueAtTime(80, now + 2.5);
        gain.gain.setValueAtTime(vol * 0.35, now);
        gain.gain.setValueAtTime(vol * 0.35, now + 2.0);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 2.8);
        osc.connect(gain); gain.connect(ctx.destination);
        osc.start(now); osc.stop(now + 3);
        break;
      }
      case 'marimba': {
        const notes = [659, 784, 880, 784, 659, 523, 587, 659];
        notes.forEach((freq, i) => {
          const delay = i * 0.3;
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.value = freq;
          gain.gain.setValueAtTime(vol * 0.55, now + delay);
          gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.25);
          osc.connect(gain); gain.connect(ctx.destination);
          osc.start(now + delay); osc.stop(now + delay + 0.28);
        });
        break;
      }
      case 'siren-long': {
        for (let cycle = 0; cycle < 2; cycle++) {
          const offset = cycle * 1.5;
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(600, now + offset);
          osc.frequency.linearRampToValueAtTime(1200, now + offset + 0.6);
          osc.frequency.linearRampToValueAtTime(600, now + offset + 1.2);
          gain.gain.setValueAtTime(vol * 0.5, now + offset);
          gain.gain.setValueAtTime(vol * 0.5, now + offset + 1.0);
          gain.gain.exponentialRampToValueAtTime(0.001, now + offset + 1.3);
          osc.connect(gain); gain.connect(ctx.destination);
          osc.start(now + offset); osc.stop(now + offset + 1.35);
        }
        break;
      }
      case 'vibrate': {
        for (let i = 0; i < 15; i++) {
          const delay = i * 0.2;
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.value = 150;
          gain.gain.setValueAtTime(vol * 0.4, now + delay);
          gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.1);
          osc.connect(gain); gain.connect(ctx.destination);
          osc.start(now + delay); osc.stop(now + delay + 0.12);
        }
        break;
      }
    }
  }

  // ── ride-accepted ───────────────────────────────────────────────
  private playRideAccepted(ctx: AudioContext, id: string, vol: number): void {
    const now = ctx.currentTime;
    switch (id) {
      case 'success': {
        [0, 0.2].forEach((delay, i) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.value = i === 0 ? 523 : 659;
          gain.gain.setValueAtTime(vol * 0.85, now + delay);
          gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.2);
          osc.connect(gain); gain.connect(ctx.destination);
          osc.start(now + delay); osc.stop(now + delay + 0.25);
        });
        break;
      }
      case 'ding': {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.value = 1200;
        gain.gain.setValueAtTime(vol * 0.6, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
        osc.connect(gain); gain.connect(ctx.destination);
        osc.start(now); osc.stop(now + 0.65);
        break;
      }
      case 'fanfare': {
        const notes = [523, 659, 784, 1047];
        notes.forEach((freq, i) => {
          const delay = i * 0.15;
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'square';
          osc.frequency.value = freq;
          gain.gain.setValueAtTime(vol * 0.35, now + delay);
          gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.25);
          osc.connect(gain); gain.connect(ctx.destination);
          osc.start(now + delay); osc.stop(now + delay + 0.3);
        });
        break;
      }
    }
  }

  // ── ride-cancelled ──────────────────────────────────────────────
  private playRideCancelled(ctx: AudioContext, id: string, vol: number): void {
    const now = ctx.currentTime;
    switch (id) {
      case 'alert': {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(600, now);
        osc.frequency.linearRampToValueAtTime(300, now + 0.4);
        gain.gain.setValueAtTime(vol * 0.7, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
        osc.connect(gain); gain.connect(ctx.destination);
        osc.start(now); osc.stop(now + 0.5);
        break;
      }
      case 'buzzer': {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.value = 200;
        gain.gain.setValueAtTime(vol * 0.4, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
        osc.connect(gain); gain.connect(ctx.destination);
        osc.start(now); osc.stop(now + 0.55);
        break;
      }
      case 'low': {
        [0, 0.2].forEach((delay, i) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.value = i === 0 ? 400 : 300;
          gain.gain.setValueAtTime(vol * 0.5, now + delay);
          gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.25);
          osc.connect(gain); gain.connect(ctx.destination);
          osc.start(now + delay); osc.stop(now + delay + 0.3);
        });
        break;
      }
      case 'cry': {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, now);
        osc.frequency.linearRampToValueAtTime(400, now + 0.3);
        osc.frequency.linearRampToValueAtTime(700, now + 0.5);
        osc.frequency.linearRampToValueAtTime(350, now + 0.8);
        gain.gain.setValueAtTime(vol * 0.5, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.9);
        osc.connect(gain); gain.connect(ctx.destination);
        osc.start(now); osc.stop(now + 0.95);
        break;
      }
      case 'sigh': {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(500, now);
        osc.frequency.linearRampToValueAtTime(250, now + 0.6);
        gain.gain.setValueAtTime(vol * 0.4, now);
        gain.gain.linearRampToValueAtTime(vol * 0.3, now + 0.3);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.7);
        osc.connect(gain); gain.connect(ctx.destination);
        osc.start(now); osc.stop(now + 0.75);
        break;
      }
      case 'thud': {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(150, now);
        osc.frequency.exponentialRampToValueAtTime(40, now + 0.3);
        gain.gain.setValueAtTime(vol * 0.7, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
        osc.connect(gain); gain.connect(ctx.destination);
        osc.start(now); osc.stop(now + 0.45);
        break;
      }
      case 'fail': {
        const notes = [400, 350, 300];
        notes.forEach((freq, i) => {
          const delay = i * 0.25;
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'square';
          osc.frequency.value = freq;
          gain.gain.setValueAtTime(vol * 0.3, now + delay);
          gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.2);
          osc.connect(gain); gain.connect(ctx.destination);
          osc.start(now + delay); osc.stop(now + delay + 0.22);
        });
        break;
      }
      case 'wah': {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(600, now);
        osc.frequency.linearRampToValueAtTime(200, now + 0.4);
        osc.frequency.linearRampToValueAtTime(500, now + 0.6);
        osc.frequency.linearRampToValueAtTime(150, now + 0.9);
        gain.gain.setValueAtTime(vol * 0.4, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 1.0);
        osc.connect(gain); gain.connect(ctx.destination);
        osc.start(now); osc.stop(now + 1.05);
        break;
      }
    }
  }

  // ── ride-completed ──────────────────────────────────────────────
  private playRideCompleted(ctx: AudioContext, id: string, vol: number): void {
    const now = ctx.currentTime;
    switch (id) {
      case 'tada': {
        const notes = [523, 659, 784, 1047];
        notes.forEach((freq, i) => {
          const delay = i * 0.12;
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.value = freq;
          gain.gain.setValueAtTime(vol * 0.6, now + delay);
          gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.4);
          osc.connect(gain); gain.connect(ctx.destination);
          osc.start(now + delay); osc.stop(now + delay + 0.45);
        });
        break;
      }
      case 'done': {
        [0, 0.15].forEach((delay, i) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.value = i === 0 ? 880 : 1100;
          gain.gain.setValueAtTime(vol * 0.65, now + delay);
          gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.3);
          osc.connect(gain); gain.connect(ctx.destination);
          osc.start(now + delay); osc.stop(now + delay + 0.35);
        });
        break;
      }
      case 'star': {
        const notes = [784, 988, 1175, 1319];
        notes.forEach((freq, i) => {
          const delay = i * 0.18;
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.value = freq;
          gain.gain.setValueAtTime(vol * 0.5, now + delay);
          gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.35);
          osc.connect(gain); gain.connect(ctx.destination);
          osc.start(now + delay); osc.stop(now + delay + 0.38);
        });
        break;
      }
      case 'bell': {
        for (let i = 0; i < 3; i++) {
          const delay = i * 0.3;
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.value = 2000;
          gain.gain.setValueAtTime(vol * 0.4, now + delay);
          gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.25);
          osc.connect(gain); gain.connect(ctx.destination);
          osc.start(now + delay); osc.stop(now + delay + 0.28);
        }
        break;
      }
      case 'applause': {
        for (let i = 0; i < 12; i++) {
          const delay = i * 0.06 + Math.random() * 0.02;
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.value = 3000 + Math.random() * 2000;
          gain.gain.setValueAtTime(vol * 0.15, now + delay);
          gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.05);
          osc.connect(gain); gain.connect(ctx.destination);
          osc.start(now + delay); osc.stop(now + delay + 0.06);
        }
        break;
      }
      case 'cheer': {
        const notes = [523, 659, 784, 659, 784, 1047];
        notes.forEach((freq, i) => {
          const delay = i * 0.15;
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.value = freq;
          gain.gain.setValueAtTime(vol * 0.5, now + delay);
          gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.2);
          osc.connect(gain); gain.connect(ctx.destination);
          osc.start(now + delay); osc.stop(now + delay + 0.22);
        });
        break;
      }
    }
  }

  // ── message ─────────────────────────────────────────────────────
  private playMessage(ctx: AudioContext, id: string, vol: number): void {
    const now = ctx.currentTime;
    switch (id) {
      case 'ping': {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.value = 800;
        gain.gain.setValueAtTime(vol * 0.5, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
        osc.connect(gain); gain.connect(ctx.destination);
        osc.start(now); osc.stop(now + 0.35);
        break;
      }
      case 'pop': {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.value = 600;
        gain.gain.setValueAtTime(vol * 0.6, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
        osc.connect(gain); gain.connect(ctx.destination);
        osc.start(now); osc.stop(now + 0.2);
        break;
      }
      case 'bubble': {
        [600, 900].forEach((freq, i) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.value = freq;
          gain.gain.setValueAtTime(vol * 0.4, now + i * 0.1);
          gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.1 + 0.2);
          osc.connect(gain); gain.connect(ctx.destination);
          osc.start(now + i * 0.1); osc.stop(now + i * 0.1 + 0.25);
        });
        break;
      }
    }
  }

  // ── sos ─────────────────────────────────────────────────────────
  private playSOS(ctx: AudioContext, id: string, vol: number): void {
    const now = ctx.currentTime;
    switch (id) {
      case 'siren': {
        for (let group = 0; group < 2; group++) {
          for (let i = 0; i < 3; i++) {
            const delay = group * 0.6 + i * 0.12;
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'square';
            osc.frequency.value = 1000;
            gain.gain.setValueAtTime(vol * 0.7, now + delay);
            gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.08);
            osc.connect(gain); gain.connect(ctx.destination);
            osc.start(now + delay); osc.stop(now + delay + 0.1);
          }
        }
        break;
      }
      case 'alarm': {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(800, now);
        osc.frequency.linearRampToValueAtTime(1200, now + 0.3);
        osc.frequency.linearRampToValueAtTime(800, now + 0.6);
        gain.gain.setValueAtTime(vol * 0.5, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);
        osc.connect(gain); gain.connect(ctx.destination);
        osc.start(now); osc.stop(now + 0.85);
        break;
      }
    }
  }
}
