import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdvertisingService } from '../../../core/services/advertising.service';
import { LanguageService } from '../../../core/services/language.service';
import { Advertising } from '../../../core/models/advertising.model';

@Component({
  selector: 'app-ad-banner',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (ad) {
      <div class="ad-banner">
        <div class="ad-banner__content" (click)="onAdClick()">
          <img
            *ngIf="ad.imageUrl"
            [src]="ad.imageUrl"
            [alt]="ad.title"
            class="ad-banner__icon"
          />
          <div class="ad-banner__text">
            <span class="ad-banner__label">{{ lang.t('ad.sponsored') }}</span>
            <span class="ad-banner__title">{{ ad.title }}</span>
            <span *ngIf="ad.description" class="ad-banner__desc">{{ ad.description }}</span>
          </div>
        </div>
        <button class="ad-banner__close" (click)="dismiss($event)" aria-label="Close">✕</button>
      </div>
    }
  `,
  styles: [`
    :host { display: block; width: 100%; }
    .ad-banner {
      display: flex;
      align-items: center;
      justify-content: space-between;
      max-height: 40px;
      padding: 4px 12px;
      background: linear-gradient(135deg, #e8f5e9, #f1f8e9);
      border-bottom: 1px solid #c8e6c9;
      font-size: 13px;
      overflow: hidden;
    }
    .ad-banner__content {
      display: flex;
      align-items: center;
      gap: 8px;
      cursor: pointer;
      min-width: 0;
      flex: 1;
      overflow: hidden;
    }
    .ad-banner__icon {
      width: 24px;
      height: 24px;
      border-radius: 4px;
      object-fit: cover;
      flex-shrink: 0;
    }
    .ad-banner__text {
      display: flex;
      align-items: center;
      gap: 6px;
      min-width: 0;
      overflow: hidden;
      white-space: nowrap;
    }
    .ad-banner__label {
      font-size: 10px;
      text-transform: uppercase;
      color: #689f38;
      font-weight: 700;
      letter-spacing: 0.5px;
      flex-shrink: 0;
    }
    .ad-banner__title {
      font-weight: 600;
      color: #333;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .ad-banner__desc {
      color: #666;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .ad-banner__close {
      background: none;
      border: none;
      font-size: 14px;
      color: #999;
      cursor: pointer;
      padding: 2px 6px;
      border-radius: 4px;
      flex-shrink: 0;
      line-height: 1;
    }
    .ad-banner__close:hover { color: #333; background: rgba(0,0,0,0.06); }
  `]
})
export class AdBannerComponent implements OnInit {
  private advertisingService = inject(AdvertisingService);
  lang = inject(LanguageService);

  ad: Advertising | null = null;

  ngOnInit(): void {
    this.advertisingService.getActiveAdsByPosition('TOP_BANNER').subscribe({
      next: ads => {
        if (!ads.length) {
          this.advertisingService.getActiveAdsByPosition('POPUP').subscribe({
            next: popupAds => this.assignAd(popupAds)
          });
          return;
        }
        this.assignAd(ads);
      }
    });
  }

  private assignAd(ads: Advertising[]): void {
    const candidate = ads[0];
    if (candidate && !this.isDismissed(candidate.id)) {
      this.ad = candidate;
    }
  }

  dismiss(event: MouseEvent): void {
    event.stopPropagation();
    if (this.ad) {
      localStorage.setItem(`sw_ad_dismissed_${this.ad.id}`, '1');
      this.ad = null;
    }
  }

  onAdClick(): void {
    if (!this.ad) return;
    this.advertisingService.recordClick(this.ad.id).subscribe();
    if (this.ad.linkUrl) {
      window.open(this.ad.linkUrl, '_blank', 'noopener');
    }
  }

  private isDismissed(id: string): boolean {
    return localStorage.getItem(`sw_ad_dismissed_${id}`) === '1';
  }
}
