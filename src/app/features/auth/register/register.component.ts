import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';
import { LanguageService } from '../../../core/services/language.service';

@Component({ selector: 'app-register', standalone: true,
  imports: [ReactiveFormsModule, RouterLink, CommonModule],
  templateUrl: './register.component.html', styleUrls: ['./register.component.css'] })
export class RegisterComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  langService = inject(LanguageService);

  roles = [{ value: 'PASSENGER', icon: '🧳' }, { value: 'DRIVER', icon: '🚗' }, { value: 'BOTH', icon: '🔄' }];

  form = this.fb.group({
    role: ['PASSENGER', Validators.required],
    firstName: ['', Validators.required], lastName: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    phone: [''], password: ['', [Validators.required, Validators.minLength(8)]]
  });

  loading = false; error = ''; showPwd = false;

  isInvalid(f: string): boolean { const c = this.form.get(f); return !!(c?.invalid && c?.touched); }

  submit() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.loading = true; this.error = '';
    this.authService.register(this.form.value as any).subscribe({
      next: () => this.router.navigate(['/']),
      error: (err) => { this.error = err.error?.message || 'Erreur'; this.loading = false; }
    });
  }
}