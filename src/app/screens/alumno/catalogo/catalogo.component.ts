import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { TopNavbar } from "../../../partials/top-navbar/top-navbar";
import { BottomNav } from "../../../partials/bottom-nav/bottom-nav";
import { EventoService, Evento } from '../../../services/evento-service';

interface Taller {
    id: number;
    titulo: string;
    descripcion: string;
    categoria: string;
    fecha: string;
    hora: string;
    ubicacion: string;
    imagen: string;
    inscritos: number;
    totalCupos: number;
    disponibilidad: string;
    estado: 'disponible' | 'inscrito' | 'lista-espera' | 'agotado';
}

@Component({
    selector: 'app-catalogo',
    imports: [CommonModule, TopNavbar, BottomNav],
    templateUrl: './catalogo.component.html',
    styleUrl: './catalogo.component.scss',
})
export class CatalogoComponent implements OnInit {
    talleres = signal<Taller[]>([]);

    private router = inject(Router);
    private eventoService = inject(EventoService);

    ngOnInit() {
        this.cargarTalleres();
    }

    private cargarTalleres(): void {
        this.eventoService.obtenerEventos().subscribe({
            next: (eventos: Evento[]) => {
                this.talleres.set(eventos.map(e => this._mapToTaller(e)));
            },
            error: (err) => {
                console.error('Error al cargar eventos:', err);
                this.talleres.set([]);
            }
        });
    }

    private _mapToTaller(evento: Evento): Taller {
        const fecha = evento.fechaInicio
            ? new Date(evento.fechaInicio).toLocaleDateString('es-MX', {
                weekday: 'short', day: 'numeric', month: 'short'
              })
            : 'Fecha por confirmar';

        const hora = evento.horaInicio
            ? evento.horaInicio.substring(0, 5)
            : 'Hora por confirmar';

        const ubicacion = evento.modalidad === 'Virtual'
            ? 'Virtual'
            : [evento.sedeNombre, evento.aulaNombre]
                .filter(Boolean)
                .join(', ') || 'Por confirmar';

        const inscritos = evento.inscritos ?? 0;
        const totalCupos = evento.cupoMaximo ?? 0;

        const estado: Taller['estado'] = evento.isFull
            ? 'lista-espera'
            : 'disponible';

        const disponibilidad = evento.isFull
            ? 'Lista de espera'
            : `${totalCupos - inscritos} lugares disponibles`;

        return {
            id: evento.id ?? 0,
            titulo: evento.titulo ?? '',
            descripcion: evento.descripcion ?? '',
            categoria: evento.categoriaNombre ?? 'Sin categoría',
            fecha,
            hora,
            ubicacion,
            imagen: typeof evento.imagenPortada === 'string'
                ? evento.imagenPortada
                : '',
            inscritos,
            totalCupos,
            disponibilidad,
            estado
        };
    }

    abrirDetalles(taller: Taller) {
        this.router.navigate(['/alumno/evento', taller.id]);
    }

    inscribirse(taller: Taller) {
        // Navegar al detalle — el botón "Inscribirme" vive en evento-detalle
        this.router.navigate(['/alumno/evento', taller.id]);
    }

    cancelarEspera(taller: Taller) {
        // TODO: conectar con servicio de cancelación
    }
}
