import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { EventoService, Evento } from '../../../../services/evento-service';

interface EventoDetalle {
  id: number;
  titulo: string;
  categoria: string;
  categoriaColor: string;
  imagenPortada: string;
  fechaInicio: string;
  horaInicio: string;
  horaFin: string;
  sede: string;
  aula: string;
  modalidad: 'Presencial' | 'Virtual';
  organizadorNombre: string;
  organizadorAvatar: string;
  descripcion: string;
  cupoMaximo: number;
  inscritos: number;
  costoEntrada: number;
  status: 'Activo' | 'Borrador' | 'Finalizado' | 'Cancelado';
  listaEspera: boolean;
}

@Component({
  selector: 'app-evento-detail',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './evento-detail.html',
  styleUrl: './evento-detail.scss',
})
export class EventoDetail implements OnInit {
  evento: EventoDetalle | null = null;
  isLoading = true;
  errorMessage = '';

  // Estado de imagen hero
  imagenError = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private eventoService: EventoService,
  ) { }

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this._loadEvento(id);
  }

  private _loadEvento(id: number): void {
    this.isLoading = true;
    this.errorMessage = '';

    // Usar el servicio para cargar el evento
    this.eventoService.getEventoByID(id).subscribe({
      next: (data: Evento | null) => {
        if (data) {
          // Mapear los datos del servicio a la interfaz EventoDetalle
          this.evento = {
            id: data.id ?? id,
            titulo: data.titulo,
            categoria: this.eventoService.getCategoriaNombre(data.categoriaId),
            categoriaColor: '#1e3fae', // Color por defecto
            imagenPortada: typeof data.imagenPortada === 'string' ? data.imagenPortada : '',
            fechaInicio: this._formatFecha(data.fechaInicio),
            horaInicio: this._formatHora(data.horaInicio),
            horaFin: this._formatHora(data.horaFin),
            sede: this.eventoService.getSedeNombre(data.sedeId),
            aula: this.eventoService.getAulaNombre(data.aulaId, data.sedeId),
            modalidad: data.modalidad,
            organizadorNombre: 'Organizador', // TODO: obtener del backend
            organizadorAvatar: '',
            descripcion: data.descripcion,
            cupoMaximo: data.cupoMaximo,
            inscritos: 0, // TODO: obtener del backend
            costoEntrada: data.costoEntrada,
            status: data.publicarInmediatamente ? 'Activo' : 'Borrador',
            listaEspera: data.listaEspera,
          };
        } else {
          this.errorMessage = 'Evento no encontrado.';
        }
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error cargando evento:', err);
        this.errorMessage = 'No se pudo cargar el evento.';
        this.isLoading = false;
      },
    });
  }

  // Helpers para formatear fechas y horas
  private _formatFecha(fecha: string): string {
    if (!fecha) return '—';
    // Si viene en formato YYYY-MM-DD, convertir a formato legible
    const date = new Date(fecha);
    if (isNaN(date.getTime())) return fecha;
    return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
  }

  private _formatHora(hora: string): string {
    if (!hora) return '—';
    // Convertir formato 24h a 12h si es necesario
    const [h, m] = hora.split(':');
    const hour = parseInt(h, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${m} ${ampm}`;
  }

  // ── Helpers ──
  get ocupacionPct(): number {
    if (!this.evento) return 0;
    return Math.round((this.evento.inscritos / this.evento.cupoMaximo) * 100);
  }

  get ocupacionColor(): string {
    if (this.ocupacionPct >= 90) return '#dc2626';
    if (this.ocupacionPct >= 70) return '#ea580c';
    return '#059669';
  }

  get inicialeOrganizador(): string {
    return this.evento?.organizadorNombre
      ?.split(' ')
      .map((p) => p[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) ?? '??';
  }

  get esCosto(): boolean {
    return (this.evento?.costoEntrada ?? 0) > 0;
  }

  // ── Navegación ──
  goBack(): void {
    this.router.navigate(['/admin/eventos']);
  }

  editarEvento(): void {
    // Emite hacia el padre o navega al wizard en modo edición
    // TODO: implementar apertura del wizard con datos prellenados
    // TODO: navegar al formulario de edición
    this.router.navigate(['/admin/eventos'], {
      queryParams: { edit: this.evento?.id },
    });
  }

  eliminarEvento(): void {
    if (!this.evento) return;
    if (!confirm(`¿Eliminar el evento "${this.evento.titulo}"?`)) return;

    this.eventoService.eliminarEvento(this.evento.id).subscribe({
      next: () => this.router.navigate(['/admin/eventos']),
      error: (err: any) => {
        this.errorMessage = err?.error?.message || 'Error al eliminar el evento.';
      },
    });
  }

  verPerfil(): void {
    // TODO: navegar al perfil del organizador
    // TODO: navegar al perfil del organizador
  }

  onImageError(): void {
    this.imagenError = true;
  }
}
