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

  get isFormValid(): boolean {
    return this.name.trim().length >= 2
      && this.isEmailValid
      && this.subject.trim().length >= 3
      && this.message.trim().length >= 10
      && this.message.trim().length <= 2000;
  }

  get isEmailValid(): boolean {
    return this.email.trim().length >= 5
      && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.email);
  }

  submit(): void {
    if (this.sending || !this.isFormValid) return;
    this.sending = true;
    this.error = false;

    this.http.post(`${environment.apiUrl}/contact`, {
      nom: this.name.trim().substring(0, 100),
      email: this.email.trim().substring(0, 254),
      sujet: this.subject.trim().substring(0, 200),
      message: this.message.trim().substring(0, 2000)
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
