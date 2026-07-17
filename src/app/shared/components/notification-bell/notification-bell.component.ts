import { Component, inject, HostListener } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { NotificationService } from '../../../core/services/notification.service';
import { LanguageService } from '../../../core/services/language.service';
import { TimeAgoPipe } from '../../pipes/time-ago.pipe';
//import { NotificationActionService } from '../../../core/services/notificationaction.service';

@Component({ selector: 'app-notification-bell', standalone: true,
  imports: [CommonModule, RouterLink, TimeAgoPipe],
  templateUrl: './notification-bell.component.html', styleUrls: ['./notification-bell.component.css'] })
export class NotificationBellComponent {
  notifService = inject(NotificationService);
  //actionService =  inject(NotificationActionService);
  langService = inject(LanguageService);
  open = false;

  toggle(): void { this.open = !this.open; if (this.open) this.notifService.load(); }

  markAll(): void { this.notifService.markAllRead(); }

  typeIcon(type: string): string {
    return { BOOKING: '🎫', CANCELLATION: '❌', MESSAGE: '💬', REVIEW: '⭐', SYSTEM: '📢' }[type] ?? '🔔';
  }

  @HostListener('document:click', ['$event'])
  onDocClick(e: Event): void {
    if (!(e.target as Element).closest('app-notification-bell')) this.open = false;
  }

    /* onClick(n: any) {
      this.actionService.handle(n);
    } */
}