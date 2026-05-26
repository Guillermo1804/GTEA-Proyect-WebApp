import { Component, OnInit, ChangeDetectorRef, inject } from '@angular/core';
import { TopNavbar } from '../../../partials/top-navbar/top-navbar';
import { BottomNav } from '../../../partials/bottom-nav/bottom-nav';
import { NuevaAulaModal } from '../../../shared/modals/nueva-aula-modal/nueva-aula-modal';
import { NuevaSedeModal } from '../../../shared/modals/nueva-sede-modal/nueva-sede-modal';
import { NuevaCategoriaModal } from '../../../shared/modals/nueva-categoria-modal/nueva-categoria-modal';
import { NuevoUsuarioModal } from '../../../shared/modals/nuevo-usuario-modal/nuevo-usuario-modal';
import { CategoriaService, Categoria } from '../../../services/categoria.service';
import { ToastService } from '../../../services/tools/toast.service';

@Component({
  selector: 'app-admin-categorias',
  imports: [TopNavbar, BottomNav, NuevaAulaModal, NuevaSedeModal, NuevaCategoriaModal, NuevoUsuarioModal],
  templateUrl: './categorias.html',
  styleUrl: './categorias.scss',
})
export class Categorias implements OnInit {
  readonly form: any;
  private toastService = inject(ToastService);

  constructor(private categoriaService: CategoriaService, private cdr: ChangeDetectorRef) { }

  ngOnInit(): void {
    this.loadCategorias();
  }

  activeModal: 'nueva-aula' | 'nueva-sede' | 'nueva-categoria' | 'nuevo-usuario' | null = null;
  editingCategory: any = null;

  categories: any[] = [];

  loadCategorias(): void {
    this.categoriaService.obtenerCategorias().subscribe({
      next: (data) => {
        this.categories = data.map((c: any) => ({
          id: c.id,
          name: c.nombre,
          icon: c.icon || 'category',
          eventCount: 0,
          active: c.activa,
          color: c.color || '#1e3fae',
        }));
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Error cargando categorías:', err);
        this.toastService.show('Error al cargar categorías', 'error');
      },
    });
  }

  toggleCategory(cat: any): void {
    const newState = !cat.active;
    this.categoriaService.editarCategoria(cat.id, { nombre: cat.name, descripcion: '', icon: cat.icon, color: cat.color }).subscribe({
      next: () => { cat.active = newState; },
      error: (err) => console.error('Error toggling categoría:', err),
    });
  }

  editCategory(cat: any): void {
    this.editingCategory = cat;
    this.activeModal = 'nueva-categoria';
  }

  deleteCategory(cat: any): void {
    if (!confirm(`¿Eliminar la categoría "${cat.name}"?`)) return;
    this.categoriaService.eliminarCategoria(cat.id).subscribe({
      next: () => {
        this.toastService.show('Categoría eliminada', 'success');
        this.loadCategorias();
      },
      error: (err) => {
        console.error('Error eliminando categoría:', err);
        this.toastService.show('Error al eliminar', 'error');
      },
    });
  }

  addCategory(): void {
    this.editingCategory = null;
    this.activeModal = 'nueva-categoria';
  }
  onFabAction(action: string): void { this.activeModal = action as any; }
  closeModal(): void {
    this.activeModal = null;
    this.editingCategory = null;
    this.loadCategorias();
  }
}
