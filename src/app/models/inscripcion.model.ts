// ─────────────────────────────────────────────
// Interfaz de respuesta del endpoint de inscripción
// ─────────────────────────────────────────────
export interface RespuestaInscripcion {
    success: boolean;
    mensaje: string;
    posicionListaEspera: number | null;
}

// ─────────────────────────────────────────────
// Tipos para el sistema de Toast (notificaciones)
// ─────────────────────────────────────────────
export type ToastType = 'success' | 'error' | 'warning';

export interface ToastMessage {
    id: number;
    mensaje: string;
    tipo: ToastType;
}
