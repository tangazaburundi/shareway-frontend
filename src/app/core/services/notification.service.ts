import { Injectable, signal, inject } from '@angular/core';
import { UserService } from './user.service';
import { Notification } from '../models/user.model';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private userService = inject(UserService);
  private _notifications = signal<Notification[]>([]);

  notifications = this._notifications.asReadonly();
  unreadCount = () => this._notifications().filter(n => !n.read).length;

  load(): void {
    this.userService.getNotifications().subscribe({
      next: (res) => this._notifications.set(res.data || [])
    });
  }

  markAllRead(): void {
    const ids = this._notifications().filter(n => !n.read).map(n => n.id);
    if (!ids.length) return;
    this.userService.markNotificationsRead(ids).subscribe(() => {
      this._notifications.update(ns => ns.map(n => ({ ...n, read: true })));
    });
  }

  addLocal(notif: Notification): void {
    this._notifications.update(ns => [notif, ...ns]);
  }
}
