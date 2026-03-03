import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'landing' },
  {
    path: 'landing',
    loadComponent: () =>
      import('./screens/landing-screen/landing-screen.component')
        .then(m => m.LandingScreenComponent),
  },
  {
    path: 'login',
    loadComponent: () =>
      import('./screens/login-screen/login-screen.component')
        .then(m => m.LoginScreenComponent),
  },
  {
    path: 'registro',
    loadComponent: () =>
      import('./screens/registro-screen/registro-screen.component')
        .then(m => m.RegistroScreenComponent),
  },
  // ── Admin routes (protegidas) ──
  {
    path: 'admin',
    canActivate: [authGuard],
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./screens/admin/dashboard/dashboard')
            .then(m => m.Dashboard),
      },
      {
        path: 'sedes',
        loadComponent: () =>
          import('./screens/admin/sedes/sedes')
            .then(m => m.Sedes),
      },
      {
        path: 'categorias',
        loadComponent: () =>
          import('./screens/admin/categorias/categorias')
            .then(m => m.Categorias),
      },
      {
        path: 'usuarios',
        loadComponent: () =>
          import('./screens/admin/usuarios/usuarios')
            .then(m => m.Usuarios),
      },
      {
        path: 'eventos',
        loadComponent: () =>
          import('./screens/admin/eventos/eventos')
            .then(m => m.Eventos),
      },
      {
        path: 'eventos/:id',
        loadComponent: () =>
          import('./screens/admin/eventos/evento-detail/evento-detail')
            .then(m => m.EventoDetail),
      },
      {
        path: 'reportes',
        loadComponent: () =>
          import('./screens/admin/reportes/reportes')
            .then(m => m.Reportes),
      },
    ],
  },
  // ── Alumno routes (protegidas) ──
  {
    path: 'alumno',
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'catalogo', pathMatch: 'full' },
      {
        path: 'catalogo',
        loadComponent: () =>
          import('./screens/alumno/catalogo/catalogo.component')
            .then(m => m.CatalogoComponent),
      },
      {
        path: 'evento/:id',
        loadComponent: () =>
          import('./screens/alumno/evento-detalle/evento-detalle.component')
            .then(m => m.EventoDetalleComponent),
      },
    ],
  },
  { path: '**', redirectTo: 'landing' },
];
