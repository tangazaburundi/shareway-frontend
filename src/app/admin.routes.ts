import { Routes } from '@angular/router';
import { adminGuard } from './core/guards/admin.guard';

export const adminRoutes: Routes = [
  {
    path: 'admin/login',
    loadComponent: () =>
      import('./features/admin/login/admin-login.component')
        .then(m => m.AdminLoginComponent),
  },
  {
    path: 'admin',
    canActivate: [adminGuard],
    loadComponent: () =>
      import('./features/admin/layout/admin-layout.component')
        .then(m => m.AdminLayoutComponent),
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/admin/dashboard/admin-dashboard.component')
            .then(m => m.AdminDashboardComponent),
      },
      {
        path: 'users',
        loadComponent: () =>
          import('./features/admin/users/admin-users.component')
            .then(m => m.AdminUsersComponent),
      },
      {
        path: 'documents',
        loadComponent: () =>
          import('./features/admin/documents/admin-documents.component')
            .then(m => m.AdminDocumentsComponent),
      },
      {
        path: 'reviews',
        loadComponent: () =>
          import('./features/admin/reviews/admin-reviews.component')
            .then(m => m.AdminReviewsComponent),
      },
      {
        path: 'reports',
        loadComponent: () =>
          import('./features/admin/reports/admin-reports.component')
            .then(m => m.AdminReportsComponent),
      },
      {
        path: 'messages',
        loadComponent: () =>
          import('./features/admin/messages/admin-messages.component')
            .then(m => m.AdminMessagesComponent),
      },
      {
        path: 'audit',
        loadComponent: () =>
          import('./features/admin/audit/admin-audit.component')
            .then(m => m.AdminAuditComponent),
      },
      {
        path: 'advertising',
        loadComponent: () =>
          import('./features/admin/advertising/admin-advertising.component')
            .then(m => m.AdminAdvertisingComponent),
      },
      {
        path: 'analytics',
        loadComponent: () =>
          import('./features/admin/analytics/admin-analytics.component')
            .then(m => m.AdminAnalyticsComponent),
      },
      {
        path: 'role-requests',
        loadComponent: () =>
          import('./features/admin/role-requests/admin-role-requests.component')
            .then(m => m.AdminRoleRequestsComponent),
      },
      {
        path: 'trips',
        loadComponent: () =>
          import('./features/admin/trips/admin-trips.component')
            .then(m => m.AdminTripsComponent),
      },
      {
        path: 'partenaires',
        loadComponent: () =>
          import('./features/admin/partenaires/admin-partenaires.component')
            .then(m => m.AdminPartenairesComponent),
      },
      {
        path: 'pricing-config',
        loadComponent: () =>
          import('./features/admin/pricing-config/admin-pricing-config.component')
            .then(m => m.AdminPricingConfigComponent),
      },
      {
        path: 'sms-config',
        loadComponent: () =>
          import('./features/admin/sms-config/admin-sms-config.component')
            .then(m => m.AdminSmsConfigComponent),
      },
      {
        path: 'ride-config',
        loadComponent: () =>
          import('./features/admin/ride-config/admin-ride-config.component')
            .then(m => m.AdminRideConfigComponent),
      },
    ],
  },
];
