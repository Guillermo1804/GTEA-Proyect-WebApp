import { Component, Output, EventEmitter } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CategoriaService } from '../../../services/categoria.service';

@Component({
    selector: 'app-nueva-categoria-modal',
    imports: [FormsModule],
    templateUrl: './nueva-categoria-modal.html',
    styleUrl: './nueva-categoria-modal.scss',
})
export class NuevaCategoriaModal {
    @Output() close = new EventEmitter<void>();

    constructor(private categoriaService: CategoriaService) { }

    categoryName = '';
    description = '';
    selectedColor = '#1e3fae';
    selectedIcon = 'school';

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

    onSave(): void {
        if (!this.categoryName.trim()) return;
        const data = {
            nombre: this.categoryName,
            descripcion: this.description,
            icon: this.selectedIcon,
            color: this.selectedColor,
            activa: true,
        };
        this.categoriaService.crearCategoria(data).subscribe({
            next: () => this.close.emit(),
            error: (err: any) => console.error('Error creando categoría:', err),
        });
    }
}
