import { Component, inject, HostListener } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';
import { LanguageService } from '../../../core/services/language.service';
import { LanguageSwitcherComponent } from '../language-switcher/language-switcher.component';
import { NotificationBellComponent } from '../notification-bell/notification-bell.component';

@Component({ selector: 'app-navbar', standalone: true,
  imports: [RouterLink, RouterLinkActive, CommonModule, LanguageSwitcherComponent, NotificationBellComponent],
  templateUrl: './navbar.component.html', styleUrls: ['./navbar.component.css'] })
export class NavbarComponent {
  auth = inject(AuthService);
  langService = inject(LanguageService);
  menuOpen = false; mobileOpen = false;

  get isDriver() {
    const r = this.auth.currentUser()?.role;
    return r === 'DRIVER' || r === 'BOTH';
  }

   get user() {
     return this.auth.currentUser();
   }

  get isAdmin() {
    const r = this.auth.currentUser()?.systemRole;
   // console.log("user",this.auth.currentUser());
    return r === 'SUPER_ADMIN' || r === 'ADMIN';
  }

  get isPassenger() {
    const r = this.auth.currentUser()?.role;
    return r === 'PASSENGER';
  }
  toggleMenu() { this.menuOpen = !this.menuOpen; }
  toggleMobile() { this.mobileOpen = !this.mobileOpen; }

  @HostListener('document:click', ['$event'])
  onDocClick(e: Event) {
    if (!(e.target as Element).closest('.nav-user')) this.menuOpen = false;
  }
}