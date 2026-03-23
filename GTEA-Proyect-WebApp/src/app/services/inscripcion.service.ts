import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { FacadeService } from './facade-service';
import { RespuestaInscripcion } from '../models/inscripcion.model';

// ─────────────────────────────────────────────
// Opciones HTTP por defecto
// ─────────────────────────────────────────────
const httpOptions = {
    headers: new HttpHeaders({ 'Content-Type': 'application/json' }),
};

@Injectable({
    providedIn: 'root',
})
export class InscripcionService {

    constructor(
        private http: HttpClient,
        private facadeService: FacadeService,
    ) { }

    // ─────────────────────────────────────────────
    // [POST] Inscribir alumno a un evento
    // Endpoint: POST /inscripcion/
    // ─────────────────────────────────────────────
    public inscribirEvento(eventoId: number, alumnoId: number): Observable<RespuestaInscripcion> {
        const payload = {
            evento_id: eventoId,
        };

        return this.http.post<RespuestaInscripcion>(
          `${environment.url_api}/inscripcion/`,
          payload,
          httpOptions
        );
    }

    // ─────────────────────────────────────────────
    // [POST] Inscribir alumno a la lista de espera
    // Endpoint: POST /inscripciones-lista-espera/
    // ─────────────────────────────────────────────
    public inscribirListaEspera(eventoId: number, alumnoId: number): Observable<RespuestaInscripcion> {
        const payload = {
            evento_id: eventoId,
            alumno_id: alumnoId,
        };

        return this.http.post<RespuestaInscripcion>(
                    `${environment.url_api}/inscripciones-lista-espera/`,
          payload,
          httpOptions
        );
    }

    // ─────────────────────────────────────────────
    // [DELETE] Cancelar inscripción / lista de espera
        // Endpoint: DELETE /inscripciones-cancel/?evento_id={id}&alumno_id={id}
    // ─────────────────────────────────────────────
    public cancelarInscripcion(eventoId: number, alumnoId: number): Observable<RespuestaInscripcion> {
        return this.http.delete<RespuestaInscripcion>(
                    `${environment.url_api}/inscripciones-cancel/?evento_id=${eventoId}&alumno_id=${alumnoId}`,
          httpOptions
        );
    }
}
