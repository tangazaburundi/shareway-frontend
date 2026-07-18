import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdvertisingService } from '../../../core/services/advertising.service';
import { LanguageService } from '../../../core/services/language.service';
import { Advertising } from '../../../core/models/advertising.model';

@Component({
  selector: 'app-ad-bottom-banner',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (ad) {
      <div class="ad-bottom-banner">
        <div class="ad-bottom-banner__content" (click)="onAdClick()">
          <img
            *ngIf="ad.imageUrl"
            [src]="ad.imageUrl"
            [alt]="ad.title"
            class="ad-bottom-banner__icon"
          />
          <div class="ad-bottom-banner__text">
            <span class="ad-bottom-banner__label">{{ lang.t('ad.sponsored') }}</span>
            <span class="ad-bottom-banner__title">{{ ad.title }}</span>
            <span *ngIf="ad.description" class="ad-bottom-banner__desc">{{ ad.description }}</span>
          </div>
        </div>
        <button class="ad-bottom-banner__close" (click)="dismiss($event)" aria-label="Close">✕</button>
      </div>
    }
  `,
  styles: [`
    :host { display: block; width: 100%; }
    .ad-bottom-banner {
      display: flex;
      align-items: center;
      justify-content: space-between;
      max-height: 40px;
      padding: 4px 12px;
      background: linear-gradient(135deg, #e3f2fd, #f3e5f5);
      border-top: 1px solid #bbdefb;
      font-size: 13px;
      overflow: hidden;
    }
    .ad-bottom-banner__content {
      display: flex;
      align-items: center;
      gap: 8px;
      cursor: pointer;
      min-width: 0;
      flex: 1;
      overflow: hidden;
    }
    .ad-bottom-banner__icon {
      width: 24px;
      height: 24px;
      border-radius: 4px;
      object-fit: cover;
      flex-shrink: 0;
    }
    .ad-bottom-banner__text {
      display: flex;
      align-items: center;
      gap: 6px;
      min-width: 0;
      overflow: hidden;
      white-space: nowrap;
    }
    .ad-bottom-banner__label {
      font-size: 10px;
      text-transform: uppercase;
      color: #1565c0;
      font-weight: 700;
      letter-spacing: 0.5px;
      flex-shrink: 0;
    }
    .ad-bottom-banner__title {
      font-weight: 600;
      color: #333;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .ad-bottom-banner__desc {
      color: #666;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .ad-bottom-banner__close {
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
    .ad-bottom-banner__close:hover { color: #333; background: rgba(0,0,0,0.06); }
  `]
})
export class AdBottomBannerComponent implements OnInit {
  private advertisingService = inject(AdvertisingService);
  lang = inject(LanguageService);

  ad: Advertising | null = null;

  ngOnInit(): void {
    this.advertisingService.getActiveAdsByPosition('BOTTOM_BANNER').subscribe({
      next: ads => this.assignAd(ads)
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
