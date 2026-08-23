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
  styleUrls: ['./ad-banner.component.css']
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
