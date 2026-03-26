import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-confirmar-eliminar-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './confirmar-eliminar-modal.html',
  styleUrl: './confirmar-eliminar-modal.scss',
})
export class ConfirmarEliminarModal {
  @Input() titulo: string = '';
  @Input() mensaje: string = '';
  @Input() isLoading: boolean = false;

  @Output() confirmado = new EventEmitter<void>();
  @Output() cancelado  = new EventEmitter<void>();

  onConfirmar(): void { this.confirmado.emit(); }
  onCancelar(): void  { this.cancelado.emit(); }
}
