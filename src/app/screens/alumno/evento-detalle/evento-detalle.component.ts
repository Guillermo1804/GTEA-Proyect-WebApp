import { Component, OnInit, signal, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { timeout, catchError, finalize } from 'rxjs/operators';
import { throwError, TimeoutError } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';

import { InscripcionService } from '../../../services/inscripcion.service';
import { EventoService, Evento } from '../../../services/evento-service';
import { ToastService } from '../../../services/tools/toast.service';
import { BottomNav } from '../../../partials/bottom-nav/bottom-nav';

@Component({
    selector: 'app-evento-detalle',
    imports: [CommonModule, BottomNav],
    templateUrl: './evento-detalle.component.html',
    styleUrl: './evento-detalle.component.scss',
})
export class EventoDetalleComponent implements OnInit {
    private route = inject(ActivatedRoute);
    private router = inject(Router);
    private inscripcionService = inject(InscripcionService);
    private eventoService = inject(EventoService);
    private toastService = inject(ToastService);
    private cdr = inject(ChangeDetectorRef); 
    // ── Signals de estado ──
    isProcessing = signal(false);
    cupoLleno = signal(false);
 
    // ── Datos del evento ──
    evento: Evento | null = null;
    categoriaNombre = '';
    sedeNombre = '';
    aulaNombre = '';
    lugaresDisponibles = 0;

    ngOnInit(): void {
        const id = Number(this.route.snapshot.paramMap.get('id'));
        if (!id) {
            this.router.navigate(['/alumno']);
            return;
        }

        this.eventoService.getEventoByID(id).subscribe({
            next: (evento) => {
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
                    this.isProcessing.set(false);
                    this.toastService.show('¡Inscripción exitosa!', 'success');
                    if (respuesta.success) {
                        if (respuesta.posicionListaEspera) {
                            this.toastService.show(
                                `Te has unido a la lista de espera. Posición: ${respuesta.posicionListaEspera}`,
                                'success'
                            );
                        } else {
                            this.toastService.show(
                                respuesta.mensaje || '¡Inscripción exitosa!',
                                'success'
                            );
                        }
                    }
                },
            });
    }

    goBack(): void {
        this.router.navigate(['/alumno']);
    }
}
