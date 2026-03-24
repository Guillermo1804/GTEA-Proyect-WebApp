import { Injectable, signal } from '@angular/core';
import { ToastMessage, ToastType } from '../../models/inscripcion.model';

@Injectable({
    providedIn: 'root',
})
export class ToastService {
    private nextId = 0;

    /** Cola reactiva de toasts activos */
    public toasts = signal<ToastMessage[]>([]);

    /**
     * Muestra un toast no bloqueante.
     * @param mensaje  Texto a mostrar
     * @param tipo     'success' | 'error' | 'warning'
     * @param duracion Milisegundos antes del auto-dismiss (default 4000)
     */
    show(mensaje: string, tipo: ToastType, duracion = 4000): void {
        const id = this.nextId++;
        const toast: ToastMessage = { id, mensaje, tipo };

        this.toasts.update(current => [...current, toast]);

        // Auto-dismiss después de la duración configurada
        setTimeout(() => this.dismiss(id), duracion);
    }

    /** Eliminar un toast por su ID */
    dismiss(id: number): void {
        this.toasts.update(current => current.filter(t => t.id !== id));
    }
}
