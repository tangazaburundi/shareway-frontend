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
  styleUrls: ['./verify-email.component.css']
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
