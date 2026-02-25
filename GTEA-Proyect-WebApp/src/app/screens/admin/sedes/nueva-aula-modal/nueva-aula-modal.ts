import { Component, Output, EventEmitter } from '@angular/core';
import { FormsModule } from '@angular/forms';

interface Equipment {
  name: string;
  icon: string;
  enabled: boolean;
}

@Component({
  selector: 'app-nueva-aula-modal',
  imports: [FormsModule],
  templateUrl: './nueva-aula-modal.html',
  styleUrl: './nueva-aula-modal.scss',
})
export class NuevaAulaModal {
  @Output() close = new EventEmitter<void>();

  selectedSede = '';
  className = '';
  capacity = 40;
  notes = '';

  equipmentList: Equipment[] = [
    { name: 'Proyector', icon: 'videocam', enabled: true },
    { name: 'Sistema de Audio', icon: 'volume_up', enabled: false },
    { name: 'Pizarra Digital', icon: 'tv', enabled: true },
    { name: 'Aire Acondicionado', icon: 'ac_unit', enabled: false },
    { name: 'Acceso Discapacidad', icon: 'accessible', enabled: true },
  ];

  sedes = ['Edificio A - Ingeniería', 'Edificio B - Ciencias', 'Edificio C - Humanidades', 'Edificio D - Deportes'];

  incrementCapacity(): void {
    this.capacity++;
  }

  decrementCapacity(): void {
    if (this.capacity > 1) this.capacity--;
  }

  toggleEquipment(item: Equipment): void {
    item.enabled = !item.enabled;
  }

  onCancel(): void {
    this.close.emit();
  }

  onSave(): void {
    // TODO: save classroom via API
    this.close.emit();
  }
}
