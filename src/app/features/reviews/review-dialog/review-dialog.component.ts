/*

import { Component, Inject,inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ReviewService } from '../../../core/services/review.service';
import { FormsModule } from '@angular/forms';
import { MatDialogModule } from '@angular/material/dialog';


@Component({
   selector: 'app-review-dialog',
    standalone: true,
    imports: [FormsModule,MatDialogModule],
    templateUrl: './review-dialog.component.html',
    styleUrl: './review-dialog.component.css'
})
export class ReviewDialogComponent {

  rating = 0;
  comment = '';
  loading = false;
  errorMsg = '';

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,
    private dialogRef: MatDialogRef<ReviewDialogComponent>
  ) {}
  private reviewService = inject(ReviewService);
  setRating(value: number) {
    this.rating = value;
  }

  submit(): void {
    if (!this.rating) return;

    this.loading = true;

    this.reviewService.create({
      tripId: this.data.tripId,
      targetUserId: this.data.targetUserId,
      rating: this.rating,
      comment: this.comment
    }).subscribe({
      next: () => {
        this.loading = false;
        this.dialogRef.close(true); // succès
      },
      error: (e: any) => {
        this.errorMsg = e.error?.message || 'Erreur';
        this.loading = false;
      }
    });
  }

  close(): void {
    this.dialogRef.close(false);
  }
} */
