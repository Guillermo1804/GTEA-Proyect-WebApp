import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-eliminar-user-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './eliminar-user-modal.component.html',
  styleUrl: './eliminar-user-modal.component.scss',
})
export class EliminarUserModalComponent {
  @Input() userName: string = '';
  @Output() close = new EventEmitter<void>();
  @Output() confirmDelete = new EventEmitter<void>();

  onClose(): void {
    this.close.emit();
  }

  onConfirm(): void {
    this.confirmDelete.emit();
  }
}