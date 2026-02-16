import { Routes } from '@angular/router';
import { RegistroScreenComponent } from './screens/registro-screen/registro-screen.component';
import { LoginScreenComponent } from './screens/login-screen/login-screen.component'

export const routes: Routes = [
    {path: 'registro', component: RegistroScreenComponent},
    { path: 'login', component: LoginScreenComponent },
    {path: '', redirectTo: 'registro', pathMatch: 'full'},
];
