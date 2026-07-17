/*
import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { LanguageService } from '../../../core/services/language.service';
import { ModalComponent } from '../modal/modal.component';

@Component({ selector: 'app-cancel-modal', standalone: true,
  imports: [CommonModule, FormsModule, ModalComponent],
  templateUrl: './cancel-modal.component.html', styleUrls: ['./cancel-modal.component.css'] })
export class CancelModalComponent {
  @Input() open = false;
  @Input() mode: 'trip' | 'booking' = 'booking';
  @Input() loading = false;
  @Output() confirmed = new EventEmitter<{ reason: string; notify: boolean }>();
  @Output() cancelled = new EventEmitter<void>();

  langService = inject(LanguageService);
  reason = ''; notify = true;

  confirm(): void {
    if (!this.reason.trim()) return;
    this.confirmed.emit({ reason: this.reason, notify: this.notify });
  }
} */

import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { LanguageService } from '../../../core/services/language.service';
import { ModalComponent } from '../modal/modal.component';

@Component({
  selector: 'app-cancel-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, ModalComponent],
  templateUrl: './cancel-modal.component.html',
  styleUrls: ['./cancel-modal.component.css']
})
export class CancelModalComponent {
  @Input() open = false;
  @Input() mode: 'trip' | 'booking' = 'booking';
  @Input() loading = false;
  @Input() errorMessage: string | null = null;

  @Output() confirmed = new EventEmitter<{ reason: string; notify: boolean }>();
  @Output() cancelled = new EventEmitter<void>();

  langService = inject(LanguageService);
  errorMsg = ''; successMsg = '';
  reason = '';
  notify = true;

  confirm(): void {
    if (!this.reason.trim()) {
      return;
    }

    this.confirmed.emit({
      reason: this.reason,
      notify: this.notify
    });
  }
}