import { Injectable, signal } from '@angular/core';

export type SoundType = 'ride-request' | 'ride-accepted' | 'ride-cancelled' | 'sos' | 'message';

@Injectable({ providedIn: 'root' })
export class NotificationSoundService {
  private ctx: AudioContext | null = null;
  private _enabled = signal(true);
  enabled = this._enabled.asReadonly();
  private lastPlayed = new Map<SoundType, number>();
  private readonly DEBOUNCE_MS = 1500;

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

  play(type: SoundType): void {
    if (!this._enabled()) return;

    const now = Date.now();
    const last = this.lastPlayed.get(type) ?? 0;
    if (now - last < this.DEBOUNCE_MS) return;
    this.lastPlayed.set(type, now);

    this.getCtx().then(ctx => {
      if (!ctx) return;
      switch (type) {
        case 'ride-request':   this.playRideRequest(ctx);   break;
        case 'ride-accepted':  this.playRideAccepted(ctx);  break;
        case 'ride-cancelled': this.playRideCancelled(ctx);  break;
        case 'sos':            this.playSOS(ctx);            break;
        case 'message':        this.playMessage(ctx);        break;
      }
    });
  }

  private playRideRequest(ctx: AudioContext): void {
    const now = ctx.currentTime;
    [0, 0.15, 0.30].forEach((delay, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = 880 + i * 220;
      gain.gain.setValueAtTime(0.3, now + delay);
      gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.12);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + delay);
      osc.stop(now + delay + 0.15);
    });
  }

  private playRideAccepted(ctx: AudioContext): void {
    const now = ctx.currentTime;
    [0, 0.2].forEach((delay, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = i === 0 ? 523 : 659;
      gain.gain.setValueAtTime(0.25, now + delay);
      gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.2);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + delay);
      osc.stop(now + delay + 0.25);
    });
  }

  private playRideCancelled(ctx: AudioContext): void {
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, now);
    osc.frequency.linearRampToValueAtTime(300, now + 0.4);
    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.5);
  }

  private playSOS(ctx: AudioContext): void {
    const now = ctx.currentTime;
    for (let group = 0; group < 2; group++) {
      for (let i = 0; i < 3; i++) {
        const delay = group * 0.6 + i * 0.12;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'square';
        osc.frequency.value = 1000;
        gain.gain.setValueAtTime(0.2, now + delay);
        gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.08);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + delay);
        osc.stop(now + delay + 0.1);
      }
    }
  }

  private playMessage(ctx: AudioContext): void {
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = 800;
    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.35);
  }
}
