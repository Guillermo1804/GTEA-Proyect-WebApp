import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
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
        private http: HttpClient
    ) { }

    // ─────────────────────────────────────────────
    // [POST] Inscribir alumno a un evento (toma sesión)
    // Endpoint: POST /inscripciones/
    // ─────────────────────────────────────────────
    public inscribirse(eventoId: number): Observable<RespuestaInscripcion> {
        const payload = {
            evento_id: eventoId
        };

        return this.http.post<RespuestaInscripcion>(
          `${environment.url_api}/inscripciones/`,
          payload,
          httpOptions
        );
    }

    // ─────────────────────────────────────────────
    // [POST] Cancelar inscripción / salir lista de espera
    // Endpoint: POST /inscripciones/cancel/
    // ─────────────────────────────────────────────
    public cancelarInscripcion(inscripcionId: number): Observable<any> {
        const payload = {
            inscripcion_id: inscripcionId
        };

        return this.http.post<any>(
          `${environment.url_api}/inscripciones/cancel/`,
          payload,
          httpOptions
        );
    }

    // ─────────────────────────────────────────────
    // [GET] Obtener lista de espera de un evento
    // Endpoint: GET /inscripciones/lista-espera/?evento={id}
    // ─────────────────────────────────────────────
    public getListaEspera(eventoId: number): Observable<any[]> {
        return this.http.get<any[]>(
          `${environment.url_api}/inscripciones/lista-espera/?evento=${eventoId}`,
          httpOptions
        );
    }
}
