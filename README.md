<p align="center">
  <img src="https://angular.dev/assets/images/press-kit/angular_wordmark_gradient.png" alt="Angular" width="280"/>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Angular-v20-DD0031?style=for-the-badge&logo=angular&logoColor=white" alt="Angular v20"/>
  <img src="https://img.shields.io/badge/TypeScript-5.9-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript 5.9"/>
  <img src="https://img.shields.io/badge/RxJS-7.8-B7178C?style=for-the-badge&logo=reactivex&logoColor=white" alt="RxJS"/>
  <img src="https://img.shields.io/badge/Signals-Zoneless-FF6F00?style=for-the-badge&logo=angular&logoColor=white" alt="Signals Zoneless"/>
  <img src="https://img.shields.io/badge/SCSS-Pure-CD6799?style=for-the-badge&logo=sass&logoColor=white" alt="SCSS"/>
  <img src="https://img.shields.io/badge/API-Django_REST-092E20?style=for-the-badge&logo=django&logoColor=white" alt="Django REST"/>
</p>

---

# GTEA — Cliente Web Frontend

**Gestión de Talleres, Eventos y Aulas**

Cliente web responsivo y multi-rol para el sistema GTEA.  
Permite a **Administradores**, **Organizadores** y **Alumnos** gestionar sedes, aulas, eventos, inscripciones y listas de espera a través de una interfaz moderna construida con las últimas APIs funcionales de Angular.

La aplicación se conecta a una API REST desarrollada en **Django REST Framework** y opera en modo **Zoneless** mediante `provideZonelessChangeDetection()`, aprovechando **Angular Signals** para una reactividad de grano fino sin la sobrecarga de Zone.js.

---

## 📋 Tabla de Contenidos

- [Stack Tecnológico](#-stack-tecnológico)
- [Arquitectura y Patrones Clave](#-arquitectura-y-patrones-clave)
- [Estructura de Directorios](#-estructura-de-directorios)
- [Configuración del Entorno Local](#-configuración-del-entorno-local)
- [Scripts Disponibles](#-scripts-disponibles)
- [Flujo de Trabajo](#-flujo-de-trabajo)

---

## 🧱 Stack Tecnológico

| Capa            | Tecnología                                                                                  |
| --------------- | ------------------------------------------------------------------------------------------- |
| **Framework**   | Angular v20 — Standalone Components, APIs funcionales, SSR con hidratación                  |
| **Lenguaje**    | TypeScript 5.9                                                                              |
| **Reactividad** | Angular Signals (estado síncrono de UI) + RxJS 7.8 (flujos asíncronos HTTP)                |
| **Estilos**     | SCSS puro — CSS Grid & Flexbox para responsividad sin librerías pesadas de terceros         |
| **Iconografía** | Bootstrap Icons + Material Icons                                                            |
| **HTTP**        | `HttpClient` con `withFetch()` y `HttpInterceptorFn` personalizado                         |
| **Routing**     | Lazy-loading por componente con `loadComponent()` y guards funcionales (`CanActivateFn`)    |
| **Backend**     | Django REST Framework (Token Authentication)                                                |

---

## 🏗 Arquitectura y Patrones Clave

### 🔐 Seguridad (Auth)

El perímetro de seguridad del frontend se implementa con dos artefactos funcionales:

#### `auth.interceptor.ts` — Inyección Automática de Token JWT

```typescript
// HttpInterceptorFn — API funcional (sin clases)
export const authInterceptor: HttpInterceptorFn = (req, next) => {
    const token = localStorage.getItem('gtea-proyecto-token') || '';

    if (token) {
        const clonedReq = req.clone({
            setHeaders: {
                Authorization: `Token ${token}`,
            },
        });
        return next(clonedReq);
    }
    return next(req);
};
```

- Se registra globalmente en `app.config.ts` via `withInterceptors([authInterceptor])`.
- **Clona** cada petición saliente para adjuntar el header `Authorization: Token <jwt>`.
- Las peticiones sin token pasan sin modificar (e.g., login, registro).

#### `auth.guard.ts` — Protección Perimetral de Rutas por Rol

```typescript
export const authGuard: CanActivateFn = (route, state) => {
    const router    = inject(Router);
    const userRole  = localStorage.getItem('userRole') || '';
    const segment   = state.url.split('/')[1] || '';

    const routeToRole: Record<string, string> = {
        'admin':       'administrador',
        'alumno':      'alumno',
        'organizador': 'organizador',
    };

    if (!userRole || userRole !== routeToRole[segment]) {
        router.navigate(['/login']);
        return false;
    }
    return true;
};
```

- Extrae el **primer segmento** de la URL y lo compara contra el rol almacenado en `localStorage`.
- Si no coincide → redirección inmediata a `/login`.
- Previene **manipulación directa de URL** por usuarios no autorizados.

---

### ⚡ Manejo de Estado y Reactividad

El frontend implementa una **estrategia dual de reactividad**:

| Mecanismo          | Uso                                                                                       | Ejemplo                                         |
| ------------------ | ----------------------------------------------------------------------------------------- | ------------------------------------------------ |
| **Angular Signals** | Estado síncrono de la UI visual                                                            | `isProcessing`, `cupoLleno`, `isEditing`        |
| **RxJS**           | Flujos asíncronos HTTP e intercepción de códigos de error                                  | `409 Conflict`, `400 Bad Request`, `Observable<>` |

- Los **Signals** controlan flags de UI que cambian de forma reactiva sin necesidad de subscripciones manuales ni Zone.js.
- **RxJS** gestiona las respuestas del backend, transformaciones de datos y el pipeline completo solicitud → respuesta → manejo de errores HTTP.

La aplicación opera en modo **Zoneless** (`provideZonelessChangeDetection()`), eliminando la sobrecarga de Zone.js y delegando toda la detección de cambios a Signals.

---

### 🛡 Integración Defensiva — Patrón Handoff

La comunicación con el backend se protege con **contratos de interfaz estrictos**:

```typescript
export interface RespuestaInscripcion {
    success:                boolean;
    mensaje:                string;
    posicionListaEspera:    number | null;
}
```

- Cada respuesta del backend se tipifica contra una interfaz TypeScript (`RespuestaInscripcion`).
- Los servicios usan genéricos explícitos: `this.http.post<RespuestaInscripcion>(...)`.
- Si el backend envía una respuesta inesperada, TypeScript **detecta la incompatibilidad** en tiempo de compilación.
- Los toasts de la UI (`ToastMessage`) reaccionan al campo `mensaje` de la respuesta para feedback inmediato al usuario.

---

## 📁 Estructura de Directorios

```
src/app/
├── guards/                     # Protección de rutas
│   └── auth.guard.ts           # CanActivateFn — validación de rol
│
├── interceptors/               # Interceptores HTTP
│   └── auth.interceptor.ts     # HttpInterceptorFn — inyección de Token
│
├── models/                     # Contratos de interfaz (Handoff Pattern)
│   └── inscripcion.model.ts    # RespuestaInscripcion, ToastMessage
│
├── services/                   # Servicios por rol y dominio
│   ├── facade-service.ts       # Auth: login, registro, gestión de sesión
│   ├── admin-service.service.ts    # CRUD exclusivo del Administrador
│   ├── alumno-service.ts       # Operaciones del Alumno
│   ├── organizador-service.ts  # Operaciones del Organizador
│   ├── inscripcion.service.ts  # Inscripciones y listas de espera
│   ├── sede.service.ts         # Gestión de sedes y aulas
│   ├── evento-service.ts       # CRUD de eventos
│   └── categoria.service.ts    # Gestión de categorías
│
├── screens/                    # Vistas separadas por dominio de rol
│   ├── landing-screen/         # Página pública de bienvenida
│   ├── login-screen/           # Autenticación
│   ├── registro-screen/        # Registro con asignación automática de rol
│   ├── admin/                  # Panel de Administrador
│   │   ├── dashboard/          #   └── Métricas y resumen general
│   │   ├── sedes/              #   └── Gestión de sedes y aulas
│   │   ├── categorias/         #   └── Categorías de eventos
│   │   ├── usuarios/           #   └── ABM de usuarios
│   │   ├── eventos/            #   └── CRUD + Wizard de eventos
│   │   └── reportes/           #   └── Generación de reportes
│   └── alumno/                 # Panel del Alumno
│       ├── catalogo/           #   └── Catálogo de eventos disponibles
│       └── evento-detalle/     #   └── Detalle + Inscripción / Lista de espera
│
├── partials/                   # Componentes de layout reutilizables
│   ├── top-navbar/             # Barra de navegación superior
│   ├── bottom-nav/             # Navegación inferior (mobile)
│   ├── footer/                 # Pie de página
│   └── back-header/            # Header con botón de retroceso
│
├── shared/                     # Componentes compartidos entre roles
│   ├── modals/                 # Modales reutilizables
│   │   ├── nueva-sede-modal/
│   │   ├── nueva-categoria-modal/
│   │   └── nuevo-usuario-modal/
│   └── toast/                  # Sistema de notificaciones toast
│
├── modals/                     # Modales de dominio específico
│   └── eliminar-user-modal/
│
├── app.config.ts               # Configuración: Zoneless, Interceptors, Router
├── app.routes.ts               # Definición de rutas con lazy-loading
└── app.ts                      # Componente raíz (Standalone)
```

---

## 🚀 Configuración del Entorno Local

### Prerrequisitos

- **Node.js** ≥ 20.x
- **Angular CLI** ≥ 20.x (`npm install -g @angular/cli`)
- **Backend GTEA** corriendo en `http://127.0.0.1:8000`

### Paso a Paso

**1. Clonar el repositorio**

```bash
git clone https://github.com/<tu-organizacion>/GTEA-Proyect-WebApp.git
cd GTEA-Proyect-WebApp
```

**2. Instalar dependencias**

```bash
npm install
```

**3. Configurar el entorno de desarrollo**

Verificar que `src/environments/environment.development.ts` apunte al backend local:

```typescript
export const environment = {
    production: false,
    url_api:  "http://127.0.0.1:8000",
    apiUrl:   "http://127.0.0.1:8000/api"
};
```

**4. Levantar el servidor de desarrollo**

```bash
ng serve
```

La aplicación estará disponible en: **`http://localhost:4200`**

> [!NOTE]
> El servidor de desarrollo incluye **hot reload** automático. Los cambios en archivos `.ts`, `.html` y `.scss` se reflejan de inmediato en el navegador.

---

## 📜 Scripts Disponibles

| Comando                          | Descripción                                            |
| -------------------------------- | ------------------------------------------------------ |
| `ng serve`                       | Servidor de desarrollo con hot reload                  |
| `ng build`                       | Build de producción optimizado                         |
| `ng build --watch`               | Build en modo watch (desarrollo)                       |
| `ng test`                        | Ejecutar tests unitarios con Karma/Jasmine             |
| `npm run serve:ssr:GTEA-Proyect-WebApp` | Servir la aplicación con SSR (producción)       |

---

## 🔄 Flujo de Trabajo

### Creación de Componentes

Todos los componentes se generan como **Standalone** por defecto (Angular v20):

```bash
ng generate component screens/admin/mi-nuevo-componente
```

> [!IMPORTANT]
> - **NO usar `NgModule`**. Todos los componentes son Standalone e importan sus dependencias directamente.
> - Los componentes de pantalla van en `screens/<rol>/` según el dominio del rol.
> - Los componentes reutilizables entre roles van en `shared/`.
> - Los componentes de layout (navbar, footer) van en `partials/`.

### Servicios por Rol

Cada rol tiene su servicio dedicado. Al crear operaciones nuevas:

```bash
ng generate service services/mi-nuevo-servicio
```

- **`facade-service.ts`** → Autenticación y gestión de sesión.
- **`admin-service.service.ts`** → Operaciones exclusivas del administrador.
- **`alumno-service.ts`** → Operaciones del alumno.
- **`organizador-service.ts`** → Operaciones del organizador.

### Manejo de Ramas

| Rama              | Propósito                                                     |
| ----------------- | ------------------------------------------------------------- |
| `main`            | Código estable y desplegable                                  |
| `production`      | Listo para Despliegue                                         |
| `stagging`        | Pruebas e integracion antes de pasar a `production`                           |
| `development`     | Integracion de cambios hechos por cada desarrollador                                            |
| `dev_<nombre>`    | Rama individual por desarrollador                    |

```bash
# Crear una nueva feature branch
git checkout develop
git pull origin develop
git checkout -b feature/mi-nueva-funcionalidad

# Al terminar, abrir Pull Request hacia develop
```

---

<p align="center">
  <sub>GTEA Frontend · Angular v20 · Universidad BUAP · 2025-2026</sub>
</p>
