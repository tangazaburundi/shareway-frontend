// ─────────────────────────────────────────────────────────────────────────
// Routes à AJOUTER dans src/app/app.routes.ts
//
// Le backend exige déjà le rôle ADMIN/SUPER_ADMIN/MODERATOR sur /admin/**
// (voir SecurityConfig.java). L'admin se connecte via /auth/login normal —
// la réponse contient son rôle, qui détermine l'accès au dashboard.
// ─────────────────────────────────────────────────────────────────────────

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
    path: 'admin/dashboard',
    canActivate: [adminGuard],
     loadComponent: () =>
          import('./features/admin/dashboard/admin-dashboard.component')
            .then(m => m.AdminDashboardComponent),
  },
  {
      path: 'admin/users',
      canActivate: [adminGuard],
      loadComponent: () =>
        import('./features/admin/users/admin-users.component')
          .then(m => m.AdminUsersComponent),
    },
   {
       path: 'admin/documents',
       canActivate: [adminGuard],
       loadComponent: () =>
         import('./features/admin/documents/admin-documents.component')
           .then(m => m.AdminDocumentsComponent),
     },
     {
       path: 'admin/reviews',
       canActivate: [adminGuard],
       loadComponent: () =>
         import('./features/admin/reviews/admin-reviews.component')
           .then(m => m.AdminReviewsComponent),
     },
     {
       path: 'admin/reports',
       canActivate: [adminGuard],
       loadComponent: () =>
         import('./features/admin/reports/admin-reports.component')
           .then(m => m.AdminReportsComponent),
     },
     {
       path: 'admin/messages',
       canActivate: [adminGuard],
       loadComponent: () =>
         import('./features/admin/messages/admin-messages.component')
           .then(m => m.AdminMessagesComponent),
     },
      {
        path: 'admin/audit',
        canActivate: [adminGuard],
        loadComponent: () =>
          import('./features/admin/audit/admin-audit.component')
            .then(m => m.AdminAuditComponent),
      },
      {
        path: 'admin/advertising',
        canActivate: [adminGuard],
        loadComponent: () =>
          import('./features/admin/advertising/admin-advertising.component')
            .then(m => m.AdminAdvertisingComponent),
      },
      {
        path: 'admin/analytics',
        canActivate: [adminGuard],
        loadComponent: () =>
          import('./features/admin/analytics/admin-analytics.component')
            .then(m => m.AdminAnalyticsComponent),
      },
      {
        path: 'admin/role-requests',
        canActivate: [adminGuard],
        loadComponent: () =>
          import('./features/admin/role-requests/admin-role-requests.component')
            .then(m => m.AdminRoleRequestsComponent),
      },
      {
        path: 'admin/trips',
        canActivate: [adminGuard],
        loadComponent: () =>
          import('./features/admin/trips/admin-trips.component')
            .then(m => m.AdminTripsComponent),
      },
];


