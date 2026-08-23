import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { LanguageService } from '../../../core/services/language.service';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="page">
      <div class="card">
        <h2>{{ langService.t('auth.forgot.title') || 'Mot de passe oublié' }}</h2>
        <p class="subtitle">{{ langService.t('auth.forgot.subtitle') || 'Entrez votre adresse email pour réinitialiser votre mot de passe.' }}</p>

        <form (ngSubmit)="onSubmit()" *ngIf="!submitted">
          <div class="form-group">
            <label for="email">{{ langService.t('auth.forgot.emailLabel') || 'Adresse email' }}</label>
            <input
              id="email"
              type="email"
              [(ngModel)]="email"
              name="email"
              [placeholder]="langService.t('auth.forgot.emailPlaceholder') || 'votre@email.com'"
              required
              email
            />
          </div>

          <button type="submit" [disabled]="!email || loading">
            {{ loading
              ? (langService.t('auth.forgot.sending') || 'Envoi...')
              : (langService.t('auth.forgot.submit') || 'Envoyer le lien') }}
          </button>

          <p class="error" *ngIf="errorMessage">{{ errorMessage }}</p>
        </form>

        <div class="success" *ngIf="submitted">
          <div class="success-icon">✓</div>
          <p>{{ langService.t('auth.forgot.success') || 'Un email de réinitialisation a été envoyé. Vérifiez votre boîte de réception.' }}</p>
          <a routerLink="/auth/login" class="back-link">{{ langService.t('auth.forgot.backToLogin') || 'Retour à la connexion' }}</a>
        </div>

        <a routerLink="/auth/login" class="back-link" *ngIf="!submitted">
          {{ langService.t('auth.forgot.backToLogin') || 'Retour à la connexion' }}
        </a>
      </div>
    </div>
  `,
  styleUrls: ['./forgot-password.component.css']
})
export class ForgotPasswordComponent {
  email = '';
  loading = false;
  submitted = false;
  errorMessage = '';

  constructor(
    private http: HttpClient,
    public langService: LanguageService
  ) {}

  onSubmit(): void {
    if (!this.email) return;

    this.loading = true;
    this.errorMessage = '';

    this.http.post(`${environment.apiUrl}/auth/forgot-password`, { email: this.email }).subscribe({
      next: () => {
        this.loading = false;
        this.submitted = true;
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = err.error?.message || 'Une erreur est survenue. Veuillez réessayer.';
      }
    });
  }
}
