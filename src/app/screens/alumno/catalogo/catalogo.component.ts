import { Component, OnInit, inject, signal, ChangeDetectorRef } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { TopNavbar } from "../../../partials/top-navbar/top-navbar";
import { BottomNav } from "../../../partials/bottom-nav/bottom-nav";
import { EventoService, Evento } from '../../../services/evento-service';
import { ToastService } from '../../../services/tools/toast.service';

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
    estado: 'disponible' | 'inscrito' | 'lista-espera' | 'agotado' | 'en-espera';
    isFull?: boolean;
    listaEspera?: boolean;
    [key: string]: any;
}

import { catchError, finalize } from 'rxjs/operators';
import { forkJoin, of } from 'rxjs';
import { InscripcionService } from '../../../services/inscripcion.service';
import { FacadeService } from '../../../services/facade-service';
import { ConfirmarAccionModalComponent } from '../../../modals/confirmar-accion-modal/confirmar-accion-modal.component';

@Component({
    selector: 'app-catalogo',
    imports: [CommonModule, TopNavbar, BottomNav, ConfirmarAccionModalComponent],
    templateUrl: './catalogo.component.html',
    styleUrl: './catalogo.component.scss',
})
export class CatalogoComponent implements OnInit {
    talleres = signal<Taller[]>([]);

    private router = inject(Router);
    private eventoService = inject(EventoService);
    private inscripcionService = inject(InscripcionService);
    private facadeService = inject(FacadeService);
    private toastService = inject(ToastService);
    private cdr = inject(ChangeDetectorRef);

    mostrarConfirmar = false;
    tallerPendiente: Taller | null = null;
mostrarAlerta: boolean = true;


    ngOnInit() {
        this.cargarTalleres();
          const alertaCerrada = localStorage.getItem('alertaCerrada');
  this.mostrarAlerta = alertaCerrada !== 'true';
    }
    cerrarAlerta() {
  this.mostrarAlerta = false;
  localStorage.setItem('alertaCerrada', 'true');
}

    private cargarTalleres(): void {
        forkJoin({
            eventos: this.eventoService.obtenerEventos(),
            inscritos: this.inscripcionService.getMisEventos().pipe(catchError(() => of([])))
        }).subscribe({
            next: (data) => {
                const inscritosMap = new Map<number, string>(
                    data.inscritos.map((e: any) => [
                        e.evento_id || e.id,
                        e.estado ?? e.tipo ?? 'inscrito'
                    ])
                );
                this.talleres.set(data.eventos.map(e => this._mapToTaller(e, inscritosMap)));
            },
            error: (err) => {
                console.error('Error al cargar eventos:', err);
                this.talleres.set([]);
            }
        });
    }

    private _mapToTaller(evento: Evento, inscritosMap: Map<number, string>): Taller {
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
        const tipoInscripcion = inscritosMap.get(evento.id ?? 0);

        let estado: Taller['estado'] = 'disponible';
        let disponibilidad = `${totalCupos - inscritos} lugares disponibles`;

        if (tipoInscripcion === 'lista-espera' || tipoInscripcion === 'lista_espera') {
            estado = 'en-espera';
            disponibilidad = 'Estás en lista de espera';
        } else if (tipoInscripcion === 'inscrito') {
            estado = 'inscrito';
            disponibilidad = 'Ya estás inscrito';
        } else if (evento.isFull) {
            if (evento.listaEspera) {
                estado = 'lista-espera';
                disponibilidad = 'Lista de espera disponible';
            } else {
                estado = 'agotado';
                disponibilidad = 'Sin lugares disponibles';
            }
        }

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
            isFull: evento.isFull ?? false,
            listaEspera: evento.listaEspera ?? false,
            estado
        };
    }

    abrirDetalles(taller: Taller) {
        this.router.navigate(['/alumno/evento', taller.id]);
    }

    inscribirse(taller: Taller): void {
        if (taller['_procesando']) return;
        taller['_procesando'] = true;

        this.inscripcionService.inscribirse(taller.id)
            .pipe(finalize(() => taller['_procesando'] = false))
            .subscribe({
                next: (respuesta) => {
                    if (respuesta.posicionListaEspera &&
                        respuesta.posicionListaEspera > 0) {
                        taller.estado = 'en-espera';
                        taller.disponibilidad = 'Estás en lista de espera';
                        this.cdr.detectChanges();
                        this.toastService.show(
                            `Lista de espera. Posición: ${respuesta.posicionListaEspera}`,
                            'success'
                        );
                    } else {
                        taller.estado = 'inscrito';
                        taller.inscritos = (taller.inscritos ?? 0) + 1;
                        this.cdr.detectChanges();
                        this.toastService.show(
                            respuesta.mensaje || '¡Inscripción exitosa!',
                            'success'
                        );
                    }
                },
                error: (err: HttpErrorResponse) => {
                    const msg = err?.error?.mensaje ||
                                'Error al inscribirse.';
                    this.toastService.show(msg, 'error');
                }
            });
    }

    desinscribirse(taller: Taller) {
        this.tallerPendiente = taller;
        this.mostrarConfirmar = true;
    }

    confirmarDesinscripcion(): void {
        if (!this.tallerPendiente) return;
        const taller = this.tallerPendiente;
        const estadoPrevio = taller.estado;
        this.mostrarConfirmar = false;
        this.tallerPendiente = null;

        const alumnoId = Number(this.facadeService.getUserId());
        if (!alumnoId) {
            console.error('alumnoId no disponible');
            return;
        }

        this.inscripcionService
            .cancelarInscripcion(taller.id, alumnoId)
            .subscribe({
                next: () => {
                    this.talleres.update(ts => ts.map(t => {
                        if (t.id !== taller.id) return t;
                        
                        const nuevoInscritos = estadoPrevio === 'en-espera'
                            ? t.inscritos
                            : Math.max(0, (t.inscritos ?? 0) - 1);

                        return {
                            ...t,
                            estado: (t.isFull ?? false)
                                ? (t.listaEspera
                                    ? 'lista-espera' as const
                                    : 'agotado' as const)
                                : 'disponible' as const,
                            inscritos: nuevoInscritos,
                            disponibilidad: (t.isFull ?? false)
                                ? (t.listaEspera
                                    ? 'Lista de espera disponible'
                                    : 'Sin lugares disponibles')
                                : `${(t.totalCupos ?? 0) - nuevoInscritos} lugares disponibles`
                        };
                    }));
                    this.toastService.show(
                        'Te has desinscrito del evento.',
                        'success'
                    );
                },
                error: (err) => console.error('Error desinscripción:', err)
            });
    }

    cancelarModal() {
        this.mostrarConfirmar = false;
        this.tallerPendiente = null;
    }

    cancelarEspera(taller: Taller): void {
        this.inscribirse(taller);
    }
}
