import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink } from '@angular/router';

import { LanguageService } from '../../../core/services/language.service';
import { AuthService } from '../../../core/services/auth.service';

interface NavItem {
  label: string;
  icon: string;
  path: string;
  roles?: string[];
}

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    RouterLink
  ],
  templateUrl: './layout.component.html',
  styleUrls: ['./layout.component.css']
})
export class LayoutComponent {

  collapsed = signal(false);

  navItems: NavItem[] = [
    { label: 'Tableau de bord', icon: '📊', path: 'dashboard' },
    { label: 'Utilisateurs', icon: '👥', path: 'users' },
    { label: 'Avis signalés', icon: '⭐', path: 'reviews' },
    { label: 'Messages', icon: '💬', path: 'messages' },
    { label: 'Signalements', icon: '🚨', path: 'reports' },
    { label: 'Journal d\'audit', icon: '📋', path: 'audit' },
    { label: 'Publicités', icon: '📢', path: 'advertising' },
    { label: 'Partenaires', icon: '🤝', path: 'partenaires' },
  ];

  constructor(private auth: AuthService) {}

  user = this.auth.currentUser;

  initials(): string {
    const u = this.user();
    if (!u) return '?';
    return `${u.firstName[0]}${u.lastName[0]}`.toUpperCase();
  }

  logout() {
    this.auth.logout();
  }
}