import { Component, Output, EventEmitter, OnInit, HostListener } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SedeService, Sede } from '../../../services/sede.service';
import { ValidatorService } from '../../../services/tools/validator-service';
import { ErrorsService } from '../../../services/tools/errors-service';
import { TruncateSelectLabelPipe } from '../../pipes/truncate-select-label.pipe';

interface Equipment {
  name: string;
  icon: string;
  enabled: boolean;
}

@Component({
  selector: 'app-nueva-aula-modal',
  standalone: true,
  imports: [FormsModule, TruncateSelectLabelPipe],
  templateUrl: './nueva-aula-modal.html',
  styleUrl: './nueva-aula-modal.scss',
})
export class NuevaAulaModal implements OnInit {
  @Output() close = new EventEmitter<void>();

  constructor(
    private sedeService: SedeService,
    private validatorService: ValidatorService,
    private errorsService: ErrorsService,
  ) { }

  selectedSede = '';
  className = '';
  capacity = 40;
  notes = '';
  piso = 1;
  submitted = false;
  formError = '';

  equipmentList: Equipment[] = [
    { name: 'Proyector', icon: 'videocam', enabled: true },
    { name: 'Sistema de Audio', icon: 'volume_up', enabled: false },
    { name: 'Pizarra Digital', icon: 'tv', enabled: true },
    { name: 'Aire Acondicionado', icon: 'ac_unit', enabled: false },
    { name: 'Acceso Discapacidad', icon: 'accessible', enabled: true },
  ];

  sedes: Sede[] = [];

  ngOnInit(): void {
    this.sedeService.obtenerSedes().subscribe({
      next: (data: any) => this.sedes = data || [],
      error: (err: any) => console.error('Error cargando sedes:', err),
    });
  }

  incrementCapacity(): void {
    this.capacity++;
  }

  decrementCapacity(): void {
    if (this.capacity > 1) this.capacity--;
  }

  toggleEquipment(item: Equipment): void {
    item.enabled = !item.enabled;
  }

  onCancel(): void {
    this.close.emit();
  }

  @HostListener('document:keydown.escape')
  onEscape() {
    this.onCancel();
  }

  hasError(field: 'selectedSede' | 'className' | 'capacity' | 'piso'): boolean {
    return this.submitted && this.getFieldError(field).length > 0;
  }

  getFieldError(field: 'selectedSede' | 'className' | 'capacity' | 'piso'): string {
    if (!this.submitted) return '';

    if (field === 'selectedSede' && !this.validatorService.required(this.selectedSede)) {
      return this.errorsService.required;
    }

    if (field === 'className') {
      if (!this.validatorService.required(this.className)) return this.errorsService.required;
      if (!this.validatorService.max(this.className.trim(), 200)) return this.errorsService.max(200);
    }

    if (field === 'capacity') {
      if (!this.validatorService.numeric(this.capacity)) return this.errorsService.numeric;
      if (Number(this.capacity) < 1) return this.errorsService.min(1);
    }

    if (field === 'piso') {
      if (!this.validatorService.numeric(this.piso)) return this.errorsService.numeric;
      if (Number(this.piso) < 1) return this.errorsService.min(1);
    }

    return '';
  }

  private parseApiError(err: any): string {
    if (err?.error?.message) return err.error.message;
    if (err?.error?.detail) return err.error.detail;
    if (err?.error && typeof err.error === 'object') {
      const messages = Object.values(err.error).flat().join(' | ');
      if (messages) return messages;
    }
    return this.errorsService.generic;
  }

  private isValidForm(): boolean {
    return !this.getFieldError('selectedSede') &&
      !this.getFieldError('className') &&
      !this.getFieldError('capacity') &&
      !this.getFieldError('piso');
  }

  onSave(): void {
    this.submitted = true;
    this.formError = '';
    if (!this.isValidForm()) return;

    const data = {
      sedeId: Number(this.selectedSede),
      nombre: this.className.trim(),
      capacidad: this.capacity,
      piso: this.piso,
      tipo: 'Aula',
    };
    this.sedeService.crearAula(data).subscribe({
      next: () => this.close.emit(),
      error: (err: any) => {
        console.error('Error creando aula:', err);
        this.formError = this.parseApiError(err);
      },
    });
  }
}
