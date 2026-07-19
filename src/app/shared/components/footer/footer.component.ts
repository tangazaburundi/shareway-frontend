import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { LanguageService } from '../../../core/services/language.service';
import { PartenaireService } from '../../../core/services/partenaire.service';
import { Partenaire } from '../../../core/models/partenaire.model';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [RouterLink, FormsModule],
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.css']
})
export class FooterComponent implements OnInit {
  langService = inject(LanguageService);
  private http = inject(HttpClient);
  private partenaireService = inject(PartenaireService);

  currentYear = new Date().getFullYear();
  newsletterEmail = '';
  newsletterSending = false;
  newsletterSent = false;
  partenaires = signal<Partenaire[]>([]);

  ngOnInit() {
    this.loadPartenaires();
  }

  loadPartenaires() {
    this.partenaireService.getAllActive().subscribe({
      next: (data) => this.partenaires.set(data),
      error: () => {}
    });
  }

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
