import { Component, Output, EventEmitter, HostListener } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AdminServiceService } from '../../../services/admin-service.service';
import { OrganizadorService } from '../../../services/organizador-service';
import { AlumnoService } from '../../../services/alumno-service';
import { ValidatorService } from '../../../services/tools/validator-service';
import { ErrorsService } from '../../../services/tools/errors-service';

@Component({
    selector: 'app-nuevo-usuario-modal',
    imports: [FormsModule],
    templateUrl: './nuevo-usuario-modal.html',
    styleUrl: './nuevo-usuario-modal.scss',
})
export class NuevoUsuarioModal {
    @Output() close = new EventEmitter<void>();

    constructor(
        private adminService: AdminServiceService,
        private organizadorService: OrganizadorService,
        private alumnoService: AlumnoService,
        private validatorService: ValidatorService,
        private errorsService: ErrorsService,
    ) { }

    firstName = '';
    lastName = '';
    email = '';
    phone = '';
    selectedRole = '';
    sendInvite = true;
    submitted = false;
    formError = '';

    roles = ['Admin', 'Organizador', 'Alumno'];

    onCancel(): void { this.close.emit(); }

    @HostListener('document:keydown.escape')
    onEscape() {
        this.onCancel();
    }

    hasError(field: 'firstName' | 'email' | 'selectedRole' | 'phone'): boolean {
        return this.submitted && this.getFieldError(field).length > 0;
    }

    getFieldError(field: 'firstName' | 'email' | 'selectedRole' | 'phone'): string {
        if (!this.submitted) return '';

        if (field === 'firstName') {
            if (!this.validatorService.required(this.firstName)) return this.errorsService.required;
            if (!this.validatorService.max(this.firstName.trim(), 120)) return this.errorsService.max(120);
        }

        if (field === 'email') {
            if (!this.validatorService.required(this.email)) return this.errorsService.required;
            if (!this.validatorService.email(this.email.trim())) return this.errorsService.email;
        }

        if (field === 'selectedRole' && !this.validatorService.required(this.selectedRole)) {
            return this.errorsService.required;
        }

        if (field === 'phone' && this.validatorService.required(this.phone)) {
            const sanitizedPhone = this.phone.replace(/\s|\(|\)|-/g, '');
            if (!this.validatorService.numeric(sanitizedPhone)) return this.errorsService.numeric;
            if (!this.validatorService.max(sanitizedPhone, 15)) return this.errorsService.max(15);
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
        return !this.getFieldError('firstName') &&
            !this.getFieldError('email') &&
            !this.getFieldError('selectedRole') &&
            !this.getFieldError('phone');
    }

    onSave(): void {
        this.submitted = true;
        this.formError = '';
        if (!this.isValidForm()) return;

        const userData: any = {
            first_name: this.firstName.trim(),
            last_name: this.lastName.trim(),
            email: this.email.trim(),
            password: 'Temporal123!',
            telefono: this.phone.trim(),
            rol: this.selectedRole.toLowerCase(),
        };
        let service$;
        switch (this.selectedRole) {
            case 'Admin':
                service$ = this.adminService.registrarAdmin(userData);
                break;
            case 'Organizador':
                service$ = this.organizadorService.registrarOrganizador(userData);
                break;
            case 'Alumno':
                service$ = this.alumnoService.registrarAlumno(userData);
                break;
            default:
                this.formError = this.errorsService.required;
                return;
        }
        service$.subscribe({
            next: () => this.close.emit(),
            error: (err: any) => {
                console.error('Error creando usuario:', err);
                this.formError = this.parseApiError(err);
            },
        });
    }
}
