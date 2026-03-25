import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
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
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

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
  imports: [FormsModule, CommonModule, TopNavbar, BottomNav, NuevaAulaModal, NuevaSedeModal, NuevaCategoriaModal, NuevoUsuarioModal,EliminarUserModalComponent],
  templateUrl: './usuarios.html',
  styleUrl: './usuarios.scss',
})
export class Usuarios implements OnInit {
  readonly form: any;
  errorMessage: string = '';
  successMessage: string = '';

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
  constructor(
    private adminService: AdminServiceService,
    private alumnoService: AlumnoService,
    private organizadorService: OrganizadorService,
    private cdr: ChangeDetectorRef,
  ) { }

  ngOnInit(): void {
    const storedRole = localStorage.getItem('gtea-proyecto-group_name') || '';

    if (storedRole === 'admin' || storedRole === 'administrador') {
      this.currentRole = 'admin';
    } else if (storedRole === 'organizador') {
      this.currentRole = 'organizador';
    } else {
      this.currentRole = 'alumno';
    }

    console.log('ROL NORMALIZADO:', this.currentRole);
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

    const logoUrl = 'assets/LogoGTEA.png';
    try {
      const logoDataUrl = await this.loadImageAsDataUrl(logoUrl);
      const pageWidth = doc.internal.pageSize.getWidth();
      const logoWidth = 140; // un poco más chico
      const logoProps = doc.getImageProperties(logoDataUrl);
      const logoHeight = (logoProps.height / logoProps.width) * logoWidth;
      const logoX = pageWidth - logoWidth - 20; // hacia la derecha
      const logoY = 15; // bajar un poco
      doc.addImage(logoDataUrl, 'PNG', logoX, logoY, logoWidth, logoHeight);
    } catch (error) {
      console.warn('Error cargando el logo de GTEA para PDF:', error);
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.text('Reporte de Usuarios', 40, 60);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.text(`Generado: ${fecha.toLocaleString()}`, 40, 80);
    doc.text(`Filtro aplicado: ${this.activeFilter}`, 40, 95);

    const datos = this.filteredUsers.map(u => ({
      Nombre: u.name,
      Email: u.email,
      Rol: u.role,
      Estatus: u.status
    }));

    const head = [['Nombre', 'Email', 'Rol', 'Estatus']];
    const body = datos.map(r => [r.Nombre, r.Email, r.Rol, r.Estatus]);

    autoTable(doc, {
      head,
      body,
      startY: 150,
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
      bodyStyles: { textColor: [15, 23, 42] },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      columnStyles: {
        0: { cellWidth: 150 },
        1: { cellWidth: 200 },
        2: { cellWidth: 100, halign: 'center' },
        3: { cellWidth: 90, halign: 'center' }
      }
    });

    const stamp = fecha.toISOString().slice(0, 19).replace(/[:T]/g, '-');
    doc.save(`usuarios-${stamp}.pdf`);
  }

  exportarExcel(): void {
    const datos = this.filteredUsers.map(u => ({
      Nombre: u.name,
      Email: u.email,
      Rol: u.role,
      Estatus: u.status
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

  editUser(user: User): void { /* TODO */ }

deleteUser(user: User): void {
  this.userToDelete = user;
  this.activeModal = 'eliminar-usuario';
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
      this.successMessage = `Usuario ${user.name} eliminado correctamente.`;
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

closeModal(): void {
  this.activeModal = null;
  this.userToDelete = null;
}
}
