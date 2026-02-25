import { Component, Output, EventEmitter, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
    selector: 'app-nueva-sede-modal',
    imports: [FormsModule],
    templateUrl: './nueva-sede-modal.html',
    styleUrl: './nueva-sede-modal.scss',
})
export class NuevaSedeModal implements OnInit {
    ngOnInit(): void { }
    constructor(
        private router: Router,
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
        // TODO: save sede via API
        this.close.emit();
    }
}
