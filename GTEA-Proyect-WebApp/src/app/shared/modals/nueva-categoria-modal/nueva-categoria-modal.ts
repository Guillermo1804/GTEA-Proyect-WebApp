import { Component, Output, EventEmitter, Input, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CategoriaService } from '../../../services/categoria.service';
import { ValidatorService } from '../../../services/tools/validator-service';
import { ErrorsService } from '../../../services/tools/errors-service';

@Component({
    selector: 'app-nueva-categoria-modal',
    imports: [FormsModule],
    templateUrl: './nueva-categoria-modal.html',
    styleUrl: './nueva-categoria-modal.scss',
})
export class NuevaCategoriaModal implements OnInit {
    @Input() categoria: any = null;
    @Output() close = new EventEmitter<void>();

    isEditMode = false;

    constructor(
        private categoriaService: CategoriaService,
        private validatorService: ValidatorService,
        private errorsService: ErrorsService,
        private cdr: ChangeDetectorRef,
    ) { }

    ngOnInit(): void {
        if (this.categoria) {
            this.isEditMode = true;
            this.categoryName = this.categoria.name || this.categoria.nombre || '';
            this.description = this.categoria.description || this.categoria.descripcion || '';
            this.selectedColor = this.categoria.color || '#1e3fae';
            this.selectedIcon = this.categoria.icon || 'school';
        }
    }

    categoryName = '';
    description = '';
    selectedColor = '#1e3fae';
    selectedIcon = 'school';
    submitted = false;
    formError = '';

    colors = [
        '#1e3fae', '#7c3aed', '#059669', '#ea580c',
        '#e11d48', '#0891b2', '#f97316', '#6366f1'
    ];

    icons = [
        { icon: 'school', label: 'Académico' },
        { icon: 'palette', label: 'Cultural' },
        { icon: 'fitness_center', label: 'Deportivo' },
        { icon: 'build', label: 'Taller' },
        { icon: 'mic', label: 'Conferencia' },
        { icon: 'science', label: 'Ciencia' },
        { icon: 'computer', label: 'Tecnología' },
        { icon: 'music_note', label: 'Música' },
    ];

    selectColor(color: string): void { this.selectedColor = color; }
    selectIcon(icon: string): void { this.selectedIcon = icon; }

    onCancel(): void { this.close.emit(); }

    hasError(field: 'categoryName' | 'description'): boolean {
        return this.submitted && this.getFieldError(field).length > 0;
    }

    getFieldError(field: 'categoryName' | 'description'): string {
        if (!this.submitted) return '';

        if (field === 'categoryName') {
            if (!this.validatorService.required(this.categoryName)) return this.errorsService.required;
            if (!this.validatorService.max(this.categoryName.trim(), 120)) return this.errorsService.max(120);
        }

        if (field === 'description' && this.validatorService.required(this.description)) {
            if (!this.validatorService.max(this.description.trim(), 500)) return this.errorsService.max(500);
        }

        return '';
    }

    private parseApiError(err: any): string {
        if (err?.error?.message) return err.error.message;
        if (err?.error?.detail) return err.error.detail;
        if (err?.error && typeof err.error === 'object') {
            const messages = Object.values(err.error).flat().join(' | ');
            if (messages) return messages;
        }
        return this.errorsService.generic;
    }

    private isValidForm(): boolean {
        return !this.getFieldError('categoryName') && !this.getFieldError('description');
    }

    onSave(): void {
        this.submitted = true;
        this.formError = '';
        if (!this.isValidForm()) return;

        const data = {
            nombre: this.categoryName.trim(),
            descripcion: this.description.trim(),
            icon: this.selectedIcon,
            color: this.selectedColor,
            activa: true,
        };

        if (this.isEditMode && this.categoria) {
            this.categoriaService.editarCategoria(this.categoria.id, data).subscribe({
                next: () => this.close.emit(),
                error: (err: any) => {
                    console.error('Error editando categoría:', err);
                    this.formError = this.parseApiError(err);
                    this.cdr.markForCheck();
                },
            });
        } else {
            this.categoriaService.crearCategoria(data).subscribe({
                next: () => this.close.emit(),
                error: (err: any) => {
                    console.error('Error creando categoría:', err);
                    this.formError = this.parseApiError(err);
                    this.cdr.markForCheck();
                },
            });
        }
    }
}
