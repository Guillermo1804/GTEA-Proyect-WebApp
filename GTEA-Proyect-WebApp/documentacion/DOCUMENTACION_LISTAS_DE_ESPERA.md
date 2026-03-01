# GTEA — Sprint Review: Frontend MVP Increment

**Fecha:** 2026-03-01  
**Producto:** GTEA (Gestor de Talleres y Eventos Académicos)  
**Equipo:** Frontend Angular 20  

---

## Sprint Goal

> Entregar un Incremento de frontend _production-ready_ que cubra todos los flujos de usuario del MVP (Admin CRUD, Catálogo de Alumno, e Inscripción con lista de espera), implementando un **contrato API estricto** con el equipo de backend para garantizar una integración sin fricción.

---

## Increment Status — Definition of Done

| Criterio | Estado |
|---|---|
| Todos los componentes compilan sin errores (`ng build` exit 0) | ✅ Cumplido |
| Cada operación HTTP tiene su service method con payload tipado | ✅ Cumplido |
| Ningún service method ejecuta peticiones reales (stubs comentados) | ✅ Cumplido |
| RxJS defensive fallbacks (`of([])`, `new Subject`) previenen runtime crashes | ✅ Cumplido |
| JWT Auth Interceptor registrado en `app.config.ts` | ✅ Cumplido |
| Global Toast UI (Signals) reemplaza `alert()` para feedback de usuario | ✅ Cumplido |
| Environment files configurados (`environment.ts`, `environment.development.ts`) | ✅ Cumplido |
| Admin screens responsivos (mobile → tablet → desktop) | ✅ Cumplido |
| Zero hardcoded API URLs en services | ✅ Cumplido |

---

## Delivered Value — Sprint Backlog Completed

### 1. Student Enrollment Logic (Inscripción + Lista de Espera)

El flujo de inscripción del alumno está completamente implementado en el frontend:

- **Botón "Inscribirme"** en el modal del evento — sin formularios de captura de datos (regla de negocio GTEA)
- **Waitlist handling** reactivo: la UI reacciona a un flag booleano del backend (`eventoLleno`). Si el evento está lleno, el botón cambia automáticamente de **"Inscribirse"** a **"Lista de espera"**
- **HTTP 409 Conflict handling**: el frontend detecta conflictos de inscripción duplicada y muestra un toast de error en lugar de crashear

### 2. Zoneless State Management (Signals)

Se implementó **`ToastService`** usando Angular Signals (`signal<ToastMessage[]>`) como prueba de concepto de gestión de estado zoneless:

- `toasts = signal<ToastMessage[]>([])` — cola reactiva sin Zone.js
- `show()` — con auto-dismiss configurable (default 4s)
- `dismiss()` — actualización inmutable vía `signal.update()`

### 3. Strict Backend API Contract (Commented HTTP Stubs)

Se sigue estrictamente el **Backend Handoff Protocol** definido en las reglas del proyecto:

- Cada service method contiene la estructura HTTP completa (`this.http.get/post/put/delete`) con URLs relativas a `environment.url_api`
- Las líneas de ejecución están **completamente comentadas** con el tag `⚙️ TODO: UNCOMMENT WHEN BACKEND FIXES CORS`
- Cada método retorna un **RxJS fallback defensivo** (`return of([])` o `return new Subject()`) para que la app compile y no crashee

### 4. JWT Auth Interceptor

Implementado en `src/app/interceptors/auth.interceptor.ts` como `HttpInterceptorFn` funcional (patrón Angular 20):

- Inyecta el Bearer token desde `FacadeService.getSessionToken()` en cada request saliente
- Registrado globalmente en `app.config.ts` vía `provideHttpClient(withInterceptors(...))`

### 5. SCSS Responsive Overhaul — Admin Screens

Se integraron media queries derivadas de los mockups Stitch en **6 pantallas admin**:

| Pantalla | Tablet (≥768px) | Desktop (≥1024px) |
|---|---|---|
| Dashboard | Padding centrado, max-width 900px | 4-col stats grid, 2:1 content grid |
| Usuarios | 2-col card grid, búsqueda horizontal | 3-col card grid |
| Sedes | 2-col venue grid | Padding ampliado |
| Categorías | 3-col grid | 4-col grid |
| Eventos | 2-col card grid, búsqueda horizontal | 3-col card grid |
| Reportes | Charts más altos | 4-col KPI grid |

### 6. Gap Analysis — Service Methods Created

Se crearon **16 service methods** distribuidos en 3 nuevos servicios que el **equipo de backend debe implementar**:

#### `CategoriaService` (5 methods)

| # | Método | HTTP | Endpoint esperado |
|---|---|---|---|
| 1 | `obtenerCategorias()` | GET | `/categorias/` |
| 2 | `getCategoriaByID(id)` | GET | `/categorias/detail/?id={id}` |
| 3 | `crearCategoria(data)` | POST | `/categorias/` |
| 4 | `editarCategoria(id, data)` | PUT | `/categorias/edit/?id={id}` |
| 5 | `eliminarCategoria(id)` | DELETE | `/categorias/edit/?id={id}` |

#### `SedeService` (8 methods)

| # | Método | HTTP | Endpoint esperado |
|---|---|---|---|
| 6 | `obtenerSedes()` | GET | `/sedes/` |
| 7 | `getSedeByID(id)` | GET | `/sedes/detail/?id={id}` |
| 8 | `crearSede(data)` | POST | `/sedes/` |
| 9 | `editarSede(id, data)` | PUT | `/sedes/edit/?id={id}` |
| 10 | `eliminarSede(id)` | DELETE | `/sedes/edit/?id={id}` |
| 11 | `obtenerAulasPorSede(sedeId)` | GET | `/aulas/?sede_id={sedeId}` |
| 12 | `crearAula(data)` | POST | `/aulas/` |
| 13 | `editarAula(id, data)` | PUT | `/aulas/edit/?id={id}` |
| 14 | `eliminarAula(id)` | DELETE | `/aulas/edit/?id={id}` |

#### `InscripcionService` (3 methods)

| # | Método | HTTP | Endpoint esperado |
|---|---|---|---|
| 15 | `inscribirEvento(eventoId, alumnoId)` | POST | `/inscripciones/` |
| 16 | `inscribirListaEspera(eventoId, alumnoId)` | POST | `/inscripciones/lista-espera/` |
| — | `cancelarInscripcion(eventoId, alumnoId)` | DELETE | `/inscripciones/cancel/?evento_id={id}&alumno_id={id}` |

> **Total: 17 endpoints** que el backend debe exponer antes de la integración.

---

## Impediments / Technical Debt

### TD-001: `nuevo-evento-wizard.scss` Monolith

**Severidad:** Media  
**Impacto:** El archivo `nuevo-evento-wizard.scss` excede el budget default de Angular (8kB warning / 10kB error) para estilos de componente individual.

**Mitigación aplicada:** Se relajó el presupuesto en `angular.json`:

```json
{
  "type": "anyComponentStyle",
  "maximumWarning": "8kB",
  "maximumError": "16kB"
}
```

**Resolución futura:** Refactorizar el wizard en sub-componentes (e.g., `step-fecha`, `step-ubicacion`, `step-resumen`) cada uno con su propia hoja de estilos encapsulada.

### TD-002: Mock Data in Screen Components

Algunas pantallas admin (Dashboard, Eventos) mantienen arrays de datos mock hardcodeados en sus `.ts` para renderizar la UI durante desarrollo. Estos deben ser reemplazados por llamadas a los service methods una vez que el backend esté listo.

### TD-003: CORS Dependency

Todos los service methods están condicionados a la resolución del issue de CORS en el backend Django. Hasta que se resuelva, las peticiones HTTP permanecen comentadas.

---

*Documento generado como parte del Sprint Review según el Scrum Guide 2020.*
