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
                <div class="password-row">
                  <input
                    class="password-input"
                    [type]="showPassword ? 'text' : 'password'"
                    [(ngModel)]="newPassword"
                    name="newPassword"
                    [placeholder]="langService.t('auth.reset.passwordPlaceholder') || 'Mot de passe'"
                    required
                    minlength="8"
                  />
                  <button type="button" class="toggle-btn" (click)="showPassword = !showPassword">
                    {{ showPassword ? '🙈' : '👁️' }}
                  </button>
                </div>
              </div>

              <div class="form-group">
                <label>{{ langService.t('auth.reset.confirmLabel') || 'Confirmer le mot de passe' }}</label>
                <div class="password-row">
                  <input
                    class="password-input"
                    [type]="showConfirm ? 'text' : 'password'"
                    [(ngModel)]="confirmPassword"
                    name="confirmPassword"
                    [placeholder]="langService.t('auth.reset.confirmPlaceholder') || 'Confirmer'"
                    required
                  />
                  <button type="button" class="toggle-btn" (click)="showConfirm = !showConfirm">
                    {{ showConfirm ? '🙈' : '👁️' }}
                  </button>
                </div>
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
  styleUrls: ['./reset-password.component.css']
})
export class ResetPasswordComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private authService = inject(AuthService);
  langService = inject(LanguageService);

  token = '';
  newPassword = '';
  confirmPassword = '';
  showPassword = false;
  showConfirm = false;
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

    if (!/^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>]).{8,}$/.test(this.newPassword)) {
      this.errorMessage = this.langService.t('auth.passwordStrong') || 'Min 8 caractères, 1 majuscule, 1 chiffre, 1 symbole.';
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
