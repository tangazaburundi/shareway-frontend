import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { LanguageService } from '../../../core/services/language.service';
import { VisitorService } from '../../../core/services/visitor.service';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs';
import { LucideIconsDirective } from '../../../shared/directives/lucide-icons.directive';

interface CookieCategory {
  key: string;
  label: string;
  description: string;
  checked: boolean;
  required: boolean;
}

@Component({
  selector: 'app-cookie-consent',
  standalone: true,
  imports: [CommonModule, RouterLink, LucideIconsDirective],
  template: `
    @if (showBanner) {
    <div class="banner-overlay" lucideIcons>
      <div class="cookie-content">

        <div class="header-row">
          <i data-lucide="cookie" class="header-icon"></i>
          <h3>{{ langService.t('cookies.title') }}</h3>
        </div>

        <p class="description">
          {{ langService.t('cookies.message') }}
          <a routerLink="/confidentialite">{{ langService.t('cookies.learn_more') }}</a>
        </p>

        <p class="change-anytime">
          <i data-lucide="info" class="info-icon"></i>
          {{ langService.t('cookies.change_anytime') }}
        </p>

        <div class="categories">
          @for (cat of categories; track cat.key) {
          <div class="category-item" [class.always-on]="cat.required">
            <label class="toggle-wrap" [class.disabled]="cat.required">
              <input type="checkbox"
                     [checked]="cat.checked"
                     [disabled]="cat.required"
                     (change)="toggle(cat.key, $any($event.target).checked)">
              <span class="toggle-slider"></span>
            </label>
            <div>
              <span class="category-label">{{ cat.label }}</span>
              <span class="category-desc">{{ cat.description }}</span>
            </div>
          </div>
          }
        </div>

        <div class="actions">
          <button class="btn-action reject" (click)="rejectAll()">{{ langService.t('cookies.reject_all') }}</button>
          <button class="btn-action selection" (click)="acceptSelection()">{{ langService.t('cookies.accept_selection') }}</button>
          <button class="btn-action accept" (click)="acceptAll()">{{ langService.t('cookies.accept_all') }}</button>
        </div>
      </div>
    </div>
    }
  `,
  styles: [`
    .banner-overlay {
      position: fixed;
      bottom: 0; left: 0; right: 0;
      background: rgba(15, 23, 42, 0.92);
      backdrop-filter: blur(10px);
      z-index: 9999;
      padding: 20px 24px;
      animation: slideUp 0.3s ease-out;
      box-shadow: 0 -4px 20px rgba(0,0,0,0.2);
    }
    @keyframes slideUp {
      from { transform: translateY(100%); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }
    .cookie-content { max-width: 1100px; margin: 0 auto; }

    .header-row {
      display: flex; align-items: center; gap: 10px; margin-bottom: 12px;
    }
    .header-icon { width: 24px; height: 24px; color: #fbbf24; }
    h3 { margin: 0; color: #fff; font-size: 1.05rem; font-weight: 600; }

    .description {
      color: rgba(255,255,255,0.8); font-size: 0.85rem; line-height: 1.5; margin-bottom: 14px;
    }
    .description a { color: #90cdf4; text-decoration: underline; cursor: pointer; }

    .change-anytime {
      display: flex; align-items: center; gap: 6px;
      color: rgba(255,255,255,0.55); font-size: 0.78rem; margin-bottom: 14px;
    }
    .info-icon { width: 14px; height: 14px; }

    .categories {
      display: flex; flex-wrap: wrap; gap: 12px; margin-bottom: 16px;
    }
    .category-item {
      display: flex; align-items: center; gap: 10px;
      padding: 10px 14px; background: rgba(255,255,255,0.07);
      border-radius: 10px; min-width: 180px;
    }
    .category-item.always-on { opacity: 0.6; }
    .category-label { color: #fff; font-size: 0.85rem; font-weight: 500; display: block; }
    .category-desc { color: rgba(255,255,255,0.55); font-size: 0.72rem; display: block; }

    .toggle-wrap {
      position: relative; display: inline-block; width: 40px; height: 22px; flex-shrink: 0;
    }
    .toggle-wrap.disabled { cursor: not-allowed; }
    .toggle-wrap input { opacity: 0; width: 0; height: 0; }
    .toggle-slider {
      position: absolute; inset: 0; background: #475569; border-radius: 22px;
      transition: background 0.2s; cursor: pointer;
    }
    .toggle-slider::before {
      content: ''; position: absolute; width: 16px; height: 16px;
      left: 3px; bottom: 3px; background: white; border-radius: 50%;
      transition: transform 0.2s;
    }
    .toggle-wrap input:checked + .toggle-slider { background: #1a8b82; }
    .toggle-wrap input:checked + .toggle-slider::before { transform: translateX(18px); }
    .toggle-wrap input:disabled + .toggle-slider { opacity: 0.5; cursor: not-allowed; }

    .actions {
      display: flex; flex-wrap: wrap; gap: 8px; justify-content: flex-end;
    }
    .btn-action {
      padding: 10px 22px; border-radius: 8px; font-size: 0.8rem; font-weight: 600;
      cursor: pointer; border: none; text-transform: uppercase; letter-spacing: 0.5px;
      transition: all 0.2s;
    }
    .btn-action.reject {
      background: transparent; color: #94a3b8; border: 1px solid #475569;
    }
    .btn-action.reject:hover { color: #e2e8f0; border-color: #94a3b8; }
    .btn-action.selection {
      background: transparent; color: #fbbf24; border: 1px solid #fbbf24;
    }
    .btn-action.selection:hover { background: rgba(251,191,36,0.1); }
    .btn-action.accept {
      background: #1a8b82; color: white;
    }
    .btn-action.accept:hover { background: #147068; }

    @media (max-width: 768px) {
      .banner-overlay { padding: 14px 16px; }
      .categories { flex-direction: column; gap: 8px; }
      .category-item { min-width: 0; width: 100%; }
      .actions { flex-direction: column; }
      .btn-action { width: 100%; text-align: center; }
    }
  `]
})
export class CookieConsentComponent implements OnInit {
  langService = inject(LanguageService);
  private visitorService = inject(VisitorService);
  private router = inject(Router);

  showBanner = false;
  anonymousId = '';

  categories: CookieCategory[] = [
    { key: 'necessary',  label: 'Nécessaires',     description: 'Fonctionnement du site',        checked: true,  required: true },
    { key: 'analytics',  label: 'Analytiques',      description: 'Audience et statistiques',      checked: true,  required: false },
    { key: 'marketing',  label: 'Marketing',        description: 'Publicité ciblée',              checked: true,  required: false },
    { key: 'functional', label: 'Fonctionnelles',   description: 'Préférences utilisateur',       checked: true,  required: false },
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

  acceptSelection() {
    this.save('selection');
    this.showBanner = false;
    this.trackVisit();
    const anyAccepted = this.categories.some(c => c.key !== 'necessary' && c.checked);
    this.visitorService.updateCookies(this.anonymousId, anyAccepted).subscribe();
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
