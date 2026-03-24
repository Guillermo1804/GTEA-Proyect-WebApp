import { CanActivateFn, Router } from '@angular/router';
import { inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

/**
 * Guard MVP para prevenir manipulación de URL.
 *
 * Lee 'userRole' de localStorage y compara con el segmento
 * de ruta esperado. Si no coincide, redirige a /login.
 */
export const authGuard: CanActivateFn = (route, state) => {
    const router = inject(Router);
    const platformId = inject(PLATFORM_ID);

    // Evitar errores en SSR (localStorage no disponible)
    if (!isPlatformBrowser(platformId)) {
        return true; 
    }

    const userRole = localStorage.getItem('gtea-proyecto-group_name') || '';

    // Extraer el primer segmento de la URL (e.g., 'admin', 'alumno', 'organizador')
    const firstSegment = state.url.split('/')[1] || '';

    // Mapeo de segmento de ruta → rol esperado en localStorage
    const routeToRole: Record<string, string> = {
        'admin': 'administrador',
        'alumno': 'alumno',
        'organizador': 'organizador',
    };

    const expectedRole = routeToRole[firstSegment] || '';

    if (!userRole) {
        router.navigate(['/login']);
        return false;
    }

    const canAccess =
        userRole === expectedRole ||
        (userRole === 'organizador' && expectedRole === 'administrador');

    if (!canAccess) {
        const roleToHome: Record<string, string> = {
            'administrador': '/admin/dashboard',
            'organizador':   '/admin/dashboard',
            'alumno':        '/alumno/catalogo',
        };
        router.navigate([roleToHome[userRole] || '/login']);
        return false;
    }

    return true;
};
