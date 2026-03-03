import { Component, Output, EventEmitter } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AdminServiceService } from '../../../services/admin-service.service';
import { OrganizadorService } from '../../../services/organizador-service';
import { AlumnoService } from '../../../services/alumno-service';

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
    ) { }

    firstName = '';
    lastName = '';
    email = '';
    phone = '';
    selectedRole = '';
    sendInvite = true;

    roles = ['Admin', 'Organizador', 'Alumno'];

    onCancel(): void { this.close.emit(); }

    onSave(): void {
        if (!this.firstName.trim() || !this.email.trim() || !this.selectedRole) return;
        const userData: any = {
            first_name: this.firstName,
            last_name: this.lastName,
            email: this.email,
            password: 'Temporal123!',
            telefono: this.phone,
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
                return;
        }
        service$.subscribe({
            next: () => this.close.emit(),
            error: (err: any) => console.error('Error creando usuario:', err),
        });
    }
}
