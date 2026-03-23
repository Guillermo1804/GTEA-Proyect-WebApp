import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { FacadeService } from './facade-service';

// ── Interfaces ──────────────────────────────────────────────
export interface Categoria {
    id: number;
    nombre: string;
    descripcion: string;
    icon: string;
    color: string;
    activa: boolean;
}

export interface NuevaCategoriaPayload {
    nombre: string;
    descripcion: string;
    icon: string;
    color: string;
}

const httpOptions = {
    headers: new HttpHeaders({ 'Content-Type': 'application/json' })
};

@Injectable({
    providedIn: 'root',
})
export class CategoriaService {
    constructor(
        private http: HttpClient,
        private facadeService: FacadeService
    ) { }

    // ── Obtener todas las categorías ──────────────────────────
    public obtenerCategorias(): Observable<Categoria[]> {
        var token = this.facadeService.getSessionToken();
        var headers = new HttpHeaders({ 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token });
        return this.http.get<Categoria[]>(`${environment.url_api}/lista-categorias/`, { headers });
    }

    // ── Obtener categoría por ID ──────────────────────────────
    public getCategoriaByID(id: number): Observable<Categoria> {
        var token = this.facadeService.getSessionToken();
        var headers = new HttpHeaders({ 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token });
        return this.http.get<Categoria>(`${environment.url_api}/categoria/?id=${id}`, { headers });
    }

    // ── Crear nueva categoría ─────────────────────────────────
    public crearCategoria(data: NuevaCategoriaPayload): Observable<any> {
        var token = this.facadeService.getSessionToken();
        var headers = new HttpHeaders({ 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token });
        return this.http.post<any>(`${environment.url_api}/categoria/`, data, { headers });
    }

    // ── Editar categoría existente ────────────────────────────
    public editarCategoria(id: number, data: Partial<NuevaCategoriaPayload>): Observable<any> {
        var token = this.facadeService.getSessionToken();
        var headers = new HttpHeaders({ 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token });
        return this.http.put<any>(`${environment.url_api}/categorias-edit/`, { ...data, id }, { headers });
    }

    // ── Eliminar (desactivar) categoría ──────────────────────
    public eliminarCategoria(id: number): Observable<any> {
        var token = this.facadeService.getSessionToken();
        var headers = new HttpHeaders({ 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token });
        return this.http.delete<any>(`${environment.url_api}/categorias-edit/?id=${id}`, { headers });
    }
}
