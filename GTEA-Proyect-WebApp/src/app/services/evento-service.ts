import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { environment } from '../../environments/environment';
import { FacadeService } from './facade-service';
import { ValidatorService } from './tools/validator-service';
import { ErrorsService } from './tools/errors-service';

// ─────────────────────────────────────────────
// Opciones HTTP sin autenticación (registro)
// ─────────────────────────────────────────────
const httpOptions = {
  headers: new HttpHeaders({ 'Content-Type': 'application/json' }),
};

// ─────────────────────────────────────────────
// Interfaz principal del Evento
// ─────────────────────────────────────────────
export interface Evento {
  // Paso 1 — Información general
  titulo: string;
  categoriaId: string | number;
  descripcion: string;
  imagenPortada: File | string | null;

  // Paso 2 — Detalles del evento
  fechaInicio: string;         // Formato: YYYY-MM-DD
  horaInicio: string;          // Formato: HH:MM
  fechaFin: string;            // Formato: YYYY-MM-DD
  horaFin: string;             // Formato: HH:MM
  modalidad: 'Presencial' | 'Virtual';
  sedeId?: string | number;    // Requerido si modalidad === 'Presencial'
  aulaId?: string | number;    // Requerido si modalidad === 'Presencial'
  cupoMaximo: number;          // Entero > 0
  costoEntrada: number;        // Numérico >= 0
  listaEspera: boolean;

  // Paso 3 — Publicación
  publicarInmediatamente: boolean;
  esOrganizador: boolean;

  // Metadatos opcionales (respuesta del backend)
  id?: number;
  status?: 'Activo' | 'Borrador' | 'Finalizado' | 'Cancelado';
  organizador?: string;
  inscritos?: number;
}

@Injectable({
  providedIn: 'root',
})
export class EventoService {
  constructor(
    private http: HttpClient,
    private facadeService: FacadeService,
    private validatorService: ValidatorService,
    private errorService: ErrorsService,
  ) {}

  // ─────────────────────────────────────────────
  // Esquema vacío de Evento (objeto por defecto)
  // ─────────────────────────────────────────────
  public esquemaEvento(): Evento {
    return {
      titulo: '',
      categoriaId: '',
      descripcion: '',
      imagenPortada: null,
      fechaInicio: '',
      horaInicio: '',
      fechaFin: '',
      horaFin: '',
      modalidad: 'Presencial',
      sedeId: '',
      aulaId: '',
      cupoMaximo: 30,
      costoEntrada: 0,
      listaEspera: false,
      publicarInmediatamente: true,
      esOrganizador: true,
    };
  }

  // ─────────────────────────────────────────────
  // Validaciones del formulario por paso
  // ─────────────────────────────────────────────

  /** Valida el Paso 1: Información general */
  public validarPaso1(data: Partial<Evento>): Record<string, string> {
    const error: Record<string, string> = {};

    if (!this.validatorService.required(data['titulo'])) {
      error['titulo'] = this.errorService.required;
    } else if (!this.validatorService.max(data['titulo'], 120)) {
      error['titulo'] = this.errorService.max(120);
    }

    if (!this.validatorService.required(data['categoriaId'])) {
      error['categoriaId'] = this.errorService.required;
    }

    if (!this.validatorService.required(data['descripcion'])) {
      error['descripcion'] = this.errorService.required;
    } else if (!this.validatorService.max(data['descripcion'], 500)) {
      error['descripcion'] = this.errorService.max(500);
    }

    return error;
  }

  /** Valida el Paso 2: Detalles del evento */
  public validarPaso2(data: Partial<Evento>): Record<string, string> {
    const error: Record<string, string> = {};

    if (!this.validatorService.required(data['fechaInicio'])) {
      error['fechaInicio'] = this.errorService.required;
    }

    if (!this.validatorService.required(data['horaInicio'])) {
      error['horaInicio'] = this.errorService.required;
    }

    if (!this.validatorService.required(data['fechaFin'])) {
      error['fechaFin'] = this.errorService.required;
    }

    if (!this.validatorService.required(data['horaFin'])) {
      error['horaFin'] = this.errorService.required;
    }

    // Validación: fechaFin >= fechaInicio
    if (data['fechaInicio'] && data['fechaFin']) {
      const inicio = new Date(`${data['fechaInicio']}T${data['horaInicio'] || '00:00'}`);
      const fin = new Date(`${data['fechaFin']}T${data['horaFin'] || '00:00'}`);
      if (fin < inicio) {
        error['fechaFin'] = 'La fecha y hora de fin debe ser posterior a la de inicio';
      }
    }

    if (!this.validatorService.required(data['modalidad'])) {
      error['modalidad'] = this.errorService.required;
    }

    // Validación condicional: si Presencial, sede y aula son requeridos
    if (data['modalidad'] === 'Presencial') {
      if (!this.validatorService.required(data['sedeId'])) {
        error['sedeId'] = this.errorService.required;
      }
      if (!this.validatorService.required(data['aulaId'])) {
        error['aulaId'] = this.errorService.required;
      }
    }

    // Validación numérica: cupo
    if (!this.validatorService.required(data['cupoMaximo'])) {
      error['cupoMaximo'] = this.errorService.required;
    } else if (!this.validatorService.numeric(data['cupoMaximo']) || Number(data['cupoMaximo']) <= 0) {
      error['cupoMaximo'] = 'El cupo debe ser un número entero mayor a 0';
    }

    // Validación numérica: costo
    if (data['costoEntrada'] === undefined || data['costoEntrada'] === null) {
      error['costoEntrada'] = this.errorService.required;
    } else if (!this.validatorService.numeric(data['costoEntrada']) || Number(data['costoEntrada']) < 0) {
      error['costoEntrada'] = 'El costo debe ser numérico y mayor o igual a 0';
    }

    return error;
  }

  /** Validación completa (todos los pasos) */
  public validarEvento(data: Evento): Record<string, string> {
    return {
      ...this.validarPaso1(data),
      ...this.validarPaso2(data),
    };
  }

  // ─────────────────────────────────────────────
  // CRUD — Peticiones HTTP
  // NOTA PARA EL EQUIPO BACKEND:
  // Descomentar los bloques `return this.http.*` y
  // eliminar los `return of(...)` cuando los endpoints
  // de Django/DRF estén disponibles en `environment.url_api`
  // ─────────────────────────────────────────────

  /**
   * [CREATE] Crear un nuevo evento
   * Endpoint esperado: POST /eventos/
   */
  public crearEvento(data: Evento): Observable<any> {
    const token = this.facadeService.getSessionToken();
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + token,
    });

    // ⚙️ Descomentar cuando el backend esté listo:
    // return this.http.post<any>(`${environment.url_api}/eventos/`, data, { headers });

    // 🔧 Mock temporal hasta que el backend esté listo:
    console.log('[EventoService] crearEvento() — mock', data);
    return of({ success: true, message: 'Evento creado (mock)', data });
  }

  /**
   * [READ] Obtener lista de todos los eventos
   * Endpoint esperado: GET /eventos/
   */
  public obtenerEventos(): Observable<any> {
    const token = this.facadeService.getSessionToken();
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + token,
    });

    // ⚙️ Descomentar cuando el backend esté listo:
    // return this.http.get<any>(`${environment.url_api}/eventos/`, { headers });

    // 🔧 Mock temporal:
    console.log('[EventoService] obtenerEventos() — mock');
    return of([]);
  }

  /**
   * [READ] Obtener un evento por ID
   * Endpoint esperado: GET /eventos/detail/?id={id}
   */
  public getEventoByID(idEvento: number): Observable<any> {
    const token = this.facadeService.getSessionToken();
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + token,
    });

    // ⚙️ Descomentar cuando el backend esté listo:
    // return this.http.get<any>(`${environment.url_api}/eventos/detail/?id=${idEvento}`, { headers });

    // 🔧 Mock temporal:
    console.log('[EventoService] getEventoByID() — mock', idEvento);
    return of(null);
  }

  /**
   * [UPDATE] Editar un evento existente
   * Endpoint esperado: PUT /eventos/edit/
   */
  public editarEvento(data: Evento): Observable<any> {
    const token = this.facadeService.getSessionToken();
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + token,
    });

    // ⚙️ Descomentar cuando el backend esté listo:
    // return this.http.put<any>(`${environment.url_api}/eventos/edit/`, data, { headers });

    // 🔧 Mock temporal:
    console.log('[EventoService] editarEvento() — mock', data);
    return of({ success: true, message: 'Evento actualizado (mock)', data });
  }

  /**
   * [DELETE] Eliminar un evento por ID
   * Endpoint esperado: DELETE /eventos/edit/?id={id}
   */
  public eliminarEvento(idEvento: number): Observable<any> {
    const token = this.facadeService.getSessionToken();
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + token,
    });

    // ⚙️ Descomentar cuando el backend esté listo:
    // return this.http.delete<any>(`${environment.url_api}/eventos/edit/?id=${idEvento}`, { headers });

    // 🔧 Mock temporal:
    console.log('[EventoService] eliminarEvento() — mock', idEvento);
    return of({ success: true, message: 'Evento eliminado (mock)' });
  }

  /**
   * [READ] Obtener categorías disponibles para el select del Paso 1
   * Endpoint esperado: GET /categorias/
   */
  public obtenerCategorias(): Observable<any> {
    const token = this.facadeService.getSessionToken();
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + token,
    });

    // ⚙️ Descomentar cuando el backend esté listo:
    // return this.http.get<any>(`${environment.url_api}/categorias/`, { headers });

    // 🔧 Mock temporal:
    return of([
      { id: 1, nombre: 'Talleres' },
      { id: 2, nombre: 'Conferencias' },
      { id: 3, nombre: 'Seminarios' },
      { id: 4, nombre: 'Deportes' },
      { id: 5, nombre: 'Culturales' },
    ]);
  }

  /**
   * [READ] Obtener sedes disponibles para el select del Paso 2
   * Endpoint esperado: GET /sedes/
   */
  public obtenerSedes(): Observable<any> {
    const token = this.facadeService.getSessionToken();
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + token,
    });

    // ⚙️ Descomentar cuando el backend esté listo:
    // return this.http.get<any>(`${environment.url_api}/sedes/`, { headers });

    // 🔧 Mock temporal:
    return of([
      { id: 1, nombre: 'Edificio A - Ingeniería' },
      { id: 2, nombre: 'Edificio B - Ciencias' },
      { id: 3, nombre: 'Edificio C - Humanidades' },
    ]);
  }

  /**
   * [READ] Obtener aulas filtradas por sede
   * Endpoint esperado: GET /aulas/?sede_id={sedeId}
   */
  public obtenerAulasPorSede(sedeId: string | number): Observable<any> {
    const token = this.facadeService.getSessionToken();
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + token,
    });

    // ⚙️ Descomentar cuando el backend esté listo:
    // return this.http.get<any>(`${environment.url_api}/aulas/?sede_id=${sedeId}`, { headers });

    // 🔧 Mock temporal:
    return of([
      { id: 1, nombre: 'Lab. Sistemas #1', capacidad: 40 },
      { id: 2, nombre: 'Lab. Sistemas #2', capacidad: 40 },
      { id: 3, nombre: 'Aula Magna', capacidad: 120 },
      { id: 4, nombre: 'Sala de Cómputo', capacidad: 30 },
    ]);
  }
}
