import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';
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

/** Estados de ciclo de vida del evento (alineado con listado admin y API). */
export type EventoStatus = 'Activo' | 'Borrador' | 'Finalizado' | 'Cancelado';

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
  isFull?: boolean;

  // Paso 3 — Publicación
  publicarInmediatamente: boolean;
  esOrganizador: boolean;

  // Metadatos opcionales (respuesta del backend)
  id?: number;
  status?: EventoStatus;
  organizador?: string;
  organizadorNombre?: string;   // Nombre completo del organizador (desde backend)
  inscritos?: number;
  categoriaNombre?: string;     // Nombre de categoría (desde backend)
  sedeNombre?: string;          // Nombre de sede (desde backend)
  aulaNombre?: string;          // Nombre de aula (desde backend)
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
  ) { }

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
      status: 'Activo',
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
  // Mapeo: API (snake_case) → Frontend (camelCase)
  // ─────────────────────────────────────────────
  /**
   * Transforma la respuesta del backend (snake_case) al formato frontend (camelCase).
   * Mapea campos de la API a la interfaz Evento y agrega campos de display.
   */
  private _mapApiResponse(raw: any): Evento {
    console.log('RAW categoria_nombre:', raw.categoria_nombre);

    return {
      id: raw.id,
      titulo: raw.titulo,
      categoriaId: raw.categoria,
      categoriaNombre: raw.categoria_nombre || '',
      descripcion: raw.descripcion,
      imagenPortada: raw.imagen_portada || null,
      fechaInicio: raw.fecha_inicio,
      horaInicio: raw.hora_inicio,
      fechaFin: raw.fecha_fin,
      horaFin: raw.hora_fin,
      modalidad: raw.modalidad,
      sedeId: raw.sede,
      sedeNombre: raw.sede_nombre || '',
      aulaId: raw.aula,
      aulaNombre: raw.aula_nombre || '',
      cupoMaximo: raw.cupo_maximo,
      costoEntrada: raw.costo_entrada,
      listaEspera: raw.lista_espera,
      isFull: raw.is_full ?? false,
      publicarInmediatamente: raw.publicar_inmediatamente,
      esOrganizador: raw.es_organizador,
      status: raw.status,
      organizador: raw.organizador,
      organizadorNombre: raw.organizador_nombre || '',
      inscritos: raw.inscritos || 0,
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
      'Authorization': 'Token ' + token,
    });

    return this.http.post<any>(`${environment.url_api}/eventos/`, data, { headers });
  }

  /**
   * [READ] Obtener lista de todos los eventos
   * Endpoint esperado: GET /eventos/
   */
  public obtenerEventos(): Observable<Evento[]> {
    const token = this.facadeService.getSessionToken();
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': 'Token ' + token,
    });

    return this.http.get<any[]>(`${environment.url_api}/eventos/`, { headers }).pipe(
      map((eventos: any[]) => eventos.map(e => this._mapApiResponse(e)))
    );
  }

  /**
   * [READ] Obtener un evento por ID
   * Endpoint esperado: GET /eventos/detail/?id={id}
   */
  public getEventoByID(idEvento: number): Observable<Evento | null> {
    const token = this.facadeService.getSessionToken();
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': 'Token ' + token,
    });

    return this.http.get<any>(`${environment.url_api}/eventos/detail/?id=${idEvento}`, { headers }).pipe(
      map(data => data ? this._mapApiResponse(data) : null)
    );
  }

  /**
   * [UPDATE] Editar un evento existente
   * Endpoint esperado: PUT /eventos/edit/?id={id}
   */
  public editarEvento(idEvento: number, data: Evento): Observable<any> {
    const token = this.facadeService.getSessionToken();
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': 'Token ' + token,
    });

    return this.http.put<any>(`${environment.url_api}/eventos/edit/?id=${idEvento}`, { ...data, id: idEvento }, { headers });
  }

  /**
   * [DELETE] Eliminar un evento por ID
   * Endpoint esperado: DELETE /eventos/edit/?id={id}
   */
  public eliminarEvento(idEvento: number): Observable<any> {
    const token = this.facadeService.getSessionToken();
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': 'Token ' + token,
    });

    return this.http.delete<any>(`${environment.url_api}/eventos/edit/?id=${idEvento}`, { headers });
  }

  /**
   * [READ] Obtener categorías disponibles para el select del Paso 1
   * Endpoint esperado: GET /categorias/
   */
  public obtenerCategorias(): Observable<any[]> {
    const token = this.facadeService.getSessionToken();
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': 'Token ' + token,
    });

    return this.http.get<any[]>(`${environment.url_api}/categorias/`, { headers });
  }

  /**
   * [READ] Obtener sedes disponibles para el select del Paso 2
   * Endpoint esperado: GET /sedes/
   */
  public obtenerSedes(): Observable<any[]> {
    const token = this.facadeService.getSessionToken();
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': 'Token ' + token,
    });

    return this.http.get<any[]>(`${environment.url_api}/sedes/`, { headers });
  }

  /**
   * [READ] Obtener aulas filtradas por sede
   * Endpoint esperado: GET /aulas/?sede_id={sedeId}
   */
  public obtenerAulasPorSede(sedeId: string | number): Observable<any[]> {
    const token = this.facadeService.getSessionToken();
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': 'Token ' + token,
    });

    return this.http.get<any[]>(`${environment.url_api}/aulas/?sede_id=${sedeId}`, { headers });
  }

  // ════════════════════════════════════════════════
  // Métodos públicos para obtener nombres desde IDs
  // Ahora usan HTTP. Para uso sincrónico en templates,
  // los componentes deben pre-cargar los catálogos.
  // ════════════════════════════════════════════════

  public getCategoriaNombre(id: string | number): string {
    // Fallback sincrónico — los componentes deben cachear las listas
    return `Categoría #${id}`;
  }

  public getSedeNombre(id?: string | number): string {
    if (!id) return 'Virtual';
    return `Sede #${id}`;
  }

  public getAulaNombre(id?: string | number, sedeId?: string | number): string {
    if (!id || !sedeId) return '—';
    return `Aula #${id}`;
  }
}
