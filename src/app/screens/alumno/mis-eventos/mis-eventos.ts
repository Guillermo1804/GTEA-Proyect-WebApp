import { Component, OnInit, inject, signal, ChangeDetectorRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { TopNavbar } from '../../../partials/top-navbar/top-navbar';
import { BottomNav } from '../../../partials/bottom-nav/bottom-nav';
import { InscripcionService } from '../../../services/inscripcion.service';
import { FacadeService } from '../../../services/facade-service';
import { ToastService } from '../../../services/tools/toast.service';
import { ConfirmarAccionModalComponent } from '../../../modals/confirmar-accion-modal/confirmar-accion-modal.component';
import { EventoDetalleComponent } from '../evento-detalle/evento-detalle.component';

interface EventoInscrito {
    id: number;
    titulo: string;
    categoria: string;
    fecha: string;
    hora: string;
    ubicacion: string;
    imagen: string;
    estado: 'proximo' | 'completado' | 'cancelado' | 'lista-espera';
    posicionLista?: number;
    tieneCertificado?: boolean;
}

type Filtro = 'todos' | 'proximo' | 'completado' | 'cancelado' | 'lista-espera';

@Component({
    selector: 'app-mis-eventos',
    imports: [CommonModule, TopNavbar, BottomNav, ConfirmarAccionModalComponent, EventoDetalleComponent],
    templateUrl: './mis-eventos.html',
    styleUrl: './mis-eventos.scss',
})
export class MisEventos implements OnInit {
    eventos = signal<EventoInscrito[]>([]);
    filtroActivo = signal<Filtro>('todos');
    totalEventos = signal<number>(0);
    userName = '';

    // ── Control del modal de desinscripción ──
    mostrarConfirmar = false;
    eventoPendiente: EventoInscrito | null = null;
    eventoSeleccionado: number | null = null;

    @HostListener('window:keydown.Escape')
    handleKeyDown() {
        if (this.eventoSeleccionado) {
            this.cerrarDetalles();
        }
    }

    private router = inject(Router);
    private inscripcionService = inject(InscripcionService);
    private facadeService = inject(FacadeService);
    private cdr = inject(ChangeDetectorRef);
    private toastService = inject(ToastService);

    ngOnInit(): void {
        const nombre = this.facadeService.getUserDisplayName() ?? 'Estudiante';
        this.userName = nombre.split(' ')[0];
        this.cargarMisEventos();
    }

    private cargarMisEventos(): void {
        this.inscripcionService.getMisEventos().subscribe({
            next: (data: any[]) => {
                const mapeados = data.map(e => this._mapInscripcion(e));
                this.eventos.set(mapeados);
                this.totalEventos.set(mapeados.filter(e => e.estado === 'completado').length);
                this.cdr.detectChanges();
            },
            error: (err) => {
                console.error('Error al cargar mis eventos:', err);
                this.eventos.set([]);
            }
        });
    }

    private _mapInscripcion(raw: any): EventoInscrito {
        return {
            id: raw.evento_id ?? raw.id,
            titulo: raw.evento_titulo ?? raw.titulo ?? '',
            categoria: raw.categoria_nombre ?? '',
            fecha: raw.fecha_inicio
                ? new Date(raw.fecha_inicio).toLocaleDateString('es-MX', {
                    day: 'numeric', month: 'short', year: 'numeric'
                  })
                : '',
            hora: raw.hora_inicio?.substring(0, 5) ?? '',
            ubicacion: raw.modalidad === 'Virtual'
                ? 'Virtual'
                : [raw.sede_nombre, raw.aula_nombre].filter(Boolean).join(', ') || 'Por confirmar',
            imagen: raw.imagen_portada ?? '',
            estado: raw.estado ?? 'proximo',
            posicionLista: raw.posicion_lista_espera ?? null,
            tieneCertificado: raw.tiene_certificado ?? false,
        };
    }

    get eventosFiltrados(): EventoInscrito[] {
        const f = this.filtroActivo();
        if (f === 'todos') return this.eventos();
        return this.eventos().filter(e => e.estado === f);
    }

    setFiltro(f: Filtro): void { this.filtroActivo.set(f); }

    verDetalle(id: number): void { this.eventoSeleccionado = id; }

    cerrarDetalles(): void { this.eventoSeleccionado = null; }

    desinscribirse(evento: EventoInscrito): void {
        this.eventoPendiente = evento;
        this.mostrarConfirmar = true;
    }

    confirmarDesinscripcion(): void {
        if (!this.eventoPendiente) return;
        const evento = this.eventoPendiente;
        this.mostrarConfirmar = false;
        this.eventoPendiente = null;

        const alumnoId = Number(this.facadeService.getUserId());
        if (!alumnoId) {
            console.error('alumnoId no disponible');
            return;
        }

        this.inscripcionService.cancelarInscripcion(evento.id, alumnoId).subscribe({
            next: () => {
                this.toastService.show('Te has desinscrito exitosamente.', 'success');
                this.eventos.set(this.eventos().filter(e => e.id !== evento.id));
                this.totalEventos.set(this.eventos().filter(e => e.estado === 'completado').length);
            },
            error: (err: any) => {
                this.toastService.show('Error al cancelar la inscripción.', 'error');
            }
        });
    }

    cancelarModal(): void {
        this.mostrarConfirmar = false;
        this.eventoPendiente = null;
    }
}
