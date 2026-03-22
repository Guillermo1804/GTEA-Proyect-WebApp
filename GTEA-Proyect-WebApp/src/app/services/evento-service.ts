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
  status?: 'Activo' | 'Borrador' | 'Finalizado' | 'Cancelado';
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
  // ════════════════════════════════════════════════
  // 🔧 MOCKS CENTRALIZADOS — Se eliminan cuando llegue el backend
  // ════════════════════════════════════════════════

  private readonly MOCK_CATEGORIAS = [
    { id: 1, nombre: 'Talleres' },
    { id: 2, nombre: 'Conferencias' },
    { id: 3, nombre: 'Seminarios' },
    { id: 4, nombre: 'Deportes' },
    { id: 5, nombre: 'Culturales' },
  ];

  private readonly MOCK_SEDES = [
    { id: 1, nombre: 'Edificio A - Ingeniería' },
    { id: 2, nombre: 'Edificio B - Ciencias' },
    { id: 3, nombre: 'Edificio C - Humanidades' },
  ];

  private readonly MOCK_AULAS: { [sedeId: number]: any[] } = {
    1: [
      { id: 101, nombre: 'Lab. Sistemas #1', capacidad: 40 },
      { id: 102, nombre: 'Lab. Sistemas #2', capacidad: 40 },
      { id: 103, nombre: 'Lab. Sistemas #3', capacidad: 40 },
    ],
    2: [
      { id: 201, nombre: 'Auditorio Principal', capacidad: 200 },
      { id: 202, nombre: 'Lab. Química', capacidad: 30 },
    ],
    3: [
      { id: 301, nombre: 'Aula Magna', capacidad: 120 },
      { id: 302, nombre: 'Sala de Usos Múltiples', capacidad: 50 },
      { id: 303, nombre: 'Galería Central', capacidad: 100 },
    ],
  };

  // Base de datos mock de eventos (sincronizada con eventos.ts)
  private readonly MOCK_EVENTOS: Evento[] = [
    {
      id: 1,
      titulo: 'Taller de Python Avanzado',
      categoriaId: 1, // Talleres
      descripcion: 'Taller intensivo sobre programación avanzada en Python, incluyendo estructuras de datos complejas, programación asíncrona y frameworks modernos.',
      imagenPortada: 'https://images.unsplash.com/photo-1526379095098-d400fd0bf935?w=800',
      fechaInicio: '2026-03-12',
      horaInicio: '09:00',
      fechaFin: '2026-03-12',
      horaFin: '12:00',
      modalidad: 'Presencial',
      sedeId: 1,
      aulaId: 103, // Lab. Sistemas #3
      cupoMaximo: 40,
      costoEntrada: 0,
      listaEspera: false,
      publicarInmediatamente: true,
      esOrganizador: true,
    },
    {
      id: 2,
      titulo: 'Conferencia Inteligencia Artificial',
      categoriaId: 2, // Conferencias
      descripcion: 'Conferencia sobre las últimas tendencias en inteligencia artificial, machine learning y sus aplicaciones en la industria moderna.',
      imagenPortada: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=800',
      fechaInicio: '2026-03-15',
      horaInicio: '16:00',
      fechaFin: '2026-03-15',
      horaFin: '18:00',
      modalidad: 'Presencial',
      sedeId: 2,
      aulaId: 201, // Auditorio Principal
      cupoMaximo: 200,
      costoEntrada: 0,
      listaEspera: false,
      publicarInmediatamente: true,
      esOrganizador: true,
    },
    {
      id: 3,
      titulo: 'Torneo de Ajedrez Interuniversitario',
      categoriaId: 4, // Deportes
      descripcion: 'Torneo de ajedrez abierto a todas las universidades. Categorías: principiantes, intermedios y avanzados.',
      imagenPortada: 'https://images.unsplash.com/photo-1528819622765-d6bcf132ac08?w=800',
      fechaInicio: '2026-03-20',
      horaInicio: '10:00',
      fechaFin: '2026-03-20',
      horaFin: '17:00',
      modalidad: 'Presencial',
      sedeId: 3,
      aulaId: 302, // Sala de Usos Múltiples
      cupoMaximo: 50,
      costoEntrada: 0,
      listaEspera: false,
      publicarInmediatamente: true,
      esOrganizador: true,
    },
    {
      id: 4,
      titulo: 'Seminario de Metodología de Investigación',
      categoriaId: 3, // Seminarios
      descripcion: 'Seminario dirigido a estudiantes de posgrado sobre metodologías de investigación científica y redacción de artículos académicos.',
      imagenPortada: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800',
      fechaInicio: '2026-03-25',
      horaInicio: '14:00',
      fechaFin: '2026-03-25',
      horaFin: '16:00',
      modalidad: 'Presencial',
      sedeId: 3,
      aulaId: 301, // Aula Magna
      cupoMaximo: 80,
      costoEntrada: 0,
      listaEspera: false,
      publicarInmediatamente: false, // Borrador
      esOrganizador: true,
    },
    {
      id: 5,
      titulo: 'Hackathon GTEA 2026',
      categoriaId: 1, // Talleres
      descripcion: 'Maratón de programación de 12 horas. Desarrolla soluciones innovadoras y compite por premios en efectivo. Incluye comida y bebidas.',
      imagenPortada: 'https://images.unsplash.com/photo-1531297484001-80022131f5a1?w=800',
      fechaInicio: '2026-04-01',
      horaInicio: '08:00',
      fechaFin: '2026-04-01',
      horaFin: '20:00',
      modalidad: 'Presencial',
      sedeId: 1,
      aulaId: 101, // Lab. Sistemas #1
      cupoMaximo: 60,
      costoEntrada: 0,
      listaEspera: true,
      publicarInmediatamente: true,
      esOrganizador: true,
    },
    {
      id: 6,
      titulo: 'Exposición de Arte Digital',
      categoriaId: 5, // Culturales
      descripcion: 'Exposición de obras de arte digital creadas por estudiantes. Incluye realidad virtual, animación 3D y arte generativo.',
      imagenPortada: 'https://images.unsplash.com/photo-1517077304055-6e89abbf09b0?w=800',
      fechaInicio: '2026-02-05',
      horaInicio: '11:00',
      fechaFin: '2026-02-05',
      horaFin: '19:00',
      modalidad: 'Presencial',
      sedeId: 3,
      aulaId: 303, // Galería Central
      cupoMaximo: 100,
      costoEntrada: 0,
      listaEspera: false,
      publicarInmediatamente: true,
      esOrganizador: true,
    },
  ];

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
