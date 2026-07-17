import { Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { NotificationService } from '../../core/services/notification.service';
import { LanguageService } from '../../core/services/language.service';
import { TimeAgoPipe } from '../../shared/pipes/time-ago.pipe';
//import { NotificationActionService } from '../../core/services/notificationaction.service';


@Component({ selector: 'app-notifications', standalone: true,
  imports: [CommonModule, RouterLink, TimeAgoPipe],
  templateUrl: './notifications.component.html', styleUrls: ['./notifications.component.css'] })


export class NotificationsComponent implements OnInit {
  notifService = inject(NotificationService);
  langService = inject(LanguageService);
  //actionService =  inject(NotificationActionService);
  ngOnInit() { this.notifService.load(); }

  typeIcon(type: string): string {
    return { BOOKING: '🎫', CANCELLATION: '❌', MESSAGE: '💬', REVIEW: '⭐', SYSTEM: '📢' }[type] ?? '🔔';
  }


/*
  onClick(n: any) {
    this.actionService.handle(n);
  } */
}