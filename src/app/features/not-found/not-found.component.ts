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
  styleUrls: ['./not-found.component.css']
})
export class NotFoundComponent {
  langService = inject(LanguageService);
}
