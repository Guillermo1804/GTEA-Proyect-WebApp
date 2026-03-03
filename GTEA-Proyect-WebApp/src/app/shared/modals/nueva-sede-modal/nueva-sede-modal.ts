import { Component, Output, EventEmitter, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SedeService } from '../../../services/sede.service';

@Component({
    selector: 'app-nueva-sede-modal',
    imports: [FormsModule],
    templateUrl: './nueva-sede-modal.html',
    styleUrl: './nueva-sede-modal.scss',
})
export class NuevaSedeModal implements OnInit {
    ngOnInit(): void { }
    constructor(
        private sedeService: SedeService,
    ) { }

    @Output() close = new EventEmitter<void>();

    sedeName = '';
    address = '';
    phone = '';
    email = '';
    floors = 1;
    notes = '';

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

    onSave(): void {
        if (!this.sedeName.trim()) return;
        const instalaciones = this.facilities.filter(f => f.enabled).map(f => f.name);
        const data = {
            nombre: this.sedeName,
            domicilio: this.address,
            telefono: this.phone,
            email: this.email,
            pisos: this.floors,
            notas: this.notes,
            instalaciones: instalaciones,
            activa: true,
        };
        this.sedeService.crearSede(data).subscribe({
            next: () => this.close.emit(),
            error: (err: any) => console.error('Error creando sede:', err),
        });
    }
}
