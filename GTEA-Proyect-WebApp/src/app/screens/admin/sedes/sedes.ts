import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { TopNavbar } from '../../../partials/top-navbar/top-navbar';
import { BottomNav } from '../../../partials/bottom-nav/bottom-nav';
import { BackHeader } from '../../../partials/back-header/back-header';
import { NuevaAulaModal } from './nueva-aula-modal/nueva-aula-modal';
import { NuevaSedeModal } from '../../../shared/modals/nueva-sede-modal/nueva-sede-modal';
import { NuevaCategoriaModal } from '../../../shared/modals/nueva-categoria-modal/nueva-categoria-modal';
import { NuevoUsuarioModal } from '../../../shared/modals/nuevo-usuario-modal/nuevo-usuario-modal';
import { SedeService } from '../../../services/sede.service';

interface Classroom {
  id: number;
  name: string;
  capacity: number;
  status: string;
}

interface Venue {
  id: number;
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

  constructor(private sedeService: SedeService, private cdr: ChangeDetectorRef) { }

  ngOnInit(): void {
    this.loadSedes();
  }

  activeModal: 'nueva-aula' | 'nueva-sede' | 'nueva-categoria' | 'nuevo-usuario' | null = null;

  venues: Venue[] = [];

  loadSedes(): void {
    this.sedeService.obtenerSedes().subscribe({
      next: (sedes) => {
        this.venues = sedes.map((s: any) => ({
          id: s.id,
          name: s.nombre,
          icon: 'business',
          classroomCount: 0,
          totalCapacity: 0,
          expanded: false,
          classrooms: [],
        }));
        this.cdr.markForCheck();
        // Cargar aulas para cada sede
        this.venues.forEach((v) => {
          this.sedeService.obtenerAulasPorSede(v.id).subscribe({
            next: (aulas) => {
              v.classrooms = aulas.map((a: any) => ({
                id: a.id,
                name: a.nombre,
                capacity: a.capacidad,
                status: a.estado === 'disponible' ? 'Disponible' : a.estado === 'en-uso' ? 'Ocupada' : 'Mantenimiento',
              }));
              v.classroomCount = v.classrooms.length;
              v.totalCapacity = v.classrooms.reduce((sum, c) => sum + c.capacity, 0);
              this.cdr.markForCheck();
            },
          });
        });
      },
      error: (err) => {
        console.error('Error cargando sedes:', err);
        this.errorMessage = 'Error al cargar sedes';
      },
    });
  }

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
  closeModal(): void { this.activeModal = null; this.loadSedes(); }

  openNewAula(): void { this.activeModal = 'nueva-aula'; }
  openNewSede(): void { this.activeModal = 'nueva-sede'; }
}
