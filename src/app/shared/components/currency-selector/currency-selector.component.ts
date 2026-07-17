import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Currency, CURRENCY_SYMBOLS } from '../../../core/models/trip.model';

@Component({ selector: 'app-currency-selector', standalone: true, imports: [CommonModule],
  templateUrl: './currency-selector.component.html', styleUrls: ['./currency-selector.component.css'] })
export class CurrencySelectorComponent {
  @Input() value: Currency = 'FBU';
  @Output() valueChange = new EventEmitter<Currency>();
  currencies: Currency[] = ['FBU', 'USD', 'EUR'];
  symbols = CURRENCY_SYMBOLS;
  select(c: Currency): void { this.value = c; this.valueChange.emit(c); }
}