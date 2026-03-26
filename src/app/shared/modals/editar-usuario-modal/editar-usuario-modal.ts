import { Component, Input, Output, EventEmitter, OnInit, HostListener, ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AdminServiceService } from '../../../services/admin-service.service';
import { AlumnoService } from '../../../services/alumno-service';
import { OrganizadorService } from '../../../services/organizador-service';
import { ToastService } from '../../../services/tools/toast.service';

@Component({
  selector: 'app-editar-usuario-modal',
  imports: [FormsModule, CommonModule],
  templateUrl: './editar-usuario-modal.html',
  styleUrl: './editar-usuario-modal.scss',
})
export class EditarUsuarioModal implements OnInit {
  @Input() user: any = null;
  @Input() callerRole: 'admin' | 'organizador' | 'alumno' = 'alumno';
  @Output() updated = new EventEmitter<void>();
  @Output() close = new EventEmitter<void>();

  firstName = '';
  lastName = '';
  matricula = '';
  ocupacion = '';
  password = '';
  showPassword = false;

  isSaving = false;
  formError = '';

  constructor(
    private adminService: AdminServiceService,
    private alumnoService: AlumnoService,
    private organizadorService: OrganizadorService,
    private toastService: ToastService,
    private cdr: ChangeDetectorRef,
  ) { }

  ngOnInit(): void {
    if (!this.user) return;

    this.firstName = this.user.first_name || '';
    this.lastName = this.user.last_name || '';

    const extra = this.user.extraFields || {};
    this.matricula = extra.matricula ?? '';
    this.ocupacion = extra.ocupacion ?? '';
  }

  get roleSource(): string {
    return this.user?._roleSource || '';
  }

  get roleLabel(): string {
    switch (this.roleSource) {
      case 'admin': return 'Administrador';
      case 'alumno': return 'Alumno';
      case 'organizador': return 'Organizador';
      default: return '';
    }
  }

  get canChangePassword(): boolean {
    return this.callerRole === 'admin';
  }

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  onCancel(): void {
    this.close.emit();
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.onCancel();
  }

  onSave(): void {
    this.formError = '';

    if (!this.firstName.trim()) {
      this.formError = 'El nombre es obligatorio.';
      return;
    }
    if (!this.lastName.trim()) {
      this.formError = 'El apellido es obligatorio.';
      return;
    }

    this.isSaving = true;

    let request$;
    switch (this.roleSource) {
      case 'admin': {
        // Backend: request.data["id"], first_name, last_name, clave_admin
        const payload: any = {
          first_name: this.firstName.trim(),
          last_name: this.lastName.trim(),
        };
        if (this.password.trim()) {
          payload.password = this.password.trim();
        }
        request$ = this.adminService.actualizarAdmin(this.user.id, payload);
        break;
      }
      case 'alumno': {
        // Backend: request.user (autenticado), nombre, apellidos, matricula, ocupacion
        const payload: any = {
          nombre: this.firstName.trim(),
          apellidos: this.lastName.trim(),
        };
        if (this.matricula.trim()) {
          payload.matricula = this.matricula.trim();
        }
        if (this.ocupacion.trim()) {
          payload.ocupacion = this.ocupacion.trim();
        }
        request$ = this.alumnoService.actualizarAlumno(this.user.id, payload);
        break;
      }
      case 'organizador': {
        // Backend: request.data["id"], first_name, last_name, id_trabajador
        const payload: any = {
          first_name: this.firstName.trim(),
          last_name: this.lastName.trim(),
        };
        if (this.password.trim()) {
          payload.password = this.password.trim();
        }
        request$ = this.organizadorService.actualizarOrganizador(this.user.id, payload);
        break;
      }
      default:
        this.formError = 'Rol de usuario desconocido.';
        this.isSaving = false;
        return;
    }

    request$.subscribe({
      next: () => {
        this.isSaving = false;
        this.cdr.detectChanges();
        setTimeout(() => {
          this.toastService.show('Usuario actualizado correctamente.', 'success');
          this.updated.emit();
          this.close.emit();
        });
      },
      error: (err: any) => {
        this.isSaving = false;
        const msg = err?.error?.message || err?.error?.detail || err?.error?.details || 'Error al actualizar usuario.';
        this.formError = msg;
        this.cdr.detectChanges();
        setTimeout(() => this.toastService.show(msg, 'error'));
      },
    });
  }
}
