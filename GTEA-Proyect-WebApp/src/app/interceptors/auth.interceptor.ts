import { HttpInterceptorFn } from '@angular/common/http';

/**
 * Rutas públicas donde no debe enviarse token: login y alta de usuario.
 * Si se envía un token caducado/inválido, muchos backends responden 401 aunque
 * el endpoint permita registro anónimo.
 */
function shouldSkipAuthHeader(req: { url: string; method: string }): boolean {
    if (req.method !== 'POST') {
        return false;
    }
    const url = req.url;
    if (url.includes('/auth/login/')) {
        return true;
    }
    return (
        url.includes('/alumnos/detail/') ||
        url.includes('/organizadores/detail/') ||
        url.includes('/admins/detail/')
    );
}

/**
 * Interceptor funcional que inyecta automáticamente el token
 * en peticiones HTTP salientes (misma clave que FacadeService).
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
    const token = typeof window !== 'undefined' && window.localStorage ? localStorage.getItem('gtea-proyecto-token') || '' : '';

    if (!token || shouldSkipAuthHeader(req)) {
        return next(req);
    }

    const clonedReq = req.clone({
        setHeaders: {
            Authorization: `Token ${token}`,
        },
    });
    return next(clonedReq);
};