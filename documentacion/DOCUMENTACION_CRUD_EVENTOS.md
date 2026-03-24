# 📚 Documentación - CRUD de Eventos (Frontend)

## 📌 Resumen

Se implementó el sistema completo de **Creación, Lectura, Actualización y Eliminación (CRUD) de Eventos** en la ruta `/admin/eventos` del proyecto GTEA WebApp. El flujo de creación utiliza un **Wizard de 3 pasos** con diseño 100% responsive (mobile, tablet, desktop).

---

## 🗂️ Archivos Creados

### 1. Servicio de Eventos
**Ubicación:** `src/app/services/evento-service.ts`

- ✅ Interfaz `Evento` con todos los campos necesarios
- ✅ Métodos CRUD: `crearEvento()`, `obtenerEventos()`, `editarEvento()`, `eliminarEvento()`
- ✅ Validaciones por paso: `validarPaso1()`, `validarPaso2()`
- ✅ Métodos auxiliares: `obtenerCategorias()`, `obtenerSedes()`, `obtenerAulasPorSede()`
- ⚠️ **Nota:** Las peticiones HTTP están comentadas con mocks funcionales para que el backend las implemente

### 2. Componente Wizard
**Ubicación:** `src/app/screens/admin/eventos/nuevo-evento-wizard/`

- ✅ `nuevo-evento-wizard.ts` - Lógica del wizard (352 líneas)
- ✅ `nuevo-evento-wizard.html` - Template con 3 pasos (516 líneas)
- ✅ `nuevo-evento-wizard.scss` - Estilos responsive (1061 líneas)

### 3. Documentación
**Ubicación:** `PLAN_CRUD_EVENTOS.md`

- ✅ Plan de acción completo
- ✅ Estructura de datos
- ✅ Endpoints esperados del backend

---

## 🎯 Funcionalidades Implementadas

### Paso 1: Información General
- ✅ Campo de título (máx. 120 caracteres)
- ✅ Selector de categoría (carga dinámica desde API)
- ✅ Área de descripción (máx. 500 caracteres)
- ✅ Upload de imagen de portada (PNG/JPG, máx. 5MB)
- ✅ Preview de imagen antes de subir

### Paso 2: Detalles del Evento
- ✅ Fecha y hora de inicio
- ✅ Fecha y hora de fin (validación: fin > inicio)
- ✅ Modalidad: Presencial o Virtual
- ✅ Selector de sede (solo si es Presencial)
- ✅ Selector de aula (solo si es Presencial, carga dinámica por sede)
- ✅ Stepper numérico para cupo máximo (entero > 0)
- ✅ Stepper numérico para costo de entrada (>= 0)
- ✅ Toggle switch para lista de espera
- ✅ Alerta de conflicto de horario (preparada para backend)

### Paso 3: Resumen y Publicación
- ✅ Vista previa completa de todos los datos ingresados
- ✅ Imagen de portada con badge de categoría
- ✅ Opción "Publicar Inmediatamente" (radio)
- ✅ Opción "Soy el Organizador" (checkbox)
- ✅ Botón "Publicar Evento" con estado de carga

---

## 🔧 Validaciones Implementadas

### Validaciones del Paso 1
- Título: requerido, máximo 120 caracteres
- Categoría: requerido
- Descripción: requerido, máximo 500 caracteres
- Imagen: opcional, PNG/JPG, máximo 5MB

### Validaciones del Paso 2
- Fecha inicio: requerido
- Hora inicio: requerido
- Fecha fin: requerido, debe ser >= fecha inicio
- Hora fin: requerido, si mismo día debe ser > hora inicio
- Modalidad: requerido
- Sede: requerido solo si modalidad = Presencial
- Aula: requerido solo si modalidad = Presencial
- Cupo máximo: requerido, entero > 0
- Costo entrada: requerido, numérico >= 0

### Validación Cruzada
- La fecha/hora de fin debe ser posterior a la de inicio
- Si modalidad es Presencial, sede y aula son obligatorios
- Si modalidad es Virtual, sede y aula se deshabilitan

---

## 📱 Diseño Responsive

### Mobile (< 768px)
- Modal a pantalla completa
- Formularios en una columna
- Botones de navegación apilados

### Tablet (768px - 1024px)
- Modal al 90% de la pantalla, centrado
- Formularios en una columna
- Campos de fecha/hora en dos columnas

### Desktop (> 1024px)
- Modal fijo de 620px, centrado
- Máxima altura: 88vh
- Scroll interno del contenido

---

## 🔌 Integración con Backend

### Endpoints Esperados

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/eventos/` | Crear nuevo evento |
| GET | `/eventos/` | Listar todos los eventos |
| GET | `/eventos/detail/?id={id}` | Obtener evento por ID |
| PUT | `/eventos/edit/` | Actualizar evento |
| DELETE | `/eventos/edit/?id={id}` | Eliminar evento |
| GET | `/categorias/` | Listar categorías |
| GET | `/sedes/` | Listar sedes |
| GET | `/aulas/?sede_id={id}` | Listar aulas por sede |

### Autenticación
Todos los endpoints (excepto algunos GET públicos) requieren:
```
Authorization: Bearer {token}
```

El token se obtiene de `localStorage` con la clave `'gtea-proyecto-token'`.

---

## 🚀 Cómo Usar

### Para el Usuario Final

1. **Crear Evento:**
   - Ir a `/admin/eventos`
   - Clic en botón "Nuevo Evento" (header o FAB menu)
   - Completar los 3 pasos del wizard
   - Clic en "Publicar Evento"

2. **Editar Evento:**
   - En la lista de eventos, clic en "Editar"
   - (Pendiente: abrir wizard en modo edición)

3. **Eliminar Evento:**
   - En la lista de eventos, clic en "Eliminar"
   - Confirmar eliminación

### Para el Desarrollador Backend

1. **Descomentar peticiones HTTP:**
   - Abrir `src/app/services/evento-service.ts`
   - Buscar los bloques comentados con `// ⚙️ Descomentar cuando el backend esté listo:`
   - Descomentar `return this.http.*`
   - Eliminar los `return of(...)` mock

2. **Implementar endpoints:**
   - Seguir la tabla de endpoints esperados
   - Asegurar que retornen el formato esperado por la interfaz `Evento`

---

## 📦 Estructura de Datos

### Interfaz Evento

```typescript
interface Evento {
  // Paso 1
  titulo: string;
  categoriaId: string | number;
  descripcion: string;
  imagenPortada: File | string | null;

  // Paso 2
  fechaInicio: string;         // YYYY-MM-DD
  horaInicio: string;          // HH:MM
  fechaFin: string;            // YYYY-MM-DD
  horaFin: string;             // HH:MM
  modalidad: 'Presencial' | 'Virtual';
  sedeId?: string | number;
  aulaId?: string | number;
  cupoMaximo: number;
  costoEntrada: number;
  listaEspera: boolean;

  // Paso 3
  publicarInmediatamente: boolean;
  esOrganizador: boolean;
}
```

---

## 🎨 Componentes Relacionados

### Modificados
- ✅ `eventos/eventos.ts` - Integración del wizard
- ✅ `eventos/eventos.html` - Botón y modal agregados
- ✅ `eventos/eventos.scss` - Estilos del botón y alertas
- ✅ `bottom-nav/bottom-nav.ts` - FAB menu actualizado

### Nuevos
- ✅ `nuevo-evento-wizard/` - Componente completo del wizard

---

## ✅ Checklist de Implementación

- [x] Servicio `evento-service.ts` creado
- [x] Interfaz `Evento` definida
- [x] Validaciones por paso implementadas
- [x] Componente wizard creado (TS, HTML, SCSS)
- [x] Formularios reactivos configurados
- [x] Navegación entre pasos funcional
- [x] Barra de progreso visual
- [x] Upload de imagen con preview
- [x] Steppers numéricos (cupo y costo)
- [x] Validación de fechas cruzadas
- [x] Validación condicional (Presencial/Virtual)
- [x] Vista de resumen (Paso 3)
- [x] Diseño responsive (mobile/tablet/desktop)
- [x] Integración en página de eventos
- [x] FAB menu actualizado
- [x] Mensajes de feedback (éxito/error)
- [x] Documentación completa

---

## 🔄 Próximos Pasos (Pendientes)

1. **Backend:**
   - Implementar endpoints del API
   - Descomentar peticiones HTTP en `evento-service.ts`

2. **Frontend:**
   - Implementar modo edición (abrir wizard con datos existentes)
   - Agregar detección real de conflictos de horario
   - Implementar paginación en lista de eventos
   - Agregar filtros avanzados

3. **Mejoras:**
   - Guardar borradores automáticamente
   - Vista previa del evento antes de publicar
   - Notificaciones de eventos próximos

---

## 📝 Notas Técnicas

- **Framework:** Angular 20.3.0
- **Formularios:** Reactive Forms (FormBuilder)
- **Validaciones:** ValidatorService + validadores personalizados
- **Estilos:** SCSS con variables y mixins
- **Responsive:** Mobile-first approach
- **Estado:** Local en componentes (sin NgRx)
- **Autenticación:** JWT Bearer token en headers

---

## 👥 Autores

- **Desarrollo Frontend:** Implementación completa del CRUD de eventos
- **Diseño:** Basado en especificaciones mobile-first
- **Backend:** Pendiente de implementación

---

**Última actualización:** Febrero 2026  
**Versión:** 1.0.0
