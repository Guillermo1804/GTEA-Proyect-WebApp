import { Component, OnInit } from '@angular/core';
import { TopNavbar } from '../../../partials/top-navbar/top-navbar';
import { BottomNav } from '../../../partials/bottom-nav/bottom-nav';
import { NuevaAulaModal } from '../sedes/nueva-aula-modal/nueva-aula-modal';
import { NuevaSedeModal } from '../../../shared/modals/nueva-sede-modal/nueva-sede-modal';
import { NuevaCategoriaModal } from '../../../shared/modals/nueva-categoria-modal/nueva-categoria-modal';
import { NuevoUsuarioModal } from '../../../shared/modals/nuevo-usuario-modal/nuevo-usuario-modal';

interface Category {
  id: number;
  name: string;
  icon: string;
  eventCount: number;
  active: boolean;
  color: string;
}

@Component({
  selector: 'app-admin-categorias',
  imports: [TopNavbar, BottomNav, NuevaAulaModal, NuevaSedeModal, NuevaCategoriaModal, NuevoUsuarioModal],
  templateUrl: './categorias.html',
  styleUrl: './categorias.scss',
})
export class Categorias implements OnInit {
  readonly form: any;
  errorMessage: string = '';
  successMessage: string = '';
  ngOnInit(): void {

  }
  activeModal: 'nueva-aula' | 'nueva-sede' | 'nueva-categoria' | 'nuevo-usuario' | null = null;

  categories: Category[] = [
    { id: 1, name: 'Talleres', icon: 'build', eventCount: 45, active: true, color: '#1e3fae' },
    { id: 2, name: 'Conferencias', icon: 'mic', eventCount: 30, active: true, color: '#7c3aed' },
    { id: 3, name: 'Seminarios', icon: 'school', eventCount: 25, active: true, color: '#f97316' },
    { id: 4, name: 'Deportes', icon: 'fitness_center', eventCount: 12, active: false, color: '#059669' },
    { id: 5, name: 'Culturales', icon: 'palette', eventCount: 18, active: true, color: '#e11d48' },
    { id: 6, name: 'Académicos', icon: 'menu_book', eventCount: 22, active: true, color: '#0891b2' },
  ];

  toggleCategory(cat: Category): void { cat.active = !cat.active; }
  editCategory(cat: Category): void { /* TODO */ }
  deleteCategory(cat: Category): void { /* TODO */ }

  addCategory(): void { this.activeModal = 'nueva-categoria'; }
  onFabAction(action: string): void { this.activeModal = action as any; }
  closeModal(): void { this.activeModal = null; }
}
