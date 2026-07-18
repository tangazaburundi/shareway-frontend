import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LanguageService } from '../../../core/services/language.service';
import { AdvertisingService } from '../../../core/services/advertising.service';
import { Advertising } from '../../../core/models/advertising.model';

@Component({
  selector: 'app-ad-sidebar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './ad-sidebar.component.html',
  styleUrls: ['./ad-sidebar.component.css']
})
export class AdSidebarComponent implements OnInit {
  langService = inject(LanguageService);
  private adService = inject(AdvertisingService);

  sidebarAds = signal<Advertising[]>([]);

  ngOnInit() {
    this.loadAds();
  }

  private loadAds() {
    this.adService.getActiveAds().subscribe({
      next: (ads) => {
        this.sidebarAds.set(ads.filter(a =>
          a.position === 'SIDEBAR_TOP' || a.position === 'SIDEBAR_MIDDLE' || a.position === 'SIDEBAR_BOTTOM'
        ));
      },
      error: () => {}
    });
  }

  trackClick(ad: Advertising) {
    if (ad.linkUrl) {
      window.open(ad.linkUrl, '_blank');
    }
    this.adService.recordClick(ad.id).subscribe();
  }
}
