import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LanguageService } from '../../core/services/language.service';

@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="not-found">
      <div class="not-found-content">
        <h1>404</h1>
        <p>{{ langService.t('notFound.title') }}</p>
        <p class="subtitle">{{ langService.t('notFound.subtitle') }}</p>
        <a routerLink="/" class="back-btn">{{ langService.t('notFound.backHome') }}</a>
      </div>
    </div>
  `,
  styles: [`
    .not-found {
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 70vh;
      text-align: center;
    }
    .not-found-content h1 {
      font-size: 6rem;
      font-weight: 800;
      color: #10b981;
      margin: 0;
      line-height: 1;
    }
    .not-found-content p {
      font-size: 1.3rem;
      color: #6b7280;
      margin: 0.5rem 0;
    }
    .subtitle {
      font-size: 1rem !important;
      color: #9ca3af !important;
    }
    .back-btn {
      display: inline-block;
      margin-top: 1.5rem;
      padding: 0.75rem 1.5rem;
      background: #10b981;
      color: #fff;
      border-radius: 8px;
      text-decoration: none;
      font-weight: 600;
      transition: background 0.2s;
    }
    .back-btn:hover {
      background: #059669;
    }
  `]
})
export class NotFoundComponent {
  langService = inject(LanguageService);
}
