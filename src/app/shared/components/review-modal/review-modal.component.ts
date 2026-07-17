import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ReviewService } from '../../../core/services/review.service';
import { LanguageService } from '../../../core/services/language.service';
import { ModalComponent } from '../modal/modal.component';
import { RatingStarsComponent } from '../rating-stars/rating-stars.component';

@Component({ selector: 'app-review-modal', standalone: true,
  imports: [CommonModule, FormsModule, ModalComponent, RatingStarsComponent],
  templateUrl: './review-modal.component.html', styleUrls: ['./review-modal.component.css'] })
export class ReviewModalComponent {
  @Input() open = false;
  @Input() tripId = '';
  @Input() targetUserId = '';
  @Output() submitted = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();

  private reviewService = inject(ReviewService);
  langService = inject(LanguageService);
 errorMsg = ''; successMsg = '';
  rating = 0; comment = ''; loading = false;

  submit(): void {
    if (!this.rating) return;
    this.loading = true;
    this.reviewService.create({ tripId: this.tripId, targetUserId: this.targetUserId, rating: this.rating, comment: this.comment }).subscribe({
      next: () => { this.loading = false; this.submitted.emit(); this.reset(); },

      error: (e) => { this.errorMsg = e.error?.message || 'Erreur'; this.loading = false; }
    });
  }

  cancel(): void { this.cancelled.emit(); this.reset(); }
  reset(): void { this.rating = 0; this.comment = ''; }

}