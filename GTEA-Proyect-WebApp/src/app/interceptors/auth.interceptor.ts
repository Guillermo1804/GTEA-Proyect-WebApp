import { HttpInterceptorFn } from '@angular/common/http';

/**
 * Interceptor funcional que inyecta automáticamente el token JWT
 * en todas las peticiones HTTP salientes.
 *
 * Lee el token desde localStorage (clave: 'gtea-proyecto-token',
 * la misma que usa FacadeService).
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
    const token = localStorage.getItem('gtea-proyecto-token') || '';

    if (token) {
        const clonedReq = req.clone({
            setHeaders: {
                Authorization: `Bearer ${token}`,
            },
        });
        return next(clonedReq);
    }

    return next(req);
};
