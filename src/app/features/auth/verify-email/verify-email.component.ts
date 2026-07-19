import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { LanguageService } from '../../../core/services/language.service';

@Component({
  selector: 'app-verify-email',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="page">
      <div class="card">
        <div class="loading" *ngIf="loading">
          <div class="spinner"></div>
          <p>{{ langService.t('auth.verify.verifying') || 'Vérification en cours...' }}</p>
        </div>

        <div class="success" *ngIf="success">
          <div class="success-icon">✓</div>
          <h2>{{ langService.t('auth.verify.successTitle') || 'Email vérifié !' }}</h2>
          <p>{{ langService.t('auth.verify.successMessage') || 'Votre adresse email a été confirmée avec succès.' }}</p>
          <a routerLink="/auth/login" class="back-link">{{ langService.t('auth.verify.goToLogin') || 'Se connecter' }}</a>
        </div>

        <div class="error-state" *ngIf="errorMessage">
          <div class="error-icon">✕</div>
          <h2>{{ langService.t('auth.verify.errorTitle') || 'Échec de la vérification' }}</h2>
          <p>{{ errorMessage }}</p>
          <a routerLink="/" class="back-link">{{ langService.t('auth.verify.goHome') }}</a>
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

    p {
      font-size: 14px;
      color: #6b7280;
      line-height: 1.6;
      margin: 0;
    }

    .loading { padding: 20px 0; }

    .spinner {
      width: 40px;
      height: 40px;
      margin: 0 auto 16px;
      border: 3px solid #e5e7eb;
      border-top-color: #1a8b82;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }

    @keyframes spin { to { transform: rotate(360deg); } }

    .success { padding: 16px 0; }

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

    .success p { margin: 0 0 20px; }

    .error-icon {
      width: 52px;
      height: 52px;
      margin: 0 auto 16px;
      border-radius: 50%;
      background: #dc2626;
      color: #fff;
      font-size: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .error-state { padding: 16px 0; }
    .error-state h2 { color: #dc2626; }
    .error-state p { margin: 0 0 20px; }

    .back-link {
      display: inline-block;
      margin-top: 20px;
      font-size: 14px;
      color: #1a8b82;
      text-decoration: none;
      font-weight: 500;
    }

    .back-link:hover { text-decoration: underline; }
  `]
})
export class VerifyEmailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private authService = inject(AuthService);
  langService = inject(LanguageService);

  loading = true;
  success = false;
  errorMessage = '';

  ngOnInit(): void {
    const token = this.route.snapshot.queryParamMap.get('token');
    if (!token) {
      this.loading = false;
      this.errorMessage = this.langService.t('auth.verify.invalidToken') || 'Lien de vérification invalide.';
      return;
    }

    this.authService.verifyEmail(token).subscribe({
      next: () => {
        this.loading = false;
        this.success = true;
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = err.error?.message
          || this.langService.t('auth.verify.expired') || 'Ce lien est invalide ou a expiré.';
      }
    });
  }
}
