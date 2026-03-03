import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
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
        // var token = this.facadeService.getSessionToken();
        // var headers = new HttpHeaders({ 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token });
        // ⚙️ TODO: UNCOMMENT WHEN BACKEND FIXES CORS
        // return this.http.get<Categoria[]>(`${environment.url_api}/categorias/`, { headers });

        // TODO: REMOVE - TEMPORARY FOR COMPILATION
        return of([]);
    }

    // ── Obtener categoría por ID ──────────────────────────────
    public getCategoriaByID(id: number): Observable<Categoria> {
        // var token = this.facadeService.getSessionToken();
        // var headers = new HttpHeaders({ 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token });
        // ⚙️ TODO: UNCOMMENT WHEN BACKEND FIXES CORS
        // return this.http.get<Categoria>(`${environment.url_api}/categorias/detail/?id=${id}`, { headers });

        // TODO: REMOVE - TEMPORARY FOR COMPILATION
        return of({} as Categoria);
    }

    // ── Crear nueva categoría ─────────────────────────────────
    public crearCategoria(data: NuevaCategoriaPayload): Observable<any> {
        // var token = this.facadeService.getSessionToken();
        // var headers = new HttpHeaders({ 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token });
        // ⚙️ TODO: UNCOMMENT WHEN BACKEND FIXES CORS
        // return this.http.post<any>(`${environment.url_api}/categorias/`, data, { headers });

        // TODO: REMOVE - TEMPORARY FOR COMPILATION
        return of({ success: true });
    }

    // ── Editar categoría existente ────────────────────────────
    public editarCategoria(id: number, data: Partial<NuevaCategoriaPayload>): Observable<any> {
        // var token = this.facadeService.getSessionToken();
        // var headers = new HttpHeaders({ 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token });
        // ⚙️ TODO: UNCOMMENT WHEN BACKEND FIXES CORS
        // return this.http.put<any>(`${environment.url_api}/categorias/edit/?id=${id}`, data, { headers });

        // TODO: REMOVE - TEMPORARY FOR COMPILATION
        return of({ success: true });
    }

    // ── Eliminar (desactivar) categoría ──────────────────────
    public eliminarCategoria(id: number): Observable<any> {
        // var token = this.facadeService.getSessionToken();
        // var headers = new HttpHeaders({ 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token });
        // ⚙️ TODO: UNCOMMENT WHEN BACKEND FIXES CORS
        // return this.http.delete<any>(`${environment.url_api}/categorias/edit/?id=${id}`, { headers });

        // TODO: REMOVE - TEMPORARY FOR COMPILATION
        return of({ success: true });
    }
}
