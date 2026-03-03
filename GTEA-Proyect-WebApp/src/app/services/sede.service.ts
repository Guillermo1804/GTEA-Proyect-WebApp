import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { FacadeService } from './facade-service';

// ── Interfaces ──────────────────────────────────────────────
export interface Sede {
    id: number;
    nombre: string;
    domicilio: string;
    telefono: string;
    email: string;
    pisos: number;
    notas: string;
    instalaciones: string[];
}

export interface Aula {
    id: number;
    sedeId: number;
    nombre: string;
    capacidad: number;
    piso: number;
    tipo: string;
    estado: 'disponible' | 'en-uso' | 'mantenimiento';
}

export interface NuevaSedePayload {
    nombre: string;
    domicilio: string;
    telefono: string;
    email: string;
    pisos: number;
    notas: string;
    instalaciones: string[];
}

export interface NuevaAulaPayload {
    sedeId: number;
    nombre: string;
    capacidad: number;
    piso: number;
    tipo: string;
}

const httpOptions = {
    headers: new HttpHeaders({ 'Content-Type': 'application/json' })
};

@Injectable({
    providedIn: 'root',
})
export class SedeService {
    constructor(
        private http: HttpClient,
        private facadeService: FacadeService
    ) { }

    // ── Obtener todas las sedes ───────────────────────────────
    public obtenerSedes(): Observable<Sede[]> {
        var token = this.facadeService.getSessionToken();
        var headers = new HttpHeaders({ 'Content-Type': 'application/json', 'Authorization': 'Token ' + token });
        return this.http.get<Sede[]>(`${environment.url_api}/sedes/`, { headers });
    }

    // ── Obtener sede por ID ───────────────────────────────────
    public getSedeByID(id: number): Observable<Sede> {
        var token = this.facadeService.getSessionToken();
        var headers = new HttpHeaders({ 'Content-Type': 'application/json', 'Authorization': 'Token ' + token });
        return this.http.get<Sede>(`${environment.url_api}/sedes/detail/?id=${id}`, { headers });
    }

    // ── Crear nueva sede ──────────────────────────────────────
    public crearSede(data: NuevaSedePayload): Observable<any> {
        var token = this.facadeService.getSessionToken();
        var headers = new HttpHeaders({ 'Content-Type': 'application/json', 'Authorization': 'Token ' + token });
        return this.http.post<any>(`${environment.url_api}/sedes/`, data, { headers });
    }

    // ── Editar sede existente ─────────────────────────────────
    public editarSede(id: number, data: Partial<NuevaSedePayload>): Observable<any> {
        var token = this.facadeService.getSessionToken();
        var headers = new HttpHeaders({ 'Content-Type': 'application/json', 'Authorization': 'Token ' + token });
        return this.http.put<any>(`${environment.url_api}/sedes/edit/?id=${id}`, { ...data, id }, { headers });
    }

    // ── Eliminar sede ─────────────────────────────────────────
    public eliminarSede(id: number): Observable<any> {
        var token = this.facadeService.getSessionToken();
        var headers = new HttpHeaders({ 'Content-Type': 'application/json', 'Authorization': 'Token ' + token });
        return this.http.delete<any>(`${environment.url_api}/sedes/edit/?id=${id}`, { headers });
    }

    // ── Obtener aulas de una sede ─────────────────────────────
    public obtenerAulasPorSede(sedeId: number): Observable<Aula[]> {
        var token = this.facadeService.getSessionToken();
        var headers = new HttpHeaders({ 'Content-Type': 'application/json', 'Authorization': 'Token ' + token });
        return this.http.get<Aula[]>(`${environment.url_api}/aulas/?sede_id=${sedeId}`, { headers });
    }

    // ── Crear nueva aula ──────────────────────────────────────
    public crearAula(data: NuevaAulaPayload): Observable<any> {
        var token = this.facadeService.getSessionToken();
        var headers = new HttpHeaders({ 'Content-Type': 'application/json', 'Authorization': 'Token ' + token });
        return this.http.post<any>(`${environment.url_api}/aulas/`, data, { headers });
    }

    // ── Editar aula ───────────────────────────────────────────
    public editarAula(id: number, data: Partial<NuevaAulaPayload>): Observable<any> {
        var token = this.facadeService.getSessionToken();
        var headers = new HttpHeaders({ 'Content-Type': 'application/json', 'Authorization': 'Token ' + token });
        return this.http.put<any>(`${environment.url_api}/aulas/edit/?id=${id}`, { ...data, id }, { headers });
    }

    // ── Eliminar aula ─────────────────────────────────────────
    public eliminarAula(id: number): Observable<any> {
        var token = this.facadeService.getSessionToken();
        var headers = new HttpHeaders({ 'Content-Type': 'application/json', 'Authorization': 'Token ' + token });
        return this.http.delete<any>(`${environment.url_api}/aulas/edit/?id=${id}`, { headers });
    }
}
