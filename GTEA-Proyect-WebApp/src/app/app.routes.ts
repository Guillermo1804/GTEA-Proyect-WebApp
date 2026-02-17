import { Routes } from '@angular/router';

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
  { path: '**', redirectTo: 'landing' },    
];
