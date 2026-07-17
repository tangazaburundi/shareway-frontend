import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AdminAuthService } from '../../../core/services/admin.auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
   FormsModule
  ],
  templateUrl: './login.admin.component.html',
  styleUrl: './login.admin.component.css'
})
export class LoginAdminComponent {
email = '';
password = '';
loading = signal(false);
error = signal('');
showPwd = signal(false);

constructor(private auth: AdminAuthService, private router: Router) {}

submit() {
this.loading.set(true);
this.error.set('');
this.auth.login({ email: this.email, password: this.password }).subscribe({
next: () => this.router.navigate(['/admin/dashboard']),
error: () => {
this.error.set('Email ou mot de passe incorrect.');
this.loading.set(false);
}
});
}
}