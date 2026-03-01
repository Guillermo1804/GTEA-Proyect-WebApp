import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TopNavbar } from "../../partials/top-navbar/top-navbar";
import { Footer } from "../../partials/footer/footer";

interface Taller {
  id: number;
  titulo: string;
  descripcion: string;
  categoria: string;
  fecha: string;
  hora: string;
  ubicacion: string;
  imagen: string;
  inscritos: number;
  totalCupos: number;
  disponibilidad: string;
  estado: 'disponible' | 'inscrito' | 'lista-espera' | 'agotado';
}

@Component({
  selector: 'app-alumno-screen',
  imports: [CommonModule, TopNavbar, Footer],
  templateUrl: './alumno-screen.html',
  styleUrl: './alumno-screen.scss',
})
export class AlumnoScreen implements OnInit {
  talleres: Taller[] = [];

  ngOnInit() {
    this.cargarTalleres();
  }

  cargarTalleres() {
    this.talleres = [
      {
        id: 1,
        titulo: 'Introducción a Python para Análisis de Datos',
        descripcion: 'Aprende los fundamentos de Python aplicados al análisis de datos con librerías como Pandas y NumPy.',
        categoria: 'Tecnología',
        fecha: 'Lun 12 Oct',
        hora: '10:00 AM',
        ubicacion: 'Campus Norte, Aula B-204',
        // imagen: 'src/assets/taller2.jpg',
        imagen: 'assets/taller2.jpeg',
        inscritos: 12,
        totalCupos: 25,
        disponibilidad: 'Lugares disponibles',
        estado: 'disponible',
      },
      {
        id: 2,
        titulo: 'Taller de Liderazgo Estratégico',
        descripcion: 'Desarrolla habilidades de liderazgo y aprende estrategias efectivas para gestionar equipos.',
        categoria: 'Desarrollo Profesional',
        fecha: 'Mar 15 Oct',
        hora: '04:00 PM',
        ubicacion: 'Online (Zoom)',
        imagen: 'assets/taller2.jpeg',
        inscritos: 15,
        totalCupos: 20,
        disponibilidad: 'Ya inscrito',
        estado: 'inscrito',
      },
      {
        id: 3,
        titulo: 'Fotografía Digital: Composición',
        descripcion: 'Domina las técnicas de composición fotográfica y aprende a capturar imágenes profesionales.',
        categoria: 'Arte',
        fecha: 'Jun 15 Oct',
        hora: '11:00 AM',
        ubicacion: 'Estudio A, Edificio de Artes',
        imagen: 'assets/taller2.jpeg',
        inscritos: 20,
        totalCupos: 20,
        disponibilidad: 'Cupo lleno',
        estado: 'lista-espera',
      },
      {
        id: 4,
        titulo: 'Robótica Avanzada e IA',
        descripcion: 'Explora la inteligencia artificial y la robótica avanzada con proyectos prácticos.',
        categoria: 'Tecnología',
        fecha: 'Vie 16 Oct',
        hora: '09:00 AM',
        ubicacion: 'Laboratorio de Ingeniería',
        imagen: 'assets/taller2.jpeg',
        inscritos: 30,
        totalCupos: 30,
        disponibilidad: 'Registro cerrado',
        estado: 'agotado',
      },
    ];
  }

  abrirDetalles(taller: Taller) {
    console.log('Abriendo detalles del taller:', taller.titulo);
    // Aquí irá la lógica para abrir un modal o navegar a la página de detalles
  }

  inscribirse(taller: Taller) {
    console.log('Inscribiendo en:', taller.titulo);
    // Aquí irá la lógica para inscribirse en el taller
    // Se conectará con el servicio del admin
  }

  cancelarEspera(taller: Taller) {
    console.log('Acción en lista de espera para:', taller.titulo);
    // Aquí irá la lógica para manejar la lista de espera
  }
}
