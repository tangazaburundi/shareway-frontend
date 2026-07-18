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
  styles: [`
    .toast-container {
      position: fixed;
      top: 1rem;
      right: 1rem;
      z-index: 9999;
      display: flex;
      flex-direction: column;
      gap: .5rem;
      max-width: 360px;
    }
    .toast {
      display: flex;
      align-items: center;
      gap: .6rem;
      padding: .75rem 1rem;
      border-radius: 8px;
      color: #fff;
      font-size: .875rem;
      font-weight: 500;
      cursor: pointer;
      box-shadow: 0 4px 12px rgba(0,0,0,.15);
      animation: slideIn .25s ease-out;
    }
    .toast i { width: 18px; height: 18px; flex-shrink: 0; }
    .toast.success { background: #10b981; }
    .toast.error { background: #ef4444; }
    .toast.info { background: #3b82f6; }
    .toast.warning { background: #f59e0b; }
    @keyframes slideIn {
      from { transform: translateX(100%); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }
  `]
})
export class ToastContainerComponent {
  toastService = inject(ToastService);
}
