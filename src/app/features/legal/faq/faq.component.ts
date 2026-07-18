import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LanguageService } from '../../../core/services/language.service';

@Component({
  selector: 'app-faq',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './faq.component.html',
  styleUrls: ['./faq.component.css']
})
export class FaqComponent {
  langService = inject(LanguageService);

  openIndex: number | null = null;

  faqs = [
    { qKey: 'faq.q1', aKey: 'faq.a1' },
    { qKey: 'faq.q2', aKey: 'faq.a2' },
    { qKey: 'faq.q3', aKey: 'faq.a3' },
    { qKey: 'faq.q4', aKey: 'faq.a4' },
    { qKey: 'faq.q5', aKey: 'faq.a5' },
    { qKey: 'faq.q6', aKey: 'faq.a6' }
  ];

  toggle(index: number): void {
    this.openIndex = this.openIndex === index ? null : index;
  }
}
