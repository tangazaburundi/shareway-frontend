import { Component, inject } from '@angular/core';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { NavbarComponent } from './shared/components/navbar/navbar.component';
import { FooterComponent } from './shared/components/footer/footer.component';
import { AdSidebarComponent } from './shared/components/ad-sidebar/ad-sidebar.component';
import { AdBannerComponent } from './shared/components/ad-banner/ad-banner.component';
import { AdBottomBannerComponent } from './shared/components/ad-banner/ad-bottom-banner.component';
import { CookieConsentComponent } from './shared/components/cookie-consent/cookie-consent.component';
import { filter } from 'rxjs';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, NavbarComponent, FooterComponent, AdSidebarComponent, AdBannerComponent, AdBottomBannerComponent, CookieConsentComponent],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  private router = inject(Router);
  isHome = false;

  constructor() {
    this.router.events.pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd)).subscribe(e => {
      this.isHome = e.urlAfterRedirects === '/' || e.urlAfterRedirects === '';
    });
    this.isHome = this.router.url === '/' || this.router.url === '';
  }
}
