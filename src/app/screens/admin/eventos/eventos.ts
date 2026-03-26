import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { TopNavbar } from '../../../partials/top-navbar/top-navbar';
import { BottomNav } from '../../../partials/bottom-nav/bottom-nav';
import { NuevaAulaModal } from '../../../shared/modals/nueva-aula-modal/nueva-aula-modal';
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

  // ── Modo edición del wizard ──
  editingEventId: number | null = null;
  editingEventData: Evento | null = null;

  // ── Búsqueda y filtros ──
  searchQuery = '';
  activeFilter = 'Todos';
  filters = ['Todos', 'Activo', 'Borrador', 'Finalizado', 'Cancelado'];

  // ── Lista de eventos (cargada desde el servicio) ──
  events: EventItem[] = [];

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private eventoService: EventoService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    // Cargar eventos desde el servicio (ahora retorna mocks centralizados)
    this.loadEvents();
    
    // Verificar si hay query param para abrir el modal de nuevo evento o editar
    this.route.queryParams.subscribe(params => {
      if (params['new'] === 'true') {
        // Limpiar el query param de la URL
        this.router.navigate([], { 
          relativeTo: this.route, 
          queryParams: {}, 
          replaceUrl: true 
        });
        // Abrir el modal de nuevo evento
        this.editingEventId = null;
        this.editingEventData = null;
        this.activeModal = 'nuevo-evento';
      } else if (params['edit']) {
        // Modo edición desde la vista de detalle
        const editId = Number(params['edit']);
        // Limpiar el query param de la URL
        this.router.navigate([], { 
          relativeTo: this.route, 
          queryParams: {}, 
          replaceUrl: true 
        });
        // Cargar evento y abrir wizard en modo edición
        this.eventoService.getEventoByID(editId).subscribe({
          next: (data: Evento | null) => {
            if (data) {
              this.editingEventId = editId;
              this.editingEventData = data;
              this.activeModal = 'nuevo-evento';
            } else {
              this.errorMessage = 'No se pudo cargar el evento para editar.';
              setTimeout(() => (this.errorMessage = ''), 4000);
            }
          },
          error: (err) => {
            console.error('Error cargando evento:', err);
            this.errorMessage = 'Error al cargar el evento.';
            setTimeout(() => (this.errorMessage = ''), 4000);
          },
        });
      }
    });
  }

  // ── Carga desde API (usa mocks centralizados hasta que llegue el backend) ──
  loadEvents(): void {
    this.isLoading = true;
    this.eventoService.obtenerEventos().subscribe({
      next: (data: Evento[]) => {
        // Mapear Evento[] a EventItem[] para la vista
        this.events = data.map(e => ({
          id: e.id ?? 0,
          title: e.titulo,
          category: e.categoriaNombre || `Categoría #${e.categoriaId}`,
          categoryColor: this._getCategoryColor(e.categoriaId),
          date: this._formatDate(e.fechaInicio),
          time: `${e.horaInicio} - ${e.horaFin}`,
          location: e.modalidad === 'Virtual' ? 'Virtual' : (e.aulaNombre || '—'),
          organizer: e.organizadorNombre || 'Organizador',
          capacity: e.cupoMaximo ?? 0,
          enrolled: e.inscritos ?? 0,
          status: e.status || 'Borrador',
        }));
        this.isLoading = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Error cargando eventos:', err);
        this.errorMessage = 'Error al cargar eventos.';
        this.isLoading = false;
      },
    });
  }

  private _getCategoryColor(categoriaId: string | number): string {
    const colors: { [key: number]: string } = {
      1: '#1e3fae', // Talleres
      2: '#7c3aed', // Conferencias
      3: '#f97316', // Seminarios
      4: '#059669', // Deportes
      5: '#e11d48', // Culturales
    };
    return colors[Number(categoriaId)] || '#6b7280';
  }

  private _formatDate(fecha: string): string {
    if (!fecha) return '—';
    const date = new Date(fecha);
    if (isNaN(date.getTime())) return fecha;
    return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
  }

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
    if (!event.capacity || event.capacity === 0) return 0;
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
    this.router.navigate(['/admin/eventos', event.id]);
  }

  editEvent(event: EventItem): void {
    // Cargar datos completos del evento desde el servicio
    // Esto asegura que descripcion, sedeId y aulaId estén disponibles
    this.eventoService.getEventoByID(event.id).subscribe({
      next: (data: Evento | null) => {
        if (data) {
          this.editingEventId   = event.id;
          this.editingEventData = data;
          this.activeModal      = 'nuevo-evento';
        } else {
          // Fallback si el servicio retorna null (modo mock sin datos)
          const eventoData: Evento = {
            id:                    event.id,
            titulo:                event.title,
            categoriaId:           event.category,
            descripcion:           'Descripción del evento (cargar desde backend)',
            imagenPortada:         null,
            fechaInicio:           event.date,
            horaInicio:            event.time.split(' - ')[0] ?? '',
            fechaFin:              event.date,
            horaFin:               event.time.split(' - ')[1] ?? '',
            modalidad:             event.location === 'Virtual' ? 'Virtual' : 'Presencial',
            sedeId:                1, // Mock: usar ID 1 por defecto
            aulaId:                101, // Mock: usar ID 101 por defecto
            cupoMaximo:            event.capacity,
            costoEntrada:          0,
            listaEspera:           false,
            status:                event.status,
            publicarInmediatamente: event.status === 'Activo',
            esOrganizador:         true,
          };
          this.editingEventId   = event.id;
          this.editingEventData = eventoData;
          this.activeModal      = 'nuevo-evento';
        }
      },
      error: (err) => {
        console.error('Error cargando evento para editar:', err);
        this.errorMessage = 'No se pudo cargar el evento para editar.';
        setTimeout(() => (this.errorMessage = ''), 4000);
      },
    });
  }

  deleteEvent(event: EventItem): void {
    if (!confirm(`¿Eliminar el evento "${event.title}"?`)) return;

    this.errorMessage = '';
    this.successMessage = '';

    this.eventoService.eliminarEvento(event.id).subscribe({
      next: () => {
        this.successMessage = `Evento "${event.title}" eliminado correctamente.`;
        this.events = this.events.filter((e) => e.id !== event.id);
        setTimeout(() => (this.successMessage = ''), 3000);
      },
      error: (err: any) => {
        console.error('Error eliminando evento:', err);
        // Expand timeout to 8 seconds so the user can read if it fails
        this.errorMessage = err?.error?.message || 'Error al eliminar el evento. Verifica tu conexión o intenta más tarde.';
        setTimeout(() => (this.errorMessage = ''), 8000);
      },
    });
  }

  // ── Callback: evento creado o actualizado desde el wizard ──
  onEventoCreado(evento: Evento): void {
    if (this.editingEventId !== null) {
      this.successMessage = `Evento "${evento.titulo}" actualizado exitosamente.`;
    } else {
      this.successMessage = `Evento "${evento.titulo}" creado exitosamente.`;
    }
    // Recargar la lista completa para garantizar datos frescos del backend
    // (incluyendo categoria_nombre, inscritos, status, etc.)
    this.loadEvents();
    setTimeout(() => (this.successMessage = ''), 4000);
  }

  // ── FAB y modales ──
  onFabAction(action: string): void {
    if (action !== 'nuevo-evento') {
      // Asegurarse de limpiar el modo edición si se abre otro modal
      this.editingEventId   = null;
      this.editingEventData = null;
    }
    this.activeModal = action as any;
  }

  closeModal(): void {
    this.activeModal      = null;
    this.editingEventId   = null;
    this.editingEventData = null;
  }
}
