import { Component, Input, Output, EventEmitter, OnInit, HostListener, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SedeService, Sede, Aula } from '../../../services/sede.service';
import { ValidatorService } from '../../../services/tools/validator-service';
import { ErrorsService } from '../../../services/tools/errors-service';
import { TruncateSelectLabelPipe } from '../../pipes/truncate-select-label.pipe';
import { ToastService } from '../../../services/tools/toast.service';

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
  // ── Modo edición: si se pasa editData, el modal actúa como editor ──
  @Input() editData?: Aula;
  @Input() editSedeNombre?: string;

  @Output() close = new EventEmitter<void>();

  private toastService = inject(ToastService);

  get isEditMode(): boolean {
    return !!this.editData;
  }

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
  estado: 'disponible' | 'en-uso' | 'mantenimiento' = 'disponible';
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

    // Pre-llenar campos si estamos en modo edición
    if (this.editData) {
      this.selectedSede = String(this.editData.sedeId || '');
      this.className = this.editData.nombre || '';
      this.capacity = this.editData.capacidad || 40;
      this.piso = this.editData.piso || 1;
      this.estado = this.editData.estado || 'disponible';
    }
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

    // ── Modo edición ──
    if (this.isEditMode && this.editData) {
      const editPayload = {
        sedeId: Number(this.selectedSede),
        nombre: this.className.trim(),
        capacidad: this.capacity,
        piso: this.piso,
        tipo: this.editData.tipo || 'Aula',
        estado: this.estado,
      };
      this.sedeService.editarAula(this.editData.id, editPayload).subscribe({
        next: () => {
          this.toastService.show('Aula actualizada correctamente.', 'success');
          this.close.emit();
        },
        error: (err: any) => {
          console.error('Error editando aula:', err);
          this.formError = this.parseApiError(err);
          this.toastService.show(this.parseApiError(err), 'error');
        },
      });
      return;
    }

    // ── Modo creación ──
    const data = {
      sedeId: Number(this.selectedSede),
      nombre: this.className.trim(),
      capacidad: this.capacity,
      piso: this.piso,
      tipo: 'Aula',
    };
    this.sedeService.crearAula(data).subscribe({
      next: () => {
        this.toastService.show('Aula creada correctamente.', 'success');
        this.close.emit();
      },
      error: (err: any) => {
        console.error('Error creando aula:', err);
        this.formError = this.parseApiError(err);
      },
    });
  }
}
