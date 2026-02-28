import { Component, Output, EventEmitter } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
    selector: 'app-nuevo-usuario-modal',
    imports: [FormsModule],
    templateUrl: './nuevo-usuario-modal.html',
    styleUrl: './nuevo-usuario-modal.scss',
})
export class NuevoUsuarioModal {
    @Output() close = new EventEmitter<void>();

    firstName = '';
    lastName = '';
    email = '';
    phone = '';
    selectedRole = '';
    sendInvite = true;

    roles = ['Admin', 'Docente', 'Organizador', 'Alumno'];

    onCancel(): void { this.close.emit(); }

    onSave(): void {
        // TODO: create user via API
        this.close.emit();
    }
}
