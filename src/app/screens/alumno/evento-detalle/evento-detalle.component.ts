import { Component, OnInit, signal, inject, ChangeDetectorRef, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { timeout, catchError, finalize } from 'rxjs/operators';
import { throwError, TimeoutError, forkJoin, of } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';

import { InscripcionService } from '../../../services/inscripcion.service';
import { EventoService, Evento } from '../../../services/evento-service';
import { FacadeService } from '../../../services/facade-service';
import { ToastService } from '../../../services/tools/toast.service';
import { BottomNav } from '../../../partials/bottom-nav/bottom-nav';
import { ConfirmarAccionModalComponent } from '../../../modals/confirmar-accion-modal/confirmar-accion-modal.component';

@Component({
    selector: 'app-evento-detalle',
    imports: [CommonModule, BottomNav, ConfirmarAccionModalComponent],
    templateUrl: './evento-detalle.component.html',
    styleUrl: './evento-detalle.component.scss',
})
export class EventoDetalleComponent implements OnInit {
    @Input() eventoId?: number;
    @Output() close = new EventEmitter<void>();

    private route = inject(ActivatedRoute);
    private router = inject(Router);
    private inscripcionService = inject(InscripcionService);
    private eventoService = inject(EventoService);
    private facadeService = inject(FacadeService);
    private toastService = inject(ToastService);
    private cdr = inject(ChangeDetectorRef); 
    // ── Signals de estado ──
    isProcessing = signal(false);
    cupoLleno = signal(false);
    estaInscrito = signal(false);
    inscripcionId = signal<number | null>(null);
    mostrarConfirmar = false;
 
    // ── Datos del evento ──
    evento: Evento | null = null;
    categoriaNombre = '';
    sedeNombre = '';
    aulaNombre = '';
    lugaresDisponibles = 0;

    ngOnInit(): void {
        const id = this.eventoId || Number(this.route.snapshot.paramMap.get('id'));
        if (!id) {
            this.router.navigate(['/alumno']);
            return;
        }

        this.cargarEvento(id);
    }

    private cargarEvento(id: number): void {
        forkJoin({
            evento: this.eventoService.getEventoByID(id),
            misEventos: this.inscripcionService.getMisEventos().pipe(catchError(() => of([])))
        }).subscribe({
            next: (data) => {
                const evento = data.evento;
                if (!evento) {
                    this.toastService.show('Evento no encontrado.', 'error');
                    this.router.navigate(['/alumno']);
                    return;
                }

                this.evento = evento;
                this.categoriaNombre = evento.categoriaNombre ?? 'Sin categoría';
                this.sedeNombre      = evento.sedeNombre      ?? '';
                this.aulaNombre      = evento.aulaNombre      ?? '';
                this.lugaresDisponibles = (evento.cupoMaximo ?? 0) - (evento.inscritos ?? 0);

                if (evento.isFull) {
                    this.cupoLleno.set(true);
                }

                // Check if already enrolled
                const hit = data.misEventos.find((e: any) => (e.evento_id || e.id) === id);
                if (hit) {
                    this.estaInscrito.set(true);
                    // The API returns the id (which is inscripcion_id when it's /mis-eventos/)
                    this.inscripcionId.set(hit.id);
                }

                this.cdr.detectChanges();  // ← fuerza re-render
            },
            error: () => {
                this.toastService.show('Error al cargar el evento.', 'error');
                this.router.navigate(['/alumno']);
            },
        });

    }

    /**
     * Método principal de inscripción con lógica defensiva RxJS.
     *
     * Flujo:
     * 1. Guard anti-doble-click (isProcessing)
     * 2. Pipe con timeout(5000) + catchError (status matrix)
     * 3. finalize SIEMPRE libera el lock isProcessing
     */
    inscribirEvento(): void {
        // Guard: prevenir doble-click
        if (this.isProcessing()) return;

        this.isProcessing.set(true);

        const eventoId = this.evento?.id ?? 0;

        // Mandar petición directa, el backend decide si asigna lugar o lista de espera
        const serviceCall = this.inscripcionService.inscribirse(eventoId);

        serviceCall
            .pipe(
                timeout(5000),
                catchError((error: HttpErrorResponse | TimeoutError) => {
                    // ── TimeoutError ──
                    if (error instanceof TimeoutError) {
                        this.toastService.show(
                            'Tiempo de espera agotado. Intenta de nuevo.',
                            'error'
                        );
                        return throwError(() => error);
                    }

                    const httpError = error as HttpErrorResponse;
                    const status = httpError.status;

                    switch (true) {
                        // ── Fallo de red ──
                        case status === 0:
                            this.toastService.show(
                                'Fallo de red. Revisa tu conexión.',
                                'error'
                            );
                            break;

                        // ── Sesión expirada ──
                        case status === 401:
                            this.toastService.show('Sesión expirada', 'error');
                            this.router.navigate(['/login']);
                            break;

                        case status === 409:
                            this.cupoLleno.set(true);
                            this.toastService.show(
                                'Cupo lleno. Fuiste añadido a la lista de espera.',
                                'warning'
                            );
                            break;

                        // ── Error interno del servidor ──
                        case status >= 500:
                            this.toastService.show(
                                'Error interno del servidor.',
                                'error'
                            );
                            break;

                        // ── Cualquier otro error ──
                        default:
                            this.toastService.show(
                                httpError.error?.mensaje || 'Error inesperado.',
                                'error'
                            );
                            break;
                    }

                    return throwError(() => httpError);
                }),
                finalize(() => {
                    // SIEMPRE liberar el lock, éxito o error
                    this.isProcessing.set(false);
                }),
            )
            .subscribe({
                next: (respuesta) => {
                    if (respuesta.posicionListaEspera &&
                        respuesta.posicionListaEspera > 0) {
                        this.toastService.show(
                            `Lista de espera. Posición: ${respuesta.posicionListaEspera}`,
                            'success'
                        );
                    } else {
                        this.estaInscrito.set(true);
                        this.toastService.show(
                            respuesta.mensaje || 'Inscripción exitosa',
                            'success'
                        );
                        setTimeout(() => this.goBack(), 1500);
                    }
                },
            });
    }

    desinscribirEvento(): void {
        this.mostrarConfirmar = true;
    }

    confirmarDesinscripcion(): void {
        this.mostrarConfirmar = false;

        const alumnoId = Number(this.facadeService.getUserId());
        const eventoId = Number(this.route.snapshot.paramMap.get('id'))
                         || this.evento?.id;

        if (!alumnoId || !eventoId) {
            console.error('Faltan IDs:', { alumnoId, eventoId });
            return;
        }

        if (this.isProcessing()) return;
        this.isProcessing.set(true);

        this.inscripcionService
            .cancelarInscripcion(eventoId, alumnoId)
            .subscribe({
                next: () => {
                    this.isProcessing.set(false);
                    this.estaInscrito.set(false);
                    this.inscripcionId.set(null);
                    this.toastService.show('Te has desinscrito del evento.', 'success');
                },
                error: (err) => {
                    this.isProcessing.set(false);
                    console.error('Error desinscripción:', err);
                    this.toastService.show('Error al intentar desinscribirse.', 'error');
                }
            });
    }

    cancelarModal(): void {
        this.mostrarConfirmar = false;
    }

    goBack(): void {
        if (this.eventoId) {
            this.close.emit();
        } else {
            this.router.navigate(['/alumno']);
        }
    }

    public compartirEvento(): void {
        if (typeof navigator === 'undefined') return;

        const urlToShare = `https://gtea.ezarr.rocks/alumno/evento/${this.eventoId}`;
        const titleToShare = this.evento?.titulo || 'Evento en GTEA';

        if (navigator.share) {
            navigator.share({
                title: titleToShare,
                url: urlToShare
            }).catch((error) => console.error('Error compartiendo:', error));
        } else if (navigator.clipboard) {
            navigator.clipboard.writeText(urlToShare)
                .then(() => this.toastService.show('Enlace copiado', 'success'))
                .catch(() => this.toastService.show('Error al copiar el enlace', 'error'));
        }
    }
}
