import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { TopNavbar } from '../../../partials/top-navbar/top-navbar';
import { BottomNav } from '../../../partials/bottom-nav/bottom-nav';
import { NuevaAulaModal } from '../sedes/nueva-aula-modal/nueva-aula-modal';
import { NuevaSedeModal } from '../../../shared/modals/nueva-sede-modal/nueva-sede-modal';
import { NuevaCategoriaModal } from '../../../shared/modals/nueva-categoria-modal/nueva-categoria-modal';
import { NuevoUsuarioModal } from '../../../shared/modals/nuevo-usuario-modal/nuevo-usuario-modal';
import { NuevoEventoWizard } from './nuevo-evento-wizard/nuevo-evento-wizard';
import { EventoService, Evento } from '../../../services/evento-service';

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
  standalone: true,
  imports: [
    FormsModule,
    CommonModule,
    TopNavbar,
    BottomNav,
    NuevaAulaModal,
    NuevaSedeModal,
    NuevaCategoriaModal,
    NuevoUsuarioModal,
    NuevoEventoWizard,
  ],
  templateUrl: './eventos.html',
  styleUrl: './eventos.scss',
})
export class Eventos implements OnInit {
  errorMessage: string = '';
  successMessage: string = '';
  isLoading = false;

  // ── Estado de modales ──
  activeModal: 'nueva-aula' | 'nueva-sede' | 'nueva-categoria' | 'nuevo-usuario' | 'nuevo-evento' | null = null;

  // ── Búsqueda y filtros ──
  searchQuery = '';
  activeFilter = 'Todos';
  filters = ['Todos', 'Activo', 'Borrador', 'Finalizado', 'Cancelado'];

  // ── Lista de eventos (mock hasta que el backend esté listo) ──
  events: EventItem[] = [
    {
      id: 1, title: 'Taller de Python Avanzado', category: 'Talleres', categoryColor: '#1e3fae',
      date: '12 Mar 2026', time: '09:00 - 12:00', location: 'Lab. Sistemas #3',
      organizer: 'Dr. Carlos Mendoza', capacity: 40, enrolled: 38, status: 'Activo',
    },
    {
      id: 2, title: 'Conferencia Inteligencia Artificial', category: 'Conferencias', categoryColor: '#7c3aed',
      date: '15 Mar 2026', time: '16:00 - 18:00', location: 'Auditorio Principal',
      organizer: 'Dra. Ana García', capacity: 200, enrolled: 195, status: 'Activo',
    },
    {
      id: 3, title: 'Torneo de Ajedrez Interuniversitario', category: 'Deportes', categoryColor: '#059669',
      date: '20 Mar 2026', time: '10:00 - 17:00', location: 'Sala de Usos Múltiples',
      organizer: 'Prof. Roberto Sánchez', capacity: 50, enrolled: 50, status: 'Activo',
    },
    {
      id: 4, title: 'Seminario de Metodología de Investigación', category: 'Seminarios', categoryColor: '#f97316',
      date: '25 Mar 2026', time: '14:00 - 16:00', location: 'Aula Magna',
      organizer: 'Dra. María Rodríguez', capacity: 80, enrolled: 45, status: 'Borrador',
    },
    {
      id: 5, title: 'Hackathon GTEA 2026', category: 'Talleres', categoryColor: '#1e3fae',
      date: '01 Abr 2026', time: '08:00 - 20:00', location: 'Lab. Sistemas #1 y #2',
      organizer: 'Ing. Pedro Ramírez', capacity: 60, enrolled: 55, status: 'Activo',
    },
    {
      id: 6, title: 'Exposición de Arte Digital', category: 'Culturales', categoryColor: '#e11d48',
      date: '05 Feb 2026', time: '11:00 - 19:00', location: 'Galería Central',
      organizer: 'Lic. Laura Gómez', capacity: 100, enrolled: 100, status: 'Finalizado',
    },
  ];

  constructor(
    private router: Router,
    private eventoService: EventoService,
  ) {}

  ngOnInit(): void {
    // TODO: Cuando el backend esté listo, descomentar y reemplazar los datos mock:
    // this.loadEvents();
  }

  // ── Carga desde API (preparado, actualmente comentado) ──
  // loadEvents(): void {
  //   this.isLoading = true;
  //   this.eventoService.obtenerEventos().subscribe({
  //     next: (data) => {
  //       this.events = data;
  //       this.isLoading = false;
  //     },
  //     error: (err) => {
  //       console.error('Error cargando eventos:', err);
  //       this.errorMessage = 'Error al cargar eventos.';
  //       this.isLoading = false;
  //     },
  //   });
  // }

  // ── Filtrado reactivo ──
  get filteredEvents(): EventItem[] {
    let filtered = this.events;
    if (this.activeFilter !== 'Todos') {
      filtered = filtered.filter((e) => e.status === this.activeFilter);
    }
    if (this.searchQuery) {
      const q = this.searchQuery.toLowerCase();
      filtered = filtered.filter(
        (e) =>
          e.title.toLowerCase().includes(q) ||
          e.organizer.toLowerCase().includes(q) ||
          e.category.toLowerCase().includes(q),
      );
    }
    return filtered;
  }

  // ── Contadores rápidos ──
  get activeCount(): number { return this.events.filter((e) => e.status === 'Activo').length; }
  get draftCount(): number { return this.events.filter((e) => e.status === 'Borrador').length; }
  get finishedCount(): number { return this.events.filter((e) => e.status === 'Finalizado').length; }

  // ── Filtros ──
  setFilter(filter: string): void { this.activeFilter = filter; }

  // ── Cálculos de ocupación ──
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
      case 'Activo':     return 'status-active';
      case 'Borrador':   return 'status-draft';
      case 'Finalizado': return 'status-finished';
      case 'Cancelado':  return 'status-cancelled';
      default:           return '';
    }
  }

  // ── Acciones sobre eventos ──
  viewEvent(event: EventItem): void {
    // TODO: navegar a detalle del evento o abrir drawer
    console.log('Ver evento:', event);
  }

  editEvent(event: EventItem): void {
    // TODO: abrir wizard en modo edición con los datos del evento
    // this.eventoService.getEventoByID(event.id).subscribe({
    //   next: (data) => { this.activeModal = 'nuevo-evento'; ... }
    // });
    console.log('Editar evento:', event);
  }

  deleteEvent(event: EventItem): void {
    if (!confirm(`¿Eliminar el evento "${event.title}"?`)) return;

    this.eventoService.eliminarEvento(event.id).subscribe({
      next: () => {
        this.successMessage = `Evento "${event.title}" eliminado correctamente.`;
        this.events = this.events.filter((e) => e.id !== event.id);
        setTimeout(() => (this.successMessage = ''), 3000);
      },
      error: (err: any) => {
        console.error('Error eliminando evento:', err);
        this.errorMessage = err?.error?.message || 'Error al eliminar el evento.';
        setTimeout(() => (this.errorMessage = ''), 4000);
      },
    });
  }

  // ── Callback: evento creado desde el wizard ──
  onEventoCreado(evento: Evento): void {
    // Cuando el backend esté listo, el id vendrá del response real
    const nuevo: EventItem = {
      id: Date.now(),
      title: evento.titulo,
      category: String(evento.categoriaId),
      categoryColor: '#1e3fae',
      date: evento.fechaInicio,
      time: `${evento.horaInicio} - ${evento.horaFin}`,
      location: String(evento.aulaId || 'Virtual'),
      organizer: 'Tú',
      capacity: evento.cupoMaximo,
      enrolled: 0,
      status: evento.publicarInmediatamente ? 'Activo' : 'Borrador',
    };
    this.events.unshift(nuevo);
    this.successMessage = `Evento "${evento.titulo}" creado exitosamente.`;
    setTimeout(() => (this.successMessage = ''), 4000);
  }

  // ── FAB y modales ──
  onFabAction(action: string): void {
    this.activeModal = action as any;
  }

  closeModal(): void {
    this.activeModal = null;
  }
}
