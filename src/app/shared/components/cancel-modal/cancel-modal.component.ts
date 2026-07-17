import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface CancelModalConfig {
  title:       string;
  description: string;
  placeholder: string;
  confirmLabel?: string;
  cancelLabel?:  string;
  reasonRequired?: boolean;
}

@Component({
  selector: 'app-cancel-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './cancel-modal.component.html',
  styleUrls: ['./cancel-modal.component.css']
})
export class CancelModalComponent implements OnInit {
  @Input() config!: CancelModalConfig;
  @Input() loading = false;

  @Input() errorMessage: string | null = null;   // ← erreur backend affichée dans la modal

  //@Output() confirmed = new EventEmitter<string>();
  @Output() confirmed = new EventEmitter<{
    reason: string;
    notify: boolean;
  }>();
  @Output() cancelled = new EventEmitter<void>();

  reason = '';
  notify = false;
  ngOnInit() {
    // Réinitialiser l'erreur quand la modal s'ouvre
   // this.errorMessage = null;
  }

/*   onConfirm() {
    if (this.config.reasonRequired && !this.reason.trim()) return;
    this.confirmed.emit(this.reason.trim());
  } */

    onConfirm() {
      if (this.config.reasonRequired && !this.reason.trim()) return;

      this.confirmed.emit({
        reason: this.reason.trim(),
        notify: this.notify
      });
    }

  onCancel() {
    this.cancelled.emit();
  }

  onOverlayClick(e: MouseEvent) {
    if ((e.target as HTMLElement).classList.contains('modal-overlay')) {
      this.onCancel();
    }
  }
}
