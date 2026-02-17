import { Routes } from '@angular/router';

export const routes: Routes = [
{
    path: '',
    loadComponent: () =>
      import('./screens/login-screen/login-screen.component')
        .then(m => m.LoginScreenComponent),
  },
];
