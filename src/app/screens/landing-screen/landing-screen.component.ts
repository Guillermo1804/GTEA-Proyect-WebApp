import { Component, OnInit, ChangeDetectorRef, inject } from '@angular/core';
import { Router } from '@angular/router';
import { TopNavbar } from '../../partials/top-navbar/top-navbar';
import { EventoService } from '../../services/evento-service';
import { environment } from '../../../environments/environment';

interface EventCard {
  image: string;
  category: string;
  categoryColor: string;
  title: string;
  date: string;
  enrolled: number;
  capacity: number;
}

interface Benefit {
  icon: string;
  title: string;
  description: string;
}

@Component({
  selector: 'app-landing-screen',
  imports: [TopNavbar],
  templateUrl: './landing-screen.component.html',
  styleUrl: './landing-screen.component.scss'
})
export class LandingScreenComponent implements OnInit {
  activeTab: 'todos' | 'proximos' | 'concluidos' = 'todos';
  events: EventCard[] = [];

  private cdr = inject(ChangeDetectorRef);

  benefits: Benefit[] = [
    {
      icon: 'app_registration',
      title: 'Registro Fácil',
      description: 'Inscríbete a tus talleres favoritos con un solo clic usando tu cuenta institucional.'
    },
    {
      icon: 'workspace_premium',
      title: 'Certificados Digitales',
      description: 'Recibe constancias con valor curricular automáticamente al finalizar el evento.'
    },
    {
      icon: 'calendar_month',
      title: 'Agenda Personalizada',
      description: 'Organiza tu tiempo y recibe recordatorios antes de cada sesión académica.'
    },
  ];

  constructor(
    private router: Router,
    private eventoService: EventoService
  ) { }

  ngOnInit(): void {
    this.cargarEventos();
  }

  private cargarEventos(): void {
    this.eventoService.getEventosPublicos().subscribe({
      next: (data) => {
        this.events = data.map(e => this.mapToEventCard(e));
        this.cdr.detectChanges();
      },
      error: () => {
        this.events = [];
      }
    });
  }

  /**
   * Backend JSON fields (GET /eventos/public/):
   *   id, titulo, categoria, categoria_nombre, descripcion, imagen_portada,
   *   fecha_inicio, hora_inicio, fecha_fin, hora_fin, modalidad, sede,
   *   sede_nombre, aula, aula_nombre, cupo_maximo, costo_entrada,
   *   lista_espera, publicar_inmediatamente, es_organizador, organizador,
   *   organizador_nombre, status, inscritos, is_full, creation, update
   */
  private mapToEventCard(e: any): EventCard {
    return {
      image: this._resolveImageUrl(e.imagen_portada),
      category: e.categoria_nombre ?? 'General',
      categoryColor: this.getCategoryColor(e.categoria_nombre ?? ''),
      title: e.titulo ?? '',
      date: e.fecha_inicio
        ? new Date(e.fecha_inicio).toLocaleDateString('es-MX', {
          day: 'numeric',
          month: 'long',
          year: 'numeric'
        })
        : 'Fecha por confirmar',
      enrolled: e.inscritos ?? 0,
      capacity: e.cupo_maximo ?? 0,
    };
  }

  private getCategoryColor(category: string): string {
    const colors: Record<string, string> = {
      'Ingeniería': '#1e40af',
      'Artes': '#7c3aed',
      'Ciencias': '#059669',
      'Ciberseguridad': '#dc2626',
      'Default': '#3b82f6'
    };
    return colors[category] || colors['Default'];
  }

  navigate(path: string): void {
    this.router.navigate([path]);
  }

  goToEvent(index: number): void {
    this.router.navigate(['/login']);
  }

  getOccupancy(event: EventCard): number {
    if (!event.capacity) return 0;
    return Math.min(100, Math.round((event.enrolled / event.capacity) * 100));
  }

  /**
   * Resuelve URLs de imagen relativas (/media/...) a absolutas.
   * Duplicado local porque _resolveImageUrl es privado en EventoService.
   */
  private _resolveImageUrl(url: string | null | undefined): string {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    return `${environment.url_api}${url}`;
  }
}
