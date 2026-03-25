import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-confirmar-accion-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './confirmar-accion-modal.component.html',
  styleUrl: './confirmar-accion-modal.component.scss',
})
export class ConfirmarAccionModalComponent {
  @Input() titulo: string = '¿Confirmar acción?';
  @Input() mensaje: string = '';
  @Input() labelConfirmar: string = 'Confirmar';
  @Input() labelCancelar: string = 'Cancelar';
  @Output() confirmar = new EventEmitter<void>();
  @Output() cancelar = new EventEmitter<void>();

  onCancelar(): void {
    this.cancelar.emit();
  }

  onConfirmar(): void {
    this.confirmar.emit();
  }
}
