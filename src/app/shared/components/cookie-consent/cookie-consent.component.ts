import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { LanguageService } from '../../../core/services/language.service';
import { VisitorService } from '../../../core/services/visitor.service';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs';

@Component({
  selector: 'app-cookie-consent',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  template: `
    @if (showBanner) {
    <div class="cookie-bar">
      <div class="cookie-bar-inner">
        <div class="cookie-bar-text">
          <span class="cookie-icon">🍪</span>
          <span>{{ langService.t('cookies.message_short') }}</span>
          <a routerLink="/confidentialite" class="cookie-link">{{ langService.t('cookies.learn_more') }}</a>
        </div>

        @if (expanded) {
        <div class="cookie-options">
          @for (cat of categories; track cat.key) {
          <label class="cookie-opt" [class.opt-disabled]="cat.required">
            <input type="checkbox" [checked]="cat.checked" [disabled]="cat.required"
                   (change)="toggle(cat.key, $any($event.target).checked)">
            <span class="opt-label">{{ cat.label }}</span>
          </label>
          }
        </div>
        }

        <div class="cookie-actions">
          @if (!expanded) {
          <button class="cb-btn cb-expand" (click)="expanded = true">{{ langService.t('cookies.customize') }}</button>
          }
          <button class="cb-btn cb-reject" (click)="rejectAll()">{{ langService.t('cookies.reject_all') }}</button>
          <button class="cb-btn cb-accept" (click)="acceptAll()">{{ langService.t('cookies.accept_all') }}</button>
        </div>
      </div>
    </div>
    }
  `,
  styleUrls: ['./cookie-consent.component.css']
})
export class CookieConsentComponent implements OnInit {
  langService = inject(LanguageService);
  private visitorService = inject(VisitorService);
  private router = inject(Router);

  showBanner = false;
  expanded = false;
  anonymousId = '';

  categories = [
    { key: 'necessary',  label: '🔒 Nécessaires',     checked: true,  required: true },
    { key: 'analytics',  label: '📊 Analytiques',     checked: true,  required: false },
    { key: 'marketing',  label: '📢 Marketing',       checked: true,  required: false },
    { key: 'functional', label: '⚙️ Fonctionnelles',  checked: true,  required: false },
  ];

  ngOnInit() {
    this.anonymousId = this.getOrCreateAnonymousId();
    const stored = localStorage.getItem('sw_cookie_consent');
    if (!stored) {
      setTimeout(() => { this.showBanner = true; }, 1500);
    } else {
      this.applyStored(stored);
      this.trackVisit();
    }

    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd)
    ).subscribe(() => {
      this.trackVisit();
    });
  }

  toggle(key: string, checked: boolean) {
    const cat = this.categories.find(c => c.key === key);
    if (cat && !cat.required) cat.checked = checked;
  }

  acceptAll() {
    this.categories.forEach(c => c.checked = true);
    this.save('all');
    this.showBanner = false;
    this.trackVisit();
    this.visitorService.updateCookies(this.anonymousId, true).subscribe();
  }

  rejectAll() {
    this.categories.forEach(c => { if (!c.required) c.checked = false; });
    this.save('rejected');
    this.showBanner = false;
    this.trackVisit();
    this.visitorService.updateCookies(this.anonymousId, false).subscribe();
  }

  private save(mode: string) {
    const prefs: Record<string, boolean> = {};
    this.categories.forEach(c => prefs[c.key] = c.checked);
    localStorage.setItem('sw_cookie_consent', JSON.stringify({ mode, prefs }));
  }

  private applyStored(stored: string) {
    try {
      const data = JSON.parse(stored);
      if (data.prefs) {
        this.categories.forEach(c => {
          if (data.prefs[c.key] !== undefined) c.checked = data.prefs[c.key];
        });
      }
    } catch {
      this.categories.forEach(c => c.checked = stored === 'all');
    }
  }

  private trackVisit() {
    const anyAccepted = this.categories.some(c => c.checked);
    this.visitorService.recordVisit({
      anonymousId: this.anonymousId,
      pageUrl: window.location.href,
      referrer: document.referrer || '',
      userAgent: navigator.userAgent,
      acceptedCookies: anyAccepted,
    }).subscribe({ error: () => {} });
  }

  private getOrCreateAnonymousId(): string {
    let id = localStorage.getItem('sw_anonymous_id');
    if (!id) {
      id = 'anon_' + Math.random().toString(36).substring(2) + Date.now().toString(36);
      localStorage.setItem('sw_anonymous_id', id);
    }
    return id;
  }
}
