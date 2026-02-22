import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { SHARED_IMPORTS } from '../../shared/shared';

interface RoleCard {
  title: string;
  description: string;
  icon: string;
  email: string;
  color: string;
}

@Component({
  selector: 'app-landing-screen',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './landing-screen.component.html',
  styleUrl: './landing-screen.component.scss'
})
export class LandingScreenComponent {
  roles: RoleCard[] = [
    {
      title: 'Alumno',
      description: 'Accede a eventos, gestiona tu perfil y conecta con otros estudiantes.',
      icon: '🎓',
      email: 'usuario@alumno.com',
      color: '#1e3aa9'
    },
    {
      title: 'Organizador',
      description: 'Crea y gestiona eventos académicos para la comunidad.',
      icon: '📋',
      email: 'usuario@organizador.com',
      color: '#0a7a6b'
    },
    {
      title: 'Administrador',
      description: 'Supervisa la plataforma y gestiona todos los usuarios y eventos.',
      icon: '⚙️',
      email: 'usuario@admin.com',
      color: '#7c2d12'
    }
  ];
  constructor(private router: Router) {}

  navigate(path: string): void {
    this.router.navigate([path]);
  }
}
