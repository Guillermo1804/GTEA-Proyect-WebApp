import { Component, OnInit, ChangeDetectorRef, inject, DestroyRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { FacadeService } from '../../../services/facade-service';
import { TopNavbar } from '../../../partials/top-navbar/top-navbar';
import { BottomNav } from '../../../partials/bottom-nav/bottom-nav';
import { NuevaAulaModal } from '../../../shared/modals/nueva-aula-modal/nueva-aula-modal';
import { NuevaSedeModal } from '../../../shared/modals/nueva-sede-modal/nueva-sede-modal';
import { NuevaCategoriaModal } from '../../../shared/modals/nueva-categoria-modal/nueva-categoria-modal';
import { NuevoUsuarioModal } from '../../../shared/modals/nuevo-usuario-modal/nuevo-usuario-modal';
import { AdminServiceService } from '../../../services/admin-service.service';
import { AlumnoService } from '../../../services/alumno-service';
import { OrganizadorService } from '../../../services/organizador-service';
import { EliminarUserModalComponent } from '../../../modals/eliminar-user-modal/eliminar-user-modal.component';
import { EditarUsuarioModal } from '../../../shared/modals/editar-usuario-modal/editar-usuario-modal';
import { ToastService } from '../../../services/tools/toast.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

interface User {
  id: number;
  name: string;
  first_name: string;
  last_name: string;
  email: string;
  role: 'Admin' | 'Organizador' | 'Alumno';
  roleBadgeClass: string;
  status: 'Activo' | 'Inactivo';
  avatarInitials: string;
  _roleSource: 'admin' | 'alumno' | 'organizador';
  extraFields: Record<string, any>;
}

@Component({
  selector: 'app-admin-usuarios',
  imports: [FormsModule, CommonModule, TopNavbar, BottomNav, NuevaAulaModal, NuevaSedeModal, NuevaCategoriaModal, NuevoUsuarioModal, EliminarUserModalComponent, EditarUsuarioModal],
  templateUrl: './usuarios.html',
  styleUrl: './usuarios.scss',
})
export class Usuarios implements OnInit {
  readonly form: any;
  errorMessage: string = '';

  userToDelete: User | null = null;
  searchQuery = '';
  activeFilter = 'Todos';
  filters = ['Todos', 'Admin', 'Organizador', 'Alumno'];
  currentPage = 1;
  readonly pageSize = 9;

  activeModal: 'nueva-aula' | 'nueva-sede' | 'nueva-categoria' | 'nuevo-usuario' | 'eliminar-usuario' | null = null;
  users: User[] = [];
  isLoading = true;
  currentRole: 'admin' | 'organizador' | 'alumno' = 'alumno';
  fixedRole = '';
  userToEdit: User | null = null;

  private destroyRef = inject(DestroyRef);
  private route = inject(ActivatedRoute);

  constructor(
    private adminService: AdminServiceService,
    private alumnoService: AlumnoService,
    private organizadorService: OrganizadorService,
    private cdr: ChangeDetectorRef,
    private router: Router,
    private toastService: ToastService,
    private facadeService: FacadeService,
  ) { }

  ngOnInit(): void {
    const storedRole = this.facadeService.getUserGroup();

    if (storedRole === 'admin' || storedRole === 'administrador') {
      this.currentRole = 'admin';
    } else if (storedRole === 'organizador') {
      this.currentRole = 'organizador';
    } else {
      this.currentRole = 'alumno';
    }

    this.fixedRole = this.currentRole === 'organizador' ? 'Alumno' : '';
    console.log('ROL NORMALIZADO:', this.currentRole);
    this.loadUsers();

    // Manejar apertura automática vía FAB (Sprint S2 v3)
    this.route.queryParams
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(params => {
        if (params['openModal'] === 'nuevo-usuario') {
          this.activeModal = 'nuevo-usuario';
          this.router.navigate([], {
            relativeTo: this.route,
            queryParams: {},
            replaceUrl: true
          });
        }
      });
  }

  loadUsers(): void {
    this.isLoading = true;
    this.errorMessage = '';
    let pending = 3;
    const allUsers: User[] = [];

    const myEmail = this.facadeService.getUserEmail();

    const done = () => {
      pending--;
      if (pending === 0) {
        // Sprint S2: Sort logged-in user at position 0
        allUsers.sort((a, b) =>
          a.email === myEmail ? -1 : b.email === myEmail ? 1 : 0
        );

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
      first_name: firstName,
      last_name: lastName,
      name: `${firstName} ${lastName}`.trim(),
      email,
      role,
      roleBadgeClass: badgeClass,
      status: u.is_active === false ? 'Inactivo' : 'Activo',
      avatarInitials: initials || '??',
      _roleSource: source,
      extraFields: {
        matricula: u.matricula ?? null,
        ocupacion: u.ocupacion ?? null,
        clave_admin: u.clave_admin ?? null,
        id_trabajador: u.id_trabajador ?? null,
      },
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

  editUser(user: User): void {
    this.userToEdit = user;
  }

  /** Admin puede editar a todos; organizador solo a alumnos */
  canEdit(user: User): boolean {
    if (this.currentRole === 'admin') return true;
    if (this.currentRole === 'organizador') return user._roleSource === 'alumno';
    return false;
  }

  onUserUpdated(): void {
    this.toastService.show('Usuario actualizado correctamente.', 'success');
    this.loadUsers();
    this.userToEdit = null;
  }

  closeEditModal(): void {
    this.userToEdit = null;
  }

deleteUser(id: number): void {
  const user = this.users.find(u => u.id === id);
  if (user) {
    this.userToDelete = user;
    this.activeModal = 'eliminar-usuario';
  }
}

confirmDeleteUser(): void {
  if (!this.userToDelete) return;

  const user = this.userToDelete;
  let deleteObs: any;

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
    default:
      return;
  }

  deleteObs.subscribe({
    next: () => {
      this.toastService.show(`Usuario ${user.name} eliminado correctamente.`, 'success');
      this.userToDelete = null;
      this.activeModal = null;
      this.loadUsers();
    },
    error: (err: any) => {
      console.error('Error eliminando usuario:', err);
      this.errorMessage = err?.error?.message || 'Error al eliminar usuario.';
      this.userToDelete = null;
      this.activeModal = null;
    },
  });
}

  isSelf(user: User): boolean {
    return user.email === this.facadeService.getUserEmail();
  }

  onUserCreated(): void {
    this.toastService.show('Usuario creado correctamente', 'success');
    this.loadUsers();
    this.activeModal = null;
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

closeModal(): void {
  this.activeModal = null;
  this.userToDelete = null;
}
}
