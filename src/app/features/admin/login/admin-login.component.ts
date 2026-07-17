import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AdminService } from '../../../core/services/admin.service';

@Component({
  selector: 'app-admin-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './admin-login.component.html',
  styleUrl: './admin-login.component.css'
})
export class AdminLoginComponent {
  email = '';
  password = '';
  loading = false;
  error: string | null = null;

  constructor(private admin: AdminService, private router: Router) {}

  submit() {
    this.loading = true;
    this.error = null;

    this.admin.login({ email: this.email, password: this.password }).subscribe({
      next: r => {
        this.loading = false;
        const role = r.data?.user?.systemRole;

        if (!role || !['ADMIN', 'SUPER_ADMIN', 'MODERATOR'].includes(role)) {
          this.error = 'Ce compte n\'a pas les droits administrateur.';
          this.admin.logout();
          return;
        }
        this.router.navigate(['/admin/dashboard']);
      },
      error: err => {
        this.loading = false;
        this.error = err.error?.message || 'Identifiants incorrects.';
      }
    });
  }
}
