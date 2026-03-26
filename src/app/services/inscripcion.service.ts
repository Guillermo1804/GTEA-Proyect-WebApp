import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { RespuestaInscripcion } from '../models/inscripcion.model';
import { FacadeService } from './facade-service';

@Injectable({
    providedIn: 'root',
})
export class InscripcionService {

    constructor(
        private http: HttpClient,
        private facadeService: FacadeService
    ) { }

    // ─────────────────────────────────────────────
    // [POST] Inscribir alumno a un evento (toma sesión)
    // Endpoint: POST /inscripciones/
    // ─────────────────────────────────────────────
    public inscribirse(eventoId: number): Observable<RespuestaInscripcion> {
        const payload = {
            evento_id: eventoId
        };
        const token = this.facadeService.getSessionToken();
        const headers = new HttpHeaders({
            'Content-Type': 'application/json',
            'Authorization': 'Token ' + token,
        });

        return this.http.post<RespuestaInscripcion>(
          `${environment.url_api}/inscripciones/`,
          payload,
          { headers }
        );
    }

    // ─────────────────────────────────────────────
    // [DELETE] Cancelar inscripción / salir lista de espera
    // Endpoint: DELETE /inscripciones/cancel/?evento_id=X&alumno_id=Y
    // ─────────────────────────────────────────────
    public cancelarInscripcion(
        eventoId: number,
        alumnoId: number
    ): Observable<any> {
        const token = this.facadeService.getSessionToken();
        const headers = new HttpHeaders({
            'Content-Type': 'application/json',
            'Authorization': 'Token ' + token,
        });
        return this.http.delete<any>(
          `${environment.url_api}/inscripciones/cancel/`,
          {
            params: {
              evento_id: eventoId.toString(),
              alumno_id: alumnoId.toString()
            },
            headers,
          }
        );
    }

    // ─────────────────────────────────────────────
    // [GET] Obtener lista de espera de un evento
    // Endpoint: GET /inscripciones/lista-espera/?evento={id}
    // ─────────────────────────────────────────────
    public getListaEspera(eventoId: number): Observable<any[]> {
        const token = this.facadeService.getSessionToken();
        const headers = new HttpHeaders({
            'Content-Type': 'application/json',
            'Authorization': 'Token ' + token,
        });
        return this.http.get<any[]>(
          `${environment.url_api}/inscripciones/lista-espera/?evento=${eventoId}`,
          { headers }
        );
    }

// inscripcion.service.ts esta es la nueva que necesitamos que funcione
    public getMisEventos(): Observable<any[]> {
    const token = this.facadeService.getSessionToken();
    const headers = new HttpHeaders({
        'Content-Type': 'application/json',
        'Authorization': 'Token ' + token,
    });
    // Endpoint que devuelve inscripciones del alumno autenticado
    return this.http.get<any[]>(`${environment.url_api}/inscripciones/mis-eventos/`, { headers });
}


}
