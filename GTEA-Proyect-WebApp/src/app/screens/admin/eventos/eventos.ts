import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TopNavbar } from '../../../partials/top-navbar/top-navbar';
import { BottomNav } from '../../../partials/bottom-nav/bottom-nav';
import { NuevaAulaModal } from '../sedes/nueva-aula-modal/nueva-aula-modal';
import { NuevaSedeModal } from '../../../shared/modals/nueva-sede-modal/nueva-sede-modal';
import { NuevaCategoriaModal } from '../../../shared/modals/nueva-categoria-modal/nueva-categoria-modal';
import { NuevoUsuarioModal } from '../../../shared/modals/nuevo-usuario-modal/nuevo-usuario-modal';

interface EventItem {
    id: number;
    title: string;
    category: string;
    categoryColor: string;
    date: string;
    time: string;
    location: string;
    organizer: string;
    capacity: number;
    enrolled: number;
    status: 'Activo' | 'Borrador' | 'Finalizado' | 'Cancelado';
}

@Component({
    selector: 'app-admin-eventos',
    imports: [FormsModule, TopNavbar, BottomNav, NuevaAulaModal, NuevaSedeModal, NuevaCategoriaModal, NuevoUsuarioModal],
    templateUrl: './eventos.html',
    styleUrl: './eventos.scss',
})
export class Eventos implements OnInit {
    readonly form: any;
    errorMessage: string = '';
    successMessage: string = '';
    ngOnInit(): void {

    }
    constructor(private router: Router) { }

    activeModal: 'nueva-aula' | 'nueva-sede' | 'nueva-categoria' | 'nuevo-usuario' | null = null;
    searchQuery = '';
    activeFilter = 'Todos';
    filters = ['Todos', 'Activo', 'Borrador', 'Finalizado', 'Cancelado'];

    events: EventItem[] = [
        {
            id: 1, title: 'Taller de Python Avanzado', category: 'Talleres', categoryColor: '#1e3fae',
            date: '12 Mar 2026', time: '09:00 - 12:00', location: 'Lab. Sistemas #3',
            organizer: 'Dr. Carlos Mendoza', capacity: 40, enrolled: 38, status: 'Activo'
        },
        {
            id: 2, title: 'Conferencia Inteligencia Artificial', category: 'Conferencias', categoryColor: '#7c3aed',
            date: '15 Mar 2026', time: '16:00 - 18:00', location: 'Auditorio Principal',
            organizer: 'Dra. Ana García', capacity: 200, enrolled: 195, status: 'Activo'
        },
        {
            id: 3, title: 'Torneo de Ajedrez Interuniversitario', category: 'Deportes', categoryColor: '#059669',
            date: '20 Mar 2026', time: '10:00 - 17:00', location: 'Sala de Usos Múltiples',
            organizer: 'Prof. Roberto Sánchez', capacity: 50, enrolled: 50, status: 'Activo'
        },
        {
            id: 4, title: 'Seminario de Metodología de Investigación', category: 'Seminarios', categoryColor: '#f97316',
            date: '25 Mar 2026', time: '14:00 - 16:00', location: 'Aula Magna',
            organizer: 'Dra. María Rodríguez', capacity: 80, enrolled: 45, status: 'Borrador'
        },
        {
            id: 5, title: 'Hackathon GTEA 2026', category: 'Talleres', categoryColor: '#1e3fae',
            date: '01 Abr 2026', time: '08:00 - 20:00', location: 'Lab. Sistemas #1 y #2',
            organizer: 'Ing. Pedro Ramírez', capacity: 60, enrolled: 55, status: 'Activo'
        },
        {
            id: 6, title: 'Exposición de Arte Digital', category: 'Culturales', categoryColor: '#e11d48',
            date: '05 Feb 2026', time: '11:00 - 19:00', location: 'Galería Central',
            organizer: 'Lic. Laura Gómez', capacity: 100, enrolled: 100, status: 'Finalizado'
        },
    ];

    get filteredEvents(): EventItem[] {
        let filtered = this.events;
        if (this.activeFilter !== 'Todos') filtered = filtered.filter(e => e.status === this.activeFilter);
        if (this.searchQuery) {
            const q = this.searchQuery.toLowerCase();
            filtered = filtered.filter(e =>
                e.title.toLowerCase().includes(q) ||
                e.organizer.toLowerCase().includes(q) ||
                e.category.toLowerCase().includes(q)
            );
        }
        return filtered;
    }

    get activeCount(): number { return this.events.filter(e => e.status === 'Activo').length; }
    get draftCount(): number { return this.events.filter(e => e.status === 'Borrador').length; }
    get finishedCount(): number { return this.events.filter(e => e.status === 'Finalizado').length; }

    setFilter(filter: string): void { this.activeFilter = filter; }

    getOccupancy(event: EventItem): number {
        return Math.round((event.enrolled / event.capacity) * 100);
    }

    getOccupancyColor(event: EventItem): string {
        const pct = this.getOccupancy(event);
        if (pct >= 90) return '#dc2626';
        if (pct >= 70) return '#ea580c';
        return '#059669';
    }

    getStatusClass(status: string): string {
        switch (status) {
            case 'Activo': return 'status-active';
            case 'Borrador': return 'status-draft';
            case 'Finalizado': return 'status-finished';
            case 'Cancelado': return 'status-cancelled';
            default: return '';
        }
    }

    editEvent(event: EventItem): void { /* TODO */ }
    deleteEvent(event: EventItem): void { /* TODO */ }
    viewEvent(event: EventItem): void { /* TODO */ }

    onFabAction(action: string): void { this.activeModal = action as any; }
    closeModal(): void { this.activeModal = null; }
}
