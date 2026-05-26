import { Component, Output, EventEmitter, HostListener, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AdminServiceService } from '../../../services/admin-service.service';
import { OrganizadorService } from '../../../services/organizador-service';
import { AlumnoService } from '../../../services/alumno-service';
import { ErrorsService } from '../../../services/tools/errors-service';
import { ToastService } from '../../../services/tools/toast.service';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-nuevo-usuario-modal',
    imports: [FormsModule, CommonModule],
    templateUrl: './nuevo-usuario-modal.html',
    styleUrl: './nuevo-usuario-modal.scss',
})
export class NuevoUsuarioModal {
    @Input() fixedRole = '';
    @Output() close = new EventEmitter<void>();
    @Output() created = new EventEmitter<void>();

    constructor(
        private adminService: AdminServiceService,
        private organizadorService: OrganizadorService,
        private alumnoService: AlumnoService,
        private errorsService: ErrorsService,
        private toastService: ToastService,
    ) { }

    firstName = '';
    lastName = '';
    email = '';
    password = '';
    showPassword = false;
    selectedRole = '';
    submitted = false;
    formError = '';

    roles = ['Admin', 'Organizador', 'Alumno'];

    onCancel(): void { this.close.emit(); }

    @HostListener('document:keydown.escape')
    onEscape() {
        this.onCancel();
    }

    hasError(field: 'firstName' | 'email' | 'selectedRole' | 'password'): boolean {
        return this.submitted && this.getFieldError(field).length > 0;
    }

    getFieldError(field: 'firstName' | 'email' | 'selectedRole' | 'password'): string {
        if (!this.submitted) return '';

        if (field === 'firstName') {
            if (!this.firstName || this.firstName.trim().length === 0) return this.errorsService.required;
            if (this.firstName.trim().length > 120) return this.errorsService.max(120);
        }

        if (field === 'email') {
            if (!this.email || this.email.trim().length === 0) return this.errorsService.required;
            // Basic email regex since ValidatorService was removed
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(this.email.trim())) return this.errorsService.email;

            // Validación de dominio (Sprint S2 v5)
            const dominios: Record<string, string> = {
                alumno: '@alumno.com',
                organizador: '@organizador.com',
                administrador: '@admin.com',
                admin: '@admin.com'
            };
            const role = (this.fixedRole || this.selectedRole).toLowerCase();
            const dominioEsperado = dominios[role];
            if (dominioEsperado && !this.email.trim().endsWith(dominioEsperado)) {
                return `El email debe pertenecer al dominio ${dominioEsperado} para este tipo de usuario`;
            }
        }

        if (field === 'selectedRole' && !this.fixedRole && (!this.selectedRole || this.selectedRole.length === 0)) {
            return this.errorsService.required;
        }

        if (field === 'password') {
            if (!this.password || this.password.length === 0) return this.errorsService.required;
            if (this.password.length < 8) return this.errorsService.min(8);
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
            !this.getFieldError('password');
    }

    togglePassword(): void {
        this.showPassword = !this.showPassword;
    }

    onSave(): void {
        this.submitted = true;
        this.formError = '';
        if (!this.isValidForm()) return;

        const dominios: Record<string, string> = {
            alumno: '@alumno.com',
            organizador: '@organizador.com',
            administrador: '@admin.com',
            admin: '@admin.com'
        };
        const role = (this.fixedRole || this.selectedRole).toLowerCase();
        const dominioEsperado = dominios[role];
        if (dominioEsperado && !this.email.trim().endsWith(dominioEsperado)) {
            return; // Bloqueado por getFieldError
        }

        const roleToAssign = this.fixedRole || this.selectedRole;
        // Mapeo a lowercase requerido por el backend
        const roleKey = roleToAssign.toLowerCase() === 'admin' ? 'administrador' : roleToAssign.toLowerCase();

        const userData: any = {
            first_name: this.firstName.trim(),
            last_name: this.lastName.trim(),
            email: this.email.trim(),
            password: this.password,
            rol: roleKey, 
        };

        let service$;
        switch (roleToAssign) {
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
            next: () => {
                this.created.emit();
                this.close.emit();
            },
            error: (err: any) => {
                console.error('Error creando usuario:', err);
                const errorBody = err.error;
                const mensaje = errorBody?.message || errorBody?.detail ||
                                errorBody?.error || 'Error al crear el usuario';
                this.toastService.show(mensaje, 'error');
                this.formError = mensaje;
            },
        });
    }
}
