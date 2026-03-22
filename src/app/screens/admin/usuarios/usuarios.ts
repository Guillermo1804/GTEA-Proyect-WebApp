import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { TopNavbar } from '../../../partials/top-navbar/top-navbar';
import { BottomNav } from '../../../partials/bottom-nav/bottom-nav';
import { NuevaAulaModal } from '../sedes/nueva-aula-modal/nueva-aula-modal';
import { NuevaSedeModal } from '../../../shared/modals/nueva-sede-modal/nueva-sede-modal';
import { NuevaCategoriaModal } from '../../../shared/modals/nueva-categoria-modal/nueva-categoria-modal';
import { NuevoUsuarioModal } from '../../../shared/modals/nuevo-usuario-modal/nuevo-usuario-modal';
import { AdminServiceService } from '../../../services/admin-service.service';
import { AlumnoService } from '../../../services/alumno-service';
import { OrganizadorService } from '../../../services/organizador-service';

interface User {
  id: number;
  name: string;
  email: string;
  role: 'Admin' | 'Organizador' | 'Alumno';
  roleBadgeClass: string;
  status: 'Activo' | 'Inactivo';
  avatarInitials: string;
  _roleSource: 'admin' | 'alumno' | 'organizador';
}

@Component({
  selector: 'app-admin-usuarios',
  imports: [FormsModule, CommonModule, TopNavbar, BottomNav, NuevaAulaModal, NuevaSedeModal, NuevaCategoriaModal, NuevoUsuarioModal],
  templateUrl: './usuarios.html',
  styleUrl: './usuarios.scss',
})
export class Usuarios implements OnInit {
  readonly form: any;
  errorMessage: string = '';
  successMessage: string = '';

  searchQuery = '';
  activeFilter = 'Todos';
  filters = ['Todos', 'Admin', 'Organizador', 'Alumno'];
  currentPage = 1;
  readonly pageSize = 9;

  activeModal: 'nueva-aula' | 'nueva-sede' | 'nueva-categoria' | 'nuevo-usuario' | null = null;
  users: User[] = [];
  isLoading = true;

  constructor(
    private adminService: AdminServiceService,
    private alumnoService: AlumnoService,
    private organizadorService: OrganizadorService,
    private cdr: ChangeDetectorRef,
  ) { }

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.isLoading = true;
    this.errorMessage = '';
    let pending = 3;
    const allUsers: User[] = [];

    const done = () => {
      pending--;
      if (pending === 0) {
        this.users = allUsers;
        this.ensureCurrentPageValid();
        this.isLoading = false;
        this.cdr.markForCheck();
      }
    };

    // Cargar admins
    this.adminService.obtenerListaAdmins().subscribe({
      next: (data: any[]) => {
        data.forEach((u: any) => {
          allUsers.push(this.mapUser(u, 'Admin', 'role-admin', 'admin'));
        });
        done();
      },
      error: (err) => {
        console.error('Error cargando admins:', err);
        done();
      },
    });

    // Cargar alumnos
    this.alumnoService.obtenerListaAlumnos().subscribe({
      next: (data: any[]) => {
        data.forEach((u: any) => {
          allUsers.push(this.mapUser(u, 'Alumno', 'role-alumno', 'alumno'));
        });
        done();
      },
      error: (err) => {
        console.error('Error cargando alumnos:', err);
        done();
      },
    });

    // Cargar organizadores
    this.organizadorService.obtenerListaOrgs().subscribe({
      next: (data: any[]) => {
        data.forEach((u: any) => {
          allUsers.push(this.mapUser(u, 'Organizador', 'role-organizador', 'organizador'));
        });
        done();
      },
      error: (err) => {
        console.error('Error cargando organizadores:', err);
        done();
      },
    });
  }

  private mapUser(u: any, role: 'Admin' | 'Organizador' | 'Alumno', badgeClass: string, source: 'admin' | 'alumno' | 'organizador'): User {
    const firstName = u.first_name || u.user?.first_name || '';
    const lastName = u.last_name || u.user?.last_name || '';
    const email = u.email || u.user?.email || '';
    const id = u.id || u.user?.id || 0;
    const initials = (firstName.charAt(0) + lastName.charAt(0)).toUpperCase();
    return {
      id,
      name: `${firstName} ${lastName}`,
      email,
      role,
      roleBadgeClass: badgeClass,
      status: 'Activo',
      avatarInitials: initials || '??',
      _roleSource: source,
    };
  }

  get filteredUsers(): User[] {
    let filtered = this.users;
    if (this.activeFilter !== 'Todos') filtered = filtered.filter(u => u.role === this.activeFilter);
    if (this.searchQuery) {
      const q = this.searchQuery.toLowerCase();
      filtered = filtered.filter(u => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q));
    }
    return filtered;
  }

  setFilter(filter: string): void {
    this.activeFilter = filter;
    this.currentPage = 1;
  }

  onSearchChange(value: string): void {
    this.searchQuery = value;
    this.currentPage = 1;
  }

  prevPage(): void { if (this.currentPage > 1) this.currentPage--; }
  nextPage(): void { if (this.currentPage < this.totalPages) this.currentPage++; }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.filteredUsers.length / this.pageSize));
  }

  get paginatedUsers(): User[] {
    const startIndex = (this.currentPage - 1) * this.pageSize;
    return this.filteredUsers.slice(startIndex, startIndex + this.pageSize);
  }

  editUser(user: User): void { /* TODO */ }

  deleteUser(user: User): void {
    if (!confirm(`¿Eliminar a ${user.name}?`)) return;

    let deleteObs;
    switch (user._roleSource) {
      case 'admin':
        deleteObs = this.adminService.eliminarAdmin(user.id);
        break;
      case 'alumno':
        deleteObs = this.alumnoService.eliminarAlumno(user.id);
        break;
      case 'organizador':
        deleteObs = this.organizadorService.eliminarOrg(user.id);
        break;
    }

    deleteObs.subscribe({
      next: () => {
        this.successMessage = `Usuario ${user.name} eliminado correctamente.`;
        this.loadUsers();
      },
      error: (err: any) => {
        console.error('Error eliminando usuario:', err);
        this.errorMessage = err?.error?.message || 'Error al eliminar usuario.';
      },
    });
  }

  isSelf(user: User): boolean {
    if (typeof window === 'undefined' || !window.localStorage) {
      return false;
    }
    const loggedInEmail = localStorage.getItem('gtea-proyecto-email') || '';
    return user.email === loggedInEmail;
  }

  addUser(): void { this.activeModal = 'nuevo-usuario'; }
  onFabAction(action: string): void { this.activeModal = action as any; }
  ensureCurrentPageValid(): void {
    if (this.currentPage > this.totalPages) {
      this.currentPage = this.totalPages;
    }
    if (this.currentPage < 1) {
      this.currentPage = 1;
    }
  }

  closeModal(): void { this.activeModal = null; this.loadUsers(); }
}
