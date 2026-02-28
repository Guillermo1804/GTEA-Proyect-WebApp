import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { TopNavbar } from '../../partials/top-navbar/top-navbar';

interface EventCard {
  image: string;
  category: string;
  categoryColor: string;
  title: string;
  date: string;
  enrolled: number;
  capacity: number;
}

interface Benefit {
  icon: string;
  title: string;
  description: string;
}

@Component({
  selector: 'app-landing-screen',
  imports: [TopNavbar],
  templateUrl: './landing-screen.component.html',
  styleUrl: './landing-screen.component.scss'
})
export class LandingScreenComponent implements OnInit {
  readonly form: any;
  errorMessage: string = '';
  successMessage: string = '';
  ngOnInit(): void {

  }
  events: EventCard[] = [
    {
      image: '', category: 'Ingeniería', categoryColor: '#1e40af',
      title: 'Taller de Robótica', date: '12 Oct • 10:00 AM',
      enrolled: 28, capacity: 40
    },
    {
      image: '', category: 'Artes', categoryColor: '#7c3aed',
      title: 'Seminario de Diseño', date: '15 Oct • 14:00 PM',
      enrolled: 35, capacity: 50
    },
    {
      image: '', category: 'Ciencias', categoryColor: '#059669',
      title: 'Conferencia AI', date: '20 Oct • 09:00 AM',
      enrolled: 180, capacity: 200
    },
  ];

  benefits: Benefit[] = [
    {
      icon: 'app_registration',
      title: 'Registro Fácil',
      description: 'Inscríbete a tus talleres favoritos con un solo clic usando tu cuenta institucional.'
    },
    {
      icon: 'workspace_premium',
      title: 'Certificados Digitales',
      description: 'Recibe constancias con valor curricular automáticamente al finalizar el evento.'
    },
    {
      icon: 'calendar_month',
      title: 'Agenda Personalizada',
      description: 'Organiza tu tiempo y recibe recordatorios antes de cada sesión académica.'
    },
  ];

  constructor(private router: Router) { }

  navigate(path: string): void {
    this.router.navigate([path]);
  }

  getOccupancy(event: EventCard): number {
    return Math.round((event.enrolled / event.capacity) * 100);
  }
}
