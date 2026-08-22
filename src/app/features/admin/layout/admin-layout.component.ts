import { Component, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, NavigationEnd } from '@angular/router';
import { AdminService } from '../../../core/services/admin.service';
import { WebSocketService } from '../../../core/services/websocket.service';
import { NotificationSoundService } from '../../../core/services/notification-sound.service';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="admin-layout">
      <aside class="sidebar">
        <div class="logo">🛠️ Shareway <span>Admin</span></div>
        <nav>
          <a class="nav-item" routerLink="/admin/dashboard" routerLinkActive="active">
            📊 Dashboard
          </a>
          <a class="nav-item" routerLink="/admin/users" routerLinkActive="active">
            👥 Utilisateurs
          </a>
          <a class="nav-item" routerLink="/admin/documents" routerLinkActive="active">
            📄 Documents
          </a>
          <a class="nav-item" routerLink="/admin/trips" routerLinkActive="active">
            🚗 Courses
          </a>
          <a class="nav-item" routerLink="/admin/ride-config" routerLinkActive="active">
            ⚙️ Config courses
          </a>
          <a class="nav-item" routerLink="/admin/pricing-config" routerLinkActive="active">
            💰 Tarification
          </a>
          <a class="nav-item" routerLink="/admin/sms-config" routerLinkActive="active">
            📱 SMS
          </a>
          <a class="nav-item" routerLink="/admin/reviews" routerLinkActive="active">
            ⭐ Avis
          </a>
          <a class="nav-item" routerLink="/admin/reports" routerLinkActive="active">
            🚩 Signalements
          </a>
          <a class="nav-item" routerLink="/admin/messages" routerLinkActive="active">
            💬 Messages
          </a>
          <a class="nav-item" routerLink="/admin/analytics" routerLinkActive="active">
            📈 Analytics
          </a>
          <a class="nav-item" routerLink="/admin/advertising" routerLinkActive="active">
            📢 Publicité
          </a>
          <a class="nav-item" routerLink="/admin/partenaires" routerLinkActive="active">
            🤝 Partenaires
          </a>
          <a class="nav-item" routerLink="/admin/role-requests" routerLinkActive="active">
            🔑 Demandes de rôle
          </a>
          <a class="nav-item" routerLink="/admin/audit" routerLinkActive="active">
            📋 Audit
          </a>
        </nav>
        <div class="user-box">
          <div class="user-name">{{ adminUser()?.firstName }} {{ adminUser()?.lastName }}</div>
          <div class="user-role">{{ adminUser()?.systemRole }}</div>
          <button class="logout-btn" (click)="logout()">Déconnexion</button>
        </div>
      </aside>
      <main class="main">
        <div class="topbar">
          <div class="topbar-spacer"></div>
          <div class="topbar-actions">
            <button class="sound-toggle" (click)="notificationSound.toggle()" [title]="notificationSound.enabled() ? 'Désactiver le son' : 'Activer le son'">
              {{ notificationSound.enabled() ? '🔊' : '🔇' }}
            </button>
            @if (sosAlerts().length > 0) {
              <div class="sos-badge" title="Alertes SOS actives">
                🚨 {{ sosAlerts().length }}
              </div>
            }
            @if (rejectionAlerts().length > 0) {
              <div class="rejection-badge" title="Refus récents">
                ❌ {{ rejectionAlerts().length }}
              </div>
            }
          </div>
        </div>
        <router-outlet></router-outlet>
      </main>
    </div>
  `,
  styles: [`
    .admin-layout { display: flex; min-height: 100vh; background: #f3f4f6; }

    .sidebar {
      width: 240px; background: #1e1b4b; color: #fff;
      display: flex; flex-direction: column; padding: 1.5rem 1rem;
      flex-shrink: 0; overflow-y: auto;
    }
    .logo { font-size: 1rem; font-weight: 700; margin-bottom: 2rem; }
    .logo span { background: #4f46e5; padding: .15rem .5rem; border-radius: 6px; font-size: .75rem; margin-left: .3rem; }
    nav { display: flex; flex-direction: column; gap: .25rem; flex: 1; }
    .nav-item {
      padding: .65rem .75rem; border-radius: 8px; cursor: pointer; text-decoration: none;
      color: #c7d2fe; font-size: .9rem; transition: background .15s; display: block;
    }
    .nav-item:hover { background: rgba(255,255,255,.08); color: #fff; }
    .nav-item.active { background: #4f46e5; color: #fff; }

    .user-box { border-top: 1px solid rgba(255,255,255,.1); padding-top: 1rem; margin-top: 1rem; }
    .user-name { font-weight: 600; font-size: .9rem; }
    .user-role { font-size: .75rem; color: #a5b4fc; margin-bottom: .75rem; }
    .logout-btn {
      width: 100%; padding: .5rem; border-radius: 6px; border: 1px solid rgba(255,255,255,.2);
      background: transparent; color: #fff; font-size: .8rem; cursor: pointer;
    }
    .logout-btn:hover { background: rgba(255,255,255,.1); }

    .main { flex: 1; padding: 0; overflow-y: auto; display: flex; flex-direction: column; }

    .topbar {
      display: flex; align-items: center; justify-content: flex-end;
      padding: 0.75rem 2rem; background: #fff; border-bottom: 1px solid #e5e7eb;
    }
    .topbar-actions { display: flex; align-items: center; gap: 12px; }
    .topbar-spacer { flex: 1; }

    .sound-toggle {
      background: none; border: 1px solid #ddd; border-radius: 8px;
      padding: 4px 8px; font-size: 18px; cursor: pointer; transition: background 0.2s;
    }
    .sound-toggle:hover { background: #f0f0f0; }

    .sos-badge {
      background: #fef2f2; color: #991b1b; border: 1px solid #fecaca;
      border-radius: 8px; padding: 4px 10px; font-size: 13px; font-weight: 600;
      animation: pulse-sos 1.5s infinite;
    }
    .rejection-badge {
      background: #fff7ed; color: #9a3412; border: 1px solid #fed7aa;
      border-radius: 8px; padding: 4px 10px; font-size: 13px; font-weight: 600;
    }

    @keyframes pulse-sos {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.6; }
    }
  `]
})
export class AdminLayoutComponent implements OnInit, OnDestroy {
  adminUser = signal<any>(null);
  sosAlerts = signal<any[]>([]);
  rejectionAlerts = signal<any[]>([]);

  private wsConnected = false;

  constructor(
    public adminService: AdminService,
    private wsService: WebSocketService,
    public notificationSound: NotificationSoundService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.adminUser.set(this.adminService.getUser());

    const token = this.adminService.getToken();
    if (token) {
      this.wsService.connect(token);
      this.wsConnected = true;
      this.setupWsSubscriptions();
    }

    this.router.events.pipe(filter(e => e instanceof NavigationEnd)).subscribe(() => {
      this.adminUser.set(this.adminService.getUser());
    });
  }

  private setupWsSubscriptions(): void {
    this.wsService.subscribe('/topic/admin/sos').subscribe((msg: any) => {
      this.notificationSound.play('sos');
      this.sosAlerts.update(alerts => [msg, ...alerts].slice(0, 10));
    });

    this.wsService.subscribe('/topic/admin/ride-rejections').subscribe((msg: any) => {
      this.notificationSound.play('ride-cancelled');
      this.rejectionAlerts.update(alerts => [msg, ...alerts].slice(0, 10));
    });
  }

  logout(): void {
    if (this.wsConnected) {
      this.wsService.disconnect();
    }
    this.adminService.logout();
    this.router.navigate(['/admin/login']);
  }

  ngOnDestroy(): void {
    if (this.wsConnected) {
      this.wsService.disconnect();
    }
  }
}
