import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
  AbstractControl,
  ValidationErrors,
} from '@angular/forms';
import { CommonModule } from '@angular/common';
import { EventoService, Evento } from '../../../../services/evento-service';

// ─────────────────────────────────────────────
// Validador cruzado: fecha/hora de fin > inicio
// ─────────────────────────────────────────────
function fechaFinValidator(group: AbstractControl): ValidationErrors | null {
  const fechaInicio = group.get('fechaInicio')?.value;
  const horaInicio = group.get('horaInicio')?.value;
  const fechaFin = group.get('fechaFin')?.value;
  const horaFin = group.get('horaFin')?.value;

  if (!fechaInicio || !horaFin || !fechaFin || !horaInicio) return null;

  const inicio = new Date(`${fechaInicio}T${horaInicio}`);
  const fin = new Date(`${fechaFin}T${horaFin}`);

  return fin <= inicio ? { fechaFinInvalida: true } : null;
}

@Component({
  selector: 'app-nuevo-evento-wizard',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './nuevo-evento-wizard.html',
  styleUrl: './nuevo-evento-wizard.scss',
})
export class NuevoEventoWizard implements OnInit {
  @Output() close = new EventEmitter<void>();
  @Output() eventoCreado = new EventEmitter<Evento>();

  // ── Estado del wizard ──
  currentStep = 1;
  readonly totalSteps = 3;
  isSubmitting = false;
  errorMessage = '';
  successMessage = '';

  // ── Alerta de conflicto de horario ──
  hasConflict = false;
  conflictMessage = '';

  // ── Datos para selects ──
  categorias: { id: number; nombre: string }[] = [];
  sedes: { id: number; nombre: string }[] = [];
  aulas: { id: number; nombre: string; capacidad: number }[] = [];

  // ── Preview imagen ──
  imagenPreviewUrl: string | null = null;

  // ── Formularios por paso ──
  step1Form!: FormGroup;
  step2Form!: FormGroup;
  step3Form!: FormGroup;

  constructor(
    private fb: FormBuilder,
    private eventoService: EventoService,
  ) {}

  ngOnInit(): void {
    this._buildForms();
    this._cargarCatalogos();
  }

  // ─────────────────────────────────────────────
  // Construcción de formularios reactivos
  // ─────────────────────────────────────────────
  private _buildForms(): void {
    // Paso 1 — Información general
    this.step1Form = this.fb.group({
      titulo: ['', [Validators.required, Validators.maxLength(120)]],
      categoriaId: ['', Validators.required],
      descripcion: ['', [Validators.required, Validators.maxLength(500)]],
      imagenPortada: [null],
    });

    // Paso 2 — Detalles del evento
    this.step2Form = this.fb.group(
      {
        fechaInicio: ['', Validators.required],
        horaInicio: ['', Validators.required],
        fechaFin: ['', Validators.required],
        horaFin: ['', Validators.required],
        modalidad: ['Presencial', Validators.required],
        sedeId: [''],
        aulaId: [''],
        cupoMaximo: [30, [Validators.required, Validators.min(1)]],
        costoEntrada: [0, [Validators.required, Validators.min(0)]],
        listaEspera: [false],
      },
      { validators: fechaFinValidator },
    );

    // Aplicar validadores condicionales al cambiar modalidad
    this.step2Form.get('modalidad')?.valueChanges.subscribe((modalidad) => {
      this._togglePresencialValidators(modalidad);
    });

    // Cargar aulas cuando cambia sede
    this.step2Form.get('sedeId')?.valueChanges.subscribe((sedeId) => {
      if (sedeId) {
        this.step2Form.get('aulaId')?.setValue('');
        this.eventoService.obtenerAulasPorSede(sedeId).subscribe({
          next: (data) => (this.aulas = data),
        });
      }
    });

    // Paso 3 — Publicación (solo opciones booleanas)
    this.step3Form = this.fb.group({
      publicarInmediatamente: [true],
      esOrganizador: [true],
    });
  }

  // ─────────────────────────────────────────────
  // Carga de catálogos (categorías y sedes)
  // ─────────────────────────────────────────────
  private _cargarCatalogos(): void {
    this.eventoService.obtenerCategorias().subscribe({
      next: (data) => (this.categorias = data),
      error: (err) => console.error('[Wizard] Error categorías:', err),
    });

    this.eventoService.obtenerSedes().subscribe({
      next: (data) => (this.sedes = data),
      error: (err) => console.error('[Wizard] Error sedes:', err),
    });
  }

  // ─────────────────────────────────────────────
  // Validadores condicionales según modalidad
  // ─────────────────────────────────────────────
  private _togglePresencialValidators(modalidad: string): void {
    const sedeCtrl = this.step2Form.get('sedeId');
    const aulaCtrl = this.step2Form.get('aulaId');

    if (modalidad === 'Presencial') {
      sedeCtrl?.setValidators(Validators.required);
      aulaCtrl?.setValidators(Validators.required);
    } else {
      sedeCtrl?.clearValidators();
      aulaCtrl?.clearValidators();
      sedeCtrl?.setValue('');
      aulaCtrl?.setValue('');
    }
    sedeCtrl?.updateValueAndValidity();
    aulaCtrl?.updateValueAndValidity();
  }

  // ─────────────────────────────────────────────
  // Navegación entre pasos
  // ─────────────────────────────────────────────
  get currentForm(): FormGroup {
    if (this.currentStep === 1) return this.step1Form;
    if (this.currentStep === 2) return this.step2Form;
    return this.step3Form;
  }

  goNext(): void {
    this.currentForm.markAllAsTouched();
    if (this.currentForm.invalid) return;
    if (this.currentStep < this.totalSteps) this.currentStep++;
  }

  goPrev(): void {
    if (this.currentStep > 1) this.currentStep--;
  }

  // ─────────────────────────────────────────────
  // Paso de imagen (upload preview)
  // ─────────────────────────────────────────────
  onImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    // Validar tipo y tamaño (PNG/JPG, max 5MB)
    const validTypes = ['image/png', 'image/jpeg'];
    if (!validTypes.includes(file.type)) {
      this.errorMessage = 'Solo se aceptan imágenes PNG o JPG';
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      this.errorMessage = 'La imagen no debe superar 5MB';
      return;
    }

    this.errorMessage = '';
    this.step1Form.get('imagenPortada')?.setValue(file);

    // Generar preview
    const reader = new FileReader();
    reader.onload = (e) => (this.imagenPreviewUrl = e.target?.result as string);
    reader.readAsDataURL(file);
  }

  removeImage(): void {
    this.imagenPreviewUrl = null;
    this.step1Form.get('imagenPortada')?.setValue(null);
  }

  // ─────────────────────────────────────────────
  // Getters para los valores del resumen (Paso 3)
  // ─────────────────────────────────────────────
  get resumenTitulo(): string {
    return this.step1Form.get('titulo')?.value || '—';
  }

  get resumenCategoria(): string {
    const id = this.step1Form.get('categoriaId')?.value;
    return this.categorias.find((c) => String(c.id) === String(id))?.nombre || '—';
  }

  get resumenDescripcion(): string {
    return this.step1Form.get('descripcion')?.value || '—';
  }

  get resumenFechaInicio(): string {
    const f = this.step2Form.get('fechaInicio')?.value;
    const h = this.step2Form.get('horaInicio')?.value;
    return f && h ? `${f} · ${h}` : '—';
  }

  get resumenFechaFin(): string {
    const f = this.step2Form.get('fechaFin')?.value;
    const h = this.step2Form.get('horaFin')?.value;
    return f && h ? `${f} · ${h}` : '—';
  }

  get resumenModalidad(): string {
    return this.step2Form.get('modalidad')?.value || '—';
  }

  get resumenSede(): string {
    const id = this.step2Form.get('sedeId')?.value;
    if (!id) return 'Virtual';
    return this.sedes.find((s) => String(s.id) === String(id))?.nombre || '—';
  }

  get resumenAula(): string {
    const id = this.step2Form.get('aulaId')?.value;
    if (!id) return '—';
    return this.aulas.find((a) => String(a.id) === String(id))?.nombre || '—';
  }

  get resumenCupo(): number {
    return this.step2Form.get('cupoMaximo')?.value || 0;
  }

  get resumenCosto(): number {
    return this.step2Form.get('costoEntrada')?.value || 0;
  }

  // ─────────────────────────────────────────────
  // Steppers numéricos (cupo y costo)
  // ─────────────────────────────────────────────
  incrementCupo(): void {
    const ctrl = this.step2Form.get('cupoMaximo');
    ctrl?.setValue((ctrl.value || 0) + 1);
  }

  decrementCupo(): void {
    const ctrl = this.step2Form.get('cupoMaximo');
    if ((ctrl?.value || 0) > 1) ctrl?.setValue(ctrl.value - 1);
  }

  incrementCosto(): void {
    const ctrl = this.step2Form.get('costoEntrada');
    ctrl?.setValue(Math.round(((ctrl.value || 0) + 50) * 100) / 100);
  }

  decrementCosto(): void {
    const ctrl = this.step2Form.get('costoEntrada');
    if ((ctrl?.value || 0) >= 50) ctrl?.setValue(ctrl.value - 50);
  }

  // ─────────────────────────────────────────────
  // Helpers de validación para el template
  // ─────────────────────────────────────────────
  isFieldInvalid(form: FormGroup, field: string): boolean {
    const ctrl = form.get(field);
    return !!(ctrl && ctrl.invalid && ctrl.touched);
  }

  getFieldError(form: FormGroup, field: string): string {
    const ctrl = form.get(field);
    if (!ctrl || !ctrl.errors || !ctrl.touched) return '';
    if (ctrl.errors['required']) return 'Campo requerido';
    if (ctrl.errors['maxlength']) return `Máximo ${ctrl.errors['maxlength'].requiredLength} caracteres`;
    if (ctrl.errors['min']) return `El valor mínimo es ${ctrl.errors['min'].min}`;
    return 'Valor inválido';
  }

  get isFechaFinInvalida(): boolean {
    return !!(
      this.step2Form.errors?.['fechaFinInvalida'] &&
      this.step2Form.get('fechaFin')?.touched &&
      this.step2Form.get('horaFin')?.touched
    );
  }

  // ─────────────────────────────────────────────
  // Envío del formulario
  // ─────────────────────────────────────────────
  onSubmit(): void {
    this.step3Form.markAllAsTouched();
    if (this.step1Form.invalid || this.step2Form.invalid) {
      this.errorMessage = 'Por favor completa todos los pasos correctamente.';
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = '';
    this.successMessage = '';

    const payload: Evento = {
      ...this.step1Form.value,
      ...this.step2Form.value,
      ...this.step3Form.value,
    };

    this.eventoService.crearEvento(payload).subscribe({
      next: (response) => {
        this.isSubmitting = false;
        this.successMessage = '¡Evento creado exitosamente!';
        this.eventoCreado.emit(payload);
        setTimeout(() => this.onClose(), 1500);
      },
      error: (err) => {
        this.isSubmitting = false;
        this.errorMessage =
          err?.error?.message || err?.error?.detail || 'Error al crear el evento. Intenta de nuevo.';
      },
    });
  }

  onClose(): void {
    this.close.emit();
  }
}
