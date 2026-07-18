import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { LanguageService } from '../../../core/services/language.service';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="page">
      <div class="card">
        <ng-container *ngIf="!invalidToken">
          <ng-container *ngIf="!submitted">
            <h2>{{ langService.t('auth.reset.title') || 'Nouveau mot de passe' }}</h2>
            <p class="subtitle">{{ langService.t('auth.reset.subtitle') || 'Entrez votre nouveau mot de passe.' }}</p>

            <form (ngSubmit)="onSubmit()">
              <div class="form-group">
                <label>{{ langService.t('auth.reset.passwordLabel') || 'Nouveau mot de passe' }}</label>
                <input
                  type="password"
                  [(ngModel)]="newPassword"
                  name="newPassword"
                  [placeholder]="langService.t('auth.reset.passwordPlaceholder') || 'Mot de passe'"
                  required
                  minlength="8"
                />
              </div>

              <div class="form-group">
                <label>{{ langService.t('auth.reset.confirmLabel') || 'Confirmer le mot de passe' }}</label>
                <input
                  type="password"
                  [(ngModel)]="confirmPassword"
                  name="confirmPassword"
                  [placeholder]="langService.t('auth.reset.confirmPlaceholder') || 'Confirmer'"
                  required
                />
              </div>

              <p class="error" *ngIf="errorMessage">{{ errorMessage }}</p>

              <button type="submit" [disabled]="loading || !newPassword || !confirmPassword">
                {{ loading
                  ? (langService.t('auth.reset.submitting') || 'Enregistrement...')
                  : (langService.t('auth.reset.submit') || 'Réinitialiser') }}
              </button>
            </form>
          </ng-container>

          <div class="success" *ngIf="submitted">
            <div class="success-icon">✓</div>
            <p>{{ langService.t('auth.reset.success') || 'Votre mot de passe a été réinitialisé avec succès.' }}</p>
            <a routerLink="/auth/login" class="back-link">{{ langService.t('auth.reset.goToLogin') || 'Se connecter' }}</a>
          </div>
        </ng-container>

        <div class="error-state" *ngIf="invalidToken">
          <h2>{{ langService.t('auth.reset.invalidTitle') || 'Lien invalide' }}</h2>
          <p>{{ langService.t('auth.reset.invalidMessage') || 'Ce lien de réinitialisation est invalide ou a expiré.' }}</p>
          <a routerLink="/auth/forgot-password" class="back-link">{{ langService.t('auth.reset.newRequest') || 'Demander un nouveau lien' }}</a>
        </div>
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

    .error-state {
      padding: 16px 0;
    }

    .error-state h2 {
      color: #dc2626;
    }

    .error-state p {
      font-size: 14px;
      color: #6b7280;
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
export class ResetPasswordComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private authService = inject(AuthService);
  langService = inject(LanguageService);

  token = '';
  newPassword = '';
  confirmPassword = '';
  loading = false;
  submitted = false;
  invalidToken = false;
  errorMessage = '';

  ngOnInit(): void {
    this.token = this.route.snapshot.queryParamMap.get('token') || '';
    if (!this.token) {
      this.invalidToken = true;
    }
  }

  onSubmit(): void {
    if (!this.newPassword || !this.confirmPassword) return;

    if (this.newPassword !== this.confirmPassword) {
      this.errorMessage = this.langService.t('auth.reset.passwordMismatch') || 'Les mots de passe ne correspondent pas.';
      return;
    }

    if (this.newPassword.length < 8) {
      this.errorMessage = this.langService.t('auth.reset.passwordTooShort') || 'Le mot de passe doit contenir au moins 8 caractères.';
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    this.authService.resetPassword(this.token, this.newPassword).subscribe({
      next: () => {
        this.loading = false;
        this.submitted = true;
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = err.error?.message || this.langService.t('auth.reset.error') || 'Une erreur est survenue. Veuillez réessayer.';
      }
    });
  }
}
