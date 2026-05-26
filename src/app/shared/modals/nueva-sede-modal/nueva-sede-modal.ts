import { Component, Input, Output, EventEmitter, OnInit, HostListener, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SedeService, Sede } from '../../../services/sede.service';
import { ValidatorService } from '../../../services/tools/validator-service';
import { ErrorsService } from '../../../services/tools/errors-service';
import { ToastService } from '../../../services/tools/toast.service';

@Component({
    selector: 'app-nueva-sede-modal',
    imports: [FormsModule],
    templateUrl: './nueva-sede-modal.html',
    styleUrl: './nueva-sede-modal.scss',
})
export class NuevaSedeModal implements OnInit {
    // ── Modo edición: si se pasa editData, el modal actúa como editor ──
    @Input() editData?: Sede;

    private toastService = inject(ToastService);

    get isEditMode(): boolean {
        return !!this.editData;
    }

    ngOnInit(): void {
        if (this.editData) {
            this.sedeName = this.editData.nombre || '';
            this.address = this.editData.domicilio || '';
            this.phone = this.editData.telefono || '';
            this.email = this.editData.email || '';
            this.floors = this.editData.pisos || 1;
            this.notes = this.editData.notas || '';
            // Pre-llenar instalaciones desde los datos de edición
            const enabledFacilities = this.editData.instalaciones || [];
            this.facilities.forEach(f => {
                f.enabled = enabledFacilities.includes(f.name);
            });
        }
    }
    constructor(
        private sedeService: SedeService,
        private validatorService: ValidatorService,
        private errorsService: ErrorsService,
    ) { }

    @Output() close = new EventEmitter<void>();

    sedeName = '';
    address = '';
    phone = '';
    email = '';
    floors = 1;
    notes = '';
    submitted = false;
    formError = '';

    facilities = [
        { name: 'Estacionamiento', icon: 'local_parking', enabled: true },
        { name: 'WiFi', icon: 'wifi', enabled: true },
        { name: 'Cafetería', icon: 'coffee', enabled: false },
        { name: 'Acceso Discapacidad', icon: 'accessible', enabled: true },
        { name: 'Biblioteca', icon: 'local_library', enabled: false },
    ];

    incrementFloors(): void { this.floors++; }
    decrementFloors(): void { if (this.floors > 1) this.floors--; }

    toggleFacility(item: any): void { item.enabled = !item.enabled; }

    onCancel(): void { this.close.emit(); }

    @HostListener('document:keydown.escape')
    onEscape() {
        this.onCancel();
    }

    hasError(field: 'sedeName' | 'email' | 'floors'): boolean {
        return this.submitted && this.getFieldError(field).length > 0;
    }

    getFieldError(field: 'sedeName' | 'email' | 'floors'): string {
        if (!this.submitted) return '';

        if (field === 'sedeName') {
            if (!this.validatorService.required(this.sedeName)) return this.errorsService.required;
            if (!this.validatorService.max(this.sedeName.trim(), 200)) return this.errorsService.max(200);
        }

        if (field === 'email' && this.validatorService.required(this.email)) {
            if (!this.validatorService.email(this.email.trim())) return this.errorsService.email;
        }

        if (field === 'floors') {
            if (!this.validatorService.numeric(this.floors)) return this.errorsService.numeric;
            if (Number(this.floors) < 1) return this.errorsService.min(1);
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
        return !this.getFieldError('sedeName') && !this.getFieldError('email') && !this.getFieldError('floors');
    }

    onSave(): void {
        this.submitted = true;
        this.formError = '';
        if (!this.isValidForm()) return;

        const instalaciones = this.facilities.filter(f => f.enabled).map(f => f.name);
        const data = {
            nombre: this.sedeName.trim(),
            domicilio: this.address.trim(),
            telefono: this.phone.trim(),
            email: this.email.trim(),
            pisos: this.floors,
            notas: this.notes.trim(),
            instalaciones: instalaciones,
            activa: true,
        };

        // ── Modo edición ──
        if (this.isEditMode && this.editData) {
            this.sedeService.editarSede(this.editData.id, data).subscribe({
                next: () => {
                    this.toastService.show('Sede actualizada correctamente.', 'success');
                    this.close.emit();
                },
                error: (err: any) => {
                    console.error('Error editando sede:', err);
                    this.formError = this.parseApiError(err);
                    this.toastService.show(this.parseApiError(err), 'error');
                },
            });
            return;
        }

        // ── Modo creación ──
        this.sedeService.crearSede(data).subscribe({
            next: () => {
                this.toastService.show('Sede creada correctamente.', 'success');
                this.close.emit();
            },
            error: (err: any) => {
                console.error('Error creando sede:', err);
                this.formError = this.parseApiError(err);
            },
        });
    }
}
