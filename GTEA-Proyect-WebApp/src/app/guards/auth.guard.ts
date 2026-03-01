import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';

/**
 * Guard MVP para prevenir manipulación de URL.
 *
 * Lee 'userRole' de localStorage y compara con el segmento
 * de ruta esperado. Si no coincide, redirige a /login.
 *
 * Mapeo de rutas:
 *   /admin        → userRole === 'administrador'
 *   /alumno       → userRole === 'alumno'
 *   /organizador  → userRole === 'organizador'
 */
export const authGuard: CanActivateFn = (route, state) => {
    const router = inject(Router);
    const userRole = localStorage.getItem('userRole') || '';

    // Extraer el primer segmento de la URL (e.g., 'admin', 'alumno', 'organizador')
    const firstSegment = state.url.split('/')[1] || '';

    // Mapeo de segmento de ruta → rol esperado en localStorage
    const routeToRole: Record<string, string> = {
        'admin': 'administrador',
        'alumno': 'alumno',
        'organizador': 'organizador',
    };

    const expectedRole = routeToRole[firstSegment] || '';

    if (!userRole || userRole !== expectedRole) {
        router.navigate(['/login']);
        return false;
    }

    return true;
};
