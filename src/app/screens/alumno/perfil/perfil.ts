// alumno-perfil.component.ts
import { Component, OnInit, inject, signal, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TopNavbar } from '../../../partials/top-navbar/top-navbar';
import { BottomNav } from '../../../partials/bottom-nav/bottom-nav';
import { PerfilService } from '../../../services/perfil.service';

// ⛔ IMPORT ANTIGUO — quítalo si usas la interfaz local
// import { PerfilAlumno } from '../../../models/perfil-alumno.model';

@Component({
  selector: 'app-alumno-perfil',
  standalone: true,
  imports: [CommonModule, TopNavbar, BottomNav],
  templateUrl: './perfil.html',
  styleUrl: './perfil.scss',
})
export class Perfil implements OnInit {
  perfil = signal<PerfilAlumno | null>(null);
  isLoading = signal<boolean>(true);

  private PerfilService = inject(PerfilService);
  private cdr = inject(ChangeDetectorRef);

  ngOnInit(): void {
    this.PerfilService.getPerfilAlumno().subscribe({
      next: (data) => {
        console.log('PERFIL RAW:', data);

        this.perfil.set({
          id: data.id,
          nombre: data.nombre,
          apellidos: data.apellidos,
          correo: data.correo,
          avatarUrl: data.avatarUrl ?? null,
        });

        this.isLoading.set(false);
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error cargando perfil:', err);
        this.isLoading.set(false);
      },
    });
  }

  get nombreCompleto(): string {
    const p = this.perfil();
    return p ? `${p.nombre} ${p.apellidos}` : '';
  }
}

// ─────────────────────────────────────────────
// Interfaz local del perfil (en el mismo archivo)
// ─────────────────────────────────────────────
interface PerfilAlumno {
  id: number;        // matrícula o id interno 
  nombre: string;    // "Juan Manuel"
  apellidos: string; // "Pérez Sánchez"
  correo: string;    // institucional
  avatarUrl?: string | null;
}
