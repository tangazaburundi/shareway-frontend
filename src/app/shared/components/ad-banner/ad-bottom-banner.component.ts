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
  styleUrls: ['./ad-bottom-banner.component.css']
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
