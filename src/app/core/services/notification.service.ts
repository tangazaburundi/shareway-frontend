import { Injectable, signal, inject } from '@angular/core';
import { UserService } from './user.service';
import { WebSocketService } from './websocket.service';
import { AuthService } from './auth.service';
import { Notification } from '../models/user.model';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private userService = inject(UserService);
  private wsService = inject(WebSocketService);
  private auth = inject(AuthService);
  private _notifications = signal<Notification[]>([]);

  notifications = this._notifications.asReadonly();
  unreadCount = () => this._notifications().filter(n => !n.read).length;

  init(): void {
    const token = this.auth.getToken();
    if (!token) return;

    this.wsService.connect(token);
    this.wsService.subscribe<any>('/user/queue/notifications').subscribe(msg => {
      if (msg) {
        this._notifications.update(ns => [msg, ...ns]);
      }
    });
  }

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
