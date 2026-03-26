import { Component, Input, Output, EventEmitter } from '@angular/core';
import { FormsModule } from '@angular/forms';

interface FiltrosSedes {
  estadoAula: string[];
  capacidadMin: number | null;
  capacidadMax: number | null;
  busqueda: string;
}

@Component({
  selector: 'app-filtros-sedes-modal',
  imports: [FormsModule],
  templateUrl: './filtros-sedes-modal.component.html',
  styleUrl: './filtros-sedes-modal.component.scss',
})
export class FiltrosSedesModal {
  @Input() filtros: FiltrosSedes = {
    estadoAula: [],
    capacidadMin: null,
    capacidadMax: null,
    busqueda: ''
  };

  @Output() close = new EventEmitter<void>();
  @Output() aplicarFiltros = new EventEmitter<FiltrosSedes>();

  filtrosTemp: FiltrosSedes = { ...this.filtros };

  ngOnInit() {
    this.filtrosTemp = { ...this.filtros };
  }

  toggleEstado(estado: string): void {
    const index = this.filtrosTemp.estadoAula.indexOf(estado);
    if (index > -1) {
      this.filtrosTemp.estadoAula.splice(index, 1);
    } else {
      this.filtrosTemp.estadoAula.push(estado);
    }
  }

  isEstadoSelected(estado: string): boolean {
    return this.filtrosTemp.estadoAula.includes(estado);
  }

  aplicar(): void {
    this.aplicarFiltros.emit(this.filtrosTemp);
    this.close.emit();
  }

  limpiar(): void {
    this.filtrosTemp = {
      estadoAula: [],
      capacidadMin: null,
      capacidadMax: null,
      busqueda: ''
    };
  }

  cancelar(): void {
    this.close.emit();
  }
}