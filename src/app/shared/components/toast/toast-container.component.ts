import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-toast-container',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="toast-container">
      @for (toast of toastService.toasts(); track toast.id) {
        <div class="toast" [ngClass]="toast.type" (click)="toastService.dismiss(toast.id)">
          <i [attr.data-lucide]="toast.type === 'success' ? 'check-circle' : toast.type === 'error' ? 'x-circle' : toast.type === 'warning' ? 'alert-triangle' : 'info'"></i>
          <span>{{ toast.message }}</span>
        </div>
      }
    </div>
  `,
  styleUrls: ['./toast-container.component.css']
})
export class ToastContainerComponent {
  toastService = inject(ToastService);
}
