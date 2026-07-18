import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { LanguageService } from '../../core/services/language.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './contact.component.html',
  styleUrls: ['./contact.component.css']
})
export class ContactComponent {
  private http = inject(HttpClient);
  langService = inject(LanguageService);

  name = '';
  email = '';
  subject = '';
  message = '';
  sending = false;
  submitted = false;
  error = false;

  submit(): void {
    if (this.sending) return;
    this.sending = true;
    this.error = false;

    this.http.post(`${environment.apiUrl}/contact`, {
      name: this.name,
      email: this.email,
      subject: this.subject,
      message: this.message
    }).subscribe({
      next: () => {
        this.sending = false;
        this.submitted = true;
        this.name = '';
        this.email = '';
        this.subject = '';
        this.message = '';
      },
      error: () => {
        this.sending = false;
        this.error = true;
      }
    });
  }
}
