import { Routes } from '@angular/router';
import { authGuard, guestGuard, driverGuard } from './core/guards/auth.guard';
import { adminRoutes } from './admin.routes';

export const routes: Routes = [
   ...adminRoutes,
  { path: '', loadComponent: () => import('./features/home/home.component').then(m => m.HomeComponent) },
   {
    path: 'auth', canActivate: [guestGuard], children: [
      { path: 'login', loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent) },
      { path: 'register', loadComponent: () => import('./features/auth/register/register.component').then(m => m.RegisterComponent) },
      { path: 'forgot-password', loadComponent: () => import('./features/auth/forgot-password/forgot-password.component').then(m => m.ForgotPasswordComponent) },
      { path: 'reset-password', loadComponent: () => import('./features/auth/reset-password/reset-password.component').then(m => m.ResetPasswordComponent) }
    ]
  },
  {
    path: 'trips', children: [
      { path: '', loadComponent: () => import('./features/trips/trip-search/trip-search.component').then(m => m.TripSearchComponent) },
      { path: 'new', canActivate: [authGuard, driverGuard], loadComponent: () => import('./features/trips/trip-create/trip-create.component').then(m => m.TripCreateComponent) },
      { path: 'share/:token', canActivate: [authGuard], loadComponent: () => import('./features/share/share.component').then(m => m.ShareComponent) },
      { path: ':id', loadComponent: () => import('./features/trips/trip-detail/trip-detail.component').then(m => m.TripDetailComponent) },
      { path: 'edit/:id', canActivate: [authGuard, driverGuard], loadComponent: () => import('./features/trips/trip-form/trip-edit.component').then(m => m.TripEditComponent) }
    ]
  },
  {
    path: 'messages', canActivate: [authGuard], children: [
      { path: '', loadComponent: () => import('./features/messages/messages.component').then(m => m.MessagesComponent) },
      { path: ':userId', loadComponent: () => import('./features/messages/messages.component').then(m => m.MessagesComponent) }
    ]
  },
  { path: 'dashboard', canActivate: [authGuard], loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent) },
  { path: 'passenger/dashboard', canActivate: [authGuard], loadComponent: () => import('./features/passenger-dashboard/passenger-dashboard.component').then(m => m.PassengerDashboardComponent) },
  { path: 'bookings', canActivate: [authGuard], loadComponent: () => import('./features/bookings/bookings-management.component').then(m => m.BookingManagementComponent) },
  { path: 'my-bookings', canActivate: [authGuard], loadComponent: () => import('./features/bookings/my-bookings.component').then(m => m.MyBookingsComponent) },

 // { path: 'bookings', canActivate: [authGuard], loadComponent: () => import('./features/bookings/bookings.component').then(m => m.BookingsComponent) },
  { path: 'notifications', canActivate: [authGuard], loadComponent: () => import('./features/notifications/notifications.component').then(m => m.NotificationsComponent) },
  { path: 'profile', canActivate: [authGuard], loadComponent: () => import('./features/profile/profile.component').then(m => m.ProfileComponent) },
  { path: 'profile/:id', loadComponent: () => import('./features/profile/profile.component').then(m => m.ProfileComponent) },
  { path: 'contact', loadComponent: () => import('./features/contact/contact.component').then(m => m.ContactComponent) },
  { path: 'faq', loadComponent: () => import('./features/legal/faq/faq.component').then(m => m.FaqComponent) },
  { path: 'mentions-legales', loadComponent: () => import('./features/legal/mentions-legales/mentions-legales.component').then(m => m.MentionsLegalesComponent) },
  { path: 'cgu', loadComponent: () => import('./features/legal/cgu/cgu.component').then(m => m.CguComponent) },
  { path: 'confidentialite', loadComponent: () => import('./features/legal/confidentialite/confidentialite.component').then(m => m.ConfidentialiteComponent) },
  { path: '**', loadComponent: () => import('./features/not-found/not-found.component').then(m => m.NotFoundComponent) },

  /* { path: 'loginAdmin', loadComponent: () => import('./features/auth/admin/login.admin.component').then(m => m.LoginAdminComponent) },
  {
   path: 'admin',
   loadComponent: () => import('./shared/components/layout/layout.component').then(m => m.LayoutComponent),
   canActivate: [adminGuard],
   children: [
     { path: '', redirectTo: 'dashboard', pathMatch: 'full' },

     { path: 'dashboard', loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent) },
     { path: 'users', loadComponent: () => import('./features/users/users.component').then(m => m.UsersComponent) },
     { path: 'reviews', loadComponent: () => import('./features/reviews/reviews.component').then(m => m.ReviewsComponent) },
     { path: 'messages', loadComponent: () => import('./features/messages/messages.component').then(m => m.MessagesComponent) },
     { path: 'reports', loadComponent: () => import('./features/reports/reports.component').then(m => m.ReportsComponent) },
     { path: 'audit', loadComponent: () => import('./features/audit/audit.component').then(m => m.AuditComponent) },
   ]
 } */
];


