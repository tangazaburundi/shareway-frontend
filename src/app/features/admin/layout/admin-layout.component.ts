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
      <div class="sidebar-overlay" [class.visible]="sidebarOpen" (click)="sidebarOpen = false"></div>
      <aside class="sidebar" [class.open]="sidebarOpen">
        <div class="sidebar-header">
          <div class="logo">🛠️ Shareway <span>Admin</span></div>
          <button class="close-btn" (click)="sidebarOpen = false">✕</button>
        </div>
        <nav>
          <a class="nav-item" routerLink="/admin/dashboard" routerLinkActive="active" (click)="sidebarOpen = false">
            📊 Dashboard
          </a>
          <a class="nav-item" routerLink="/admin/users" routerLinkActive="active" (click)="sidebarOpen = false">
            👥 Utilisateurs
          </a>
          <a class="nav-item" routerLink="/admin/documents" routerLinkActive="active" (click)="sidebarOpen = false">
            📄 Documents
          </a>
          <a class="nav-item" routerLink="/admin/trips" routerLinkActive="active" (click)="sidebarOpen = false">
            🚗 Courses
          </a>
          <a class="nav-item" routerLink="/admin/ride-config" routerLinkActive="active" (click)="sidebarOpen = false">
            ⚙️ Config courses
          </a>
          <a class="nav-item" routerLink="/admin/pricing-config" routerLinkActive="active" (click)="sidebarOpen = false">
            💰 Tarification
          </a>
          <a class="nav-item" routerLink="/admin/sms-config" routerLinkActive="active" (click)="sidebarOpen = false">
            📱 SMS
          </a>
          <a class="nav-item" routerLink="/admin/reviews" routerLinkActive="active" (click)="sidebarOpen = false">
            ⭐ Avis
          </a>
          <a class="nav-item" routerLink="/admin/reports" routerLinkActive="active" (click)="sidebarOpen = false">
            🚩 Signalements
          </a>
          <a class="nav-item" routerLink="/admin/messages" routerLinkActive="active" (click)="sidebarOpen = false">
            💬 Messages
          </a>
          <a class="nav-item" routerLink="/admin/analytics" routerLinkActive="active" (click)="sidebarOpen = false">
            📈 Analytics
          </a>
          <a class="nav-item" routerLink="/admin/advertising" routerLinkActive="active" (click)="sidebarOpen = false">
            📢 Publicité
          </a>
          <a class="nav-item" routerLink="/admin/partenaires" routerLinkActive="active" (click)="sidebarOpen = false">
            🤝 Partenaires
          </a>
          <a class="nav-item" routerLink="/admin/role-requests" routerLinkActive="active" (click)="sidebarOpen = false">
            🔑 Demandes de rôle
          </a>
          <a class="nav-item" routerLink="/admin/audit" routerLinkActive="active" (click)="sidebarOpen = false">
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
          <button class="hamburger" (click)="sidebarOpen = !sidebarOpen">☰</button>
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
  styleUrls: ['./admin-layout.component.css']
})
export class AdminLayoutComponent implements OnInit, OnDestroy {
  adminUser = signal<any>(null);
  sosAlerts = signal<any[]>([]);
  rejectionAlerts = signal<any[]>([]);
  sidebarOpen = false;

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
