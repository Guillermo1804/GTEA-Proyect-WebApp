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
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

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

  private async loadImageAsDataUrl(url: string): Promise<string> {
    const response = await fetch(url, { cache: 'no-cache' });
    const blob = await response.blob();
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string | null;
        if (result) {
          resolve(result);
        } else {
          reject(new Error('No se pudo leer el logo como DataURL'));
        }
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  async exportarPDF(): Promise<void> {
    const doc = new jsPDF({ orientation: 'p', unit: 'pt', format: 'a4' });
    const fecha = new Date();

    // Logo en esquina superior derecha
    const logoUrl = 'assets/LogoGTEA.png';
    try {
      const logoDataUrl = await this.loadImageAsDataUrl(logoUrl);
      const pageWidth = doc.internal.pageSize.getWidth();
      const logoWidth = 120;
      const logoProps = doc.getImageProperties(logoDataUrl);
      const logoHeight = (logoProps.height / logoProps.width) * logoWidth;
      const logoX = pageWidth - logoWidth - 40;
      const logoY = 20;
      doc.addImage(logoDataUrl, 'PNG', logoX, logoY, logoWidth, logoHeight);
    } catch (error) {
      console.warn('Error cargando el logo de GTEA para PDF:', error);
    }

    // Encabezado
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.text('Reporte de Usuarios', 40, 55);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.text(`Generado: ${fecha.toLocaleString()}`, 40, 70);
    doc.text(`Filtro: ${this.activeFilter}`, 40, 85);

    // Datos a exportar (usar datos filtrados)
    const datos = this.filteredUsers.map(user => ({
      nombre: user.name,
      email: user.email,
      rol: user.role,
      estatus: user.status
    }));

    const totalRegistros = datos.length;
    doc.text(`Total de usuarios: ${totalRegistros}`, 40, 100);

    const head = [['Nombre', 'Email', 'Rol', 'Estatus']];

    const body = datos.map((r: any) => [
      r.nombre,
      r.email,
      r.rol,
      r.estatus
    ]);

    autoTable(doc, {
      head,
      body,
      startY: 160,
      styles: {
        font: 'helvetica',
        fontSize: 10,
        cellPadding: 8,
        lineColor: [229, 231, 235],
        lineWidth: 0.5
      },
      headStyles: {
        fillColor: [19, 70, 236],
        textColor: [255, 255, 255],
        fontStyle: 'bold'
      },
      bodyStyles: {
        textColor: [15, 23, 42]
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252]
      },
      columnStyles: {
        0: { cellWidth: 150 },
        1: { cellWidth: 200 },
        2: { halign: 'center', cellWidth: 80 },
        3: { halign: 'center', cellWidth: 100 }
      },
      didDrawPage: () => {
        const pageSize = doc.internal.pageSize as any;
        const pageHeight = pageSize.height ?? pageSize.getHeight?.() ?? 842;
        const pageWidth = pageSize.width ?? pageSize.getWidth?.() ?? 595;
        const page = doc.getNumberOfPages();
        doc.setFontSize(9);
        doc.setTextColor(107, 114, 128);
        doc.text(`Página ${page}`, pageWidth - 60, pageHeight - 20);
      }
    });

    const stamp = fecha.toISOString().slice(0, 19).replace(/[:T]/g, '-');
    doc.save(`usuarios-${stamp}.pdf`);
  }

  exportarExcel(): void {
    const datos = this.filteredUsers.map(user => ({
      Nombre: user.name,
      Email: user.email,
      Rol: user.role,
      Estatus: user.status
    }));

    const ws = XLSX.utils.json_to_sheet(datos);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Usuarios');
    const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
    XLSX.writeFile(wb, `usuarios-${stamp}.xlsx`);
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
