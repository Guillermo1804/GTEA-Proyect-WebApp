import { Routes } from '@angular/router';
import { RegistroScreenComponent } from './screens/registro-screen/registro-screen.component';

export const routes: Routes = [
    {path: 'registro', component: RegistroScreenComponent},
    {path: '', redirectTo: 'registro', pathMatch: 'full'},
];
