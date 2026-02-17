import { Routes } from '@angular/router';
import { RegistroScreenComponent } from './screens/registro-screen/registro-screen.component';
import { LoginScreenComponent } from './screens/login-screen/login-screen.component'

export const routes: Routes = [
  { path: 'registro', component: RegistroScreenComponent },
  { path: 'login', component: LoginScreenComponent },
  {
    path: '',
    loadComponent: () =>
      import('./screens/login-screen/login-screen.component')
        .then(m => m.LoginScreenComponent),
  },
];
