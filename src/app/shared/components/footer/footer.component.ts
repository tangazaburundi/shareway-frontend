import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { LanguageService } from '../../../core/services/language.service';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [RouterLink, FormsModule],
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.css']
})
export class FooterComponent {
  langService = inject(LanguageService);
  private http = inject(HttpClient);

  newsletterEmail = '';
  newsletterSending = false;
  newsletterSent = false;

  subscribeNewsletter(event: Event) {
    event.preventDefault();
    if (!this.newsletterEmail || this.newsletterSending) return;
    this.newsletterSending = true;

    this.http.post(`${environment.apiUrl}/newsletter`, { email: this.newsletterEmail }).subscribe({
      next: () => {
        this.newsletterSending = false;
        this.newsletterSent = true;
        this.newsletterEmail = '';
        setTimeout(() => { this.newsletterSent = false; }, 4000);
      },
      error: () => {
        this.newsletterSending = false;
      }
    });
  }
}
