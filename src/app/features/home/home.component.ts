import { Component, inject, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { LanguageService } from '../../core/services/language.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink, FormsModule],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent {
  langService = inject(LanguageService);

  from = '';
  to = '';
  date = '';

  constructor(private router: Router) {}

  search(): void {
    if (this.from || this.to || this.date) {
      this.router.navigate(['/trips'], {
        queryParams: { from: this.from, to: this.to, date: this.date }
      });
    }
  }
}
