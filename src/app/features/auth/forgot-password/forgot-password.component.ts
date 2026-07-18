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
  styles: [`
    .page {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      padding: 32px 24px;
      background: var(--gray-50, #f9fafb);
    }

    .card {
      width: 100%;
      max-width: 420px;
      background: #fff;
      border-radius: 12px;
      padding: 40px 32px;
      box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
      text-align: center;
    }

    h2 {
      margin: 0 0 8px;
      font-size: 22px;
      font-weight: 700;
      color: #1a1a1a;
    }

    .subtitle {
      margin: 0 0 28px;
      font-size: 14px;
      color: #6b7280;
      line-height: 1.5;
    }

    .form-group {
      text-align: left;
      margin-bottom: 20px;
    }

    label {
      display: block;
      margin-bottom: 6px;
      font-size: 13px;
      font-weight: 600;
      color: #374151;
    }

    input {
      width: 100%;
      padding: 12px 14px;
      border: 1px solid #d1d5db;
      border-radius: 8px;
      font-size: 15px;
      color: #1a1a1a;
      outline: none;
      transition: border-color 0.2s;
      box-sizing: border-box;
    }

    input:focus {
      border-color: #1a8b82;
      box-shadow: 0 0 0 3px rgba(26, 139, 130, 0.12);
    }

    button {
      width: 100%;
      padding: 12px;
      border: none;
      border-radius: 8px;
      background: #1a8b82;
      color: #fff;
      font-size: 15px;
      font-weight: 600;
      cursor: pointer;
      transition: opacity 0.2s;
    }

    button:hover:not(:disabled) {
      opacity: 0.9;
    }

    button:disabled {
      opacity: 0.55;
      cursor: not-allowed;
    }

    .error {
      margin-top: 14px;
      font-size: 13px;
      color: #dc2626;
    }

    .success {
      padding: 16px 0;
    }

    .success-icon {
      width: 52px;
      height: 52px;
      margin: 0 auto 16px;
      border-radius: 50%;
      background: #1a8b82;
      color: #fff;
      font-size: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .success p {
      font-size: 14px;
      color: #4b5563;
      line-height: 1.6;
      margin: 0 0 20px;
    }

    .back-link {
      display: inline-block;
      margin-top: 20px;
      font-size: 14px;
      color: #1a8b82;
      text-decoration: none;
      font-weight: 500;
    }

    .back-link:hover {
      text-decoration: underline;
    }
  `]
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
