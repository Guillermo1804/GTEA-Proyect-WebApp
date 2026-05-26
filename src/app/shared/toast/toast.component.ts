import { Component, inject } from '@angular/core';
import { ToastService } from '../../services/tools/toast.service';

@Component({
    selector: 'app-toast',
    template: `
    <div class="toast-container">
      @for (toast of toastService.toasts(); track toast.id) {
        <div class="toast-item" [class]="'toast-' + toast.tipo">
          <span class="toast-icon material-icons">
            @switch (toast.tipo) {
              @case ('success') { check_circle }
              @case ('error') { error }
              @case ('warning') { warning }
            }
          </span>
          <span class="toast-text">{{ toast.mensaje }}</span>
          <button class="toast-close" (click)="toastService.dismiss(toast.id)">
            <span class="material-icons">close</span>
          </button>
        </div>
      }
    </div>
  `,
    styles: [`
    .toast-container {
      position: fixed;
      bottom: 24px;
      right: 24px;
      z-index: 9999;
      display: flex;
      flex-direction: column;
      gap: 8px;
      max-width: 380px;
    }

    .toast-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 16px;
      border-radius: 8px;
      color: #ffffff;
      font-family: 'Inter', sans-serif;
      font-size: 14px;
      font-weight: 600;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
      animation: slideIn 0.3s ease-out;
      min-width: 300px;
    }

    .toast-success { background-color: #059669; }
    .toast-error   { background-color: #dc2626; }
    .toast-warning { background-color: #ea580c; }

    .toast-icon {
      font-size: 20px;
      flex-shrink: 0;
    }

    .toast-text {
      flex: 1;
      line-height: 1.4;
    }

    .toast-close {
      background: none;
      border: none;
      color: #ffffff;
      cursor: pointer;
      padding: 0;
      display: flex;
      align-items: center;
      opacity: 0.8;
      flex-shrink: 0;
    }

    .toast-close:hover { opacity: 1; }

    .toast-close .material-icons { font-size: 18px; }

    @keyframes slideIn {
      from {
        transform: translateX(100%);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }

    @media (max-width: 480px) {
      .toast-container {
        bottom: 80px;
        right: 12px;
        left: 12px;
        max-width: none;
      }
      .toast-item { min-width: auto; }
    }
  `],
})
export class ToastComponent {
    protected toastService = inject(ToastService);
}
