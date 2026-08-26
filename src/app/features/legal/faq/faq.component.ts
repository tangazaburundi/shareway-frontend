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

  covoiturageOpen = false;
  taxiOpen = false;

  faqs = [
    { qKey: 'faq.q1', aKey: 'faq.a1' },
    { qKey: 'faq.q2', aKey: 'faq.a2' },
    { qKey: 'faq.q3', aKey: 'faq.a3' },
    { qKey: 'faq.q4', aKey: 'faq.a4' },
    { qKey: 'faq.q5', aKey: 'faq.a5' },
    { qKey: 'faq.q6', aKey: 'faq.a6' },
    { qKey: 'faq.q7', aKey: 'faq.a7' },
    { qKey: 'faq.q8', aKey: 'faq.a8' },
    { qKey: 'faq.q9', aKey: 'faq.a9' },
    { qKey: 'faq.q10', aKey: 'faq.a10' },
    { qKey: 'faq.q11', aKey: 'faq.a11' },
    { qKey: 'faq.q12', aKey: 'faq.a12' },
  ];

  taxiFaqs = [
    { qKey: 'faq.tq1', aKey: 'faq.ta1' },
    { qKey: 'faq.tq2', aKey: 'faq.ta2' },
    { qKey: 'faq.tq3', aKey: 'faq.ta3' },
    { qKey: 'faq.tq4', aKey: 'faq.ta4' },
    { qKey: 'faq.tq5', aKey: 'faq.ta5' },
    { qKey: 'faq.tq6', aKey: 'faq.ta6' },
    { qKey: 'faq.tq7', aKey: 'faq.ta7' },
    { qKey: 'faq.tq8', aKey: 'faq.ta8' },
    { qKey: 'faq.tq9', aKey: 'faq.ta9' },
  ];

  toggleCovoiturage(): void {
    this.covoiturageOpen = !this.covoiturageOpen;
  }

  toggleTaxi(): void {
    this.taxiOpen = !this.taxiOpen;
  }
}
