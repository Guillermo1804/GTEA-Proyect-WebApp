import { Component, OnInit } from '@angular/core';
import { TopNavbar } from '../../../partials/top-navbar/top-navbar';
import { BottomNav } from '../../../partials/bottom-nav/bottom-nav';
import { BackHeader } from '../../../partials/back-header/back-header';
import { NuevaAulaModal } from './nueva-aula-modal/nueva-aula-modal';
import { NuevaSedeModal } from '../../../shared/modals/nueva-sede-modal/nueva-sede-modal';
import { NuevaCategoriaModal } from '../../../shared/modals/nueva-categoria-modal/nueva-categoria-modal';
import { NuevoUsuarioModal } from '../../../shared/modals/nuevo-usuario-modal/nuevo-usuario-modal';

interface Classroom {
  name: string;
  capacity: number;
  status: 'Disponible' | 'Ocupada' | 'Mantenimiento';
}

interface Venue {
  name: string;
  icon: string;
  classroomCount: number;
  totalCapacity: number;
  expanded: boolean;
  classrooms: Classroom[];
}

@Component({
  selector: 'app-admin-sedes',
  imports: [TopNavbar, BottomNav, BackHeader, NuevaAulaModal, NuevaSedeModal, NuevaCategoriaModal, NuevoUsuarioModal],
  templateUrl: './sedes.html',
  styleUrl: './sedes.scss',
})
export class Sedes implements OnInit {
  readonly form: any;
  errorMessage: string = '';
  successMessage: string = '';
  ngOnInit(): void {

  }
  activeModal: 'nueva-aula' | 'nueva-sede' | 'nueva-categoria' | 'nuevo-usuario' | null = null;

  venues: Venue[] = [
    {
      name: 'Edificio A - Ingeniería', icon: 'business',
      classroomCount: 12, totalCapacity: 480, expanded: true,
      classrooms: [
        { name: 'Lab. Sistemas #1', capacity: 40, status: 'Disponible' },
        { name: 'Lab. Sistemas #2', capacity: 40, status: 'Ocupada' },
        { name: 'Aula Magna', capacity: 120, status: 'Disponible' },
        { name: 'Sala Cómputo', capacity: 30, status: 'Mantenimiento' },
      ]
    },
    {
      name: 'Edificio B - Ciencias', icon: 'science',
      classroomCount: 8, totalCapacity: 320, expanded: false,
      classrooms: [
        { name: 'Lab. Química', capacity: 35, status: 'Disponible' },
        { name: 'Lab. Física', capacity: 35, status: 'Ocupada' },
      ]
    },
    {
      name: 'Edificio C - Humanidades', icon: 'menu_book',
      classroomCount: 6, totalCapacity: 240, expanded: false,
      classrooms: []
    },
  ];

  toggleVenue(venue: Venue): void { venue.expanded = !venue.expanded; }

  getStatusClass(status: string): string {
    switch (status) {
      case 'Disponible': return 'status-available';
      case 'Ocupada': return 'status-occupied';
      case 'Mantenimiento': return 'status-maintenance';
      default: return '';
    }
  }

  onFabAction(action: string): void { this.activeModal = action as any; }
  closeModal(): void { this.activeModal = null; }

  openNewAula(): void { this.activeModal = 'nueva-aula'; }
  openNewSede(): void { this.activeModal = 'nueva-sede'; }
}
