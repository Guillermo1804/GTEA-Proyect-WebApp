import { Component, Output, EventEmitter, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SedeService } from '../../../../services/sede.service';

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
export class NuevaAulaModal implements OnInit {
  @Output() close = new EventEmitter<void>();

  constructor(private sedeService: SedeService) { }

  selectedSede = '';
  className = '';
  capacity = 40;
  notes = '';
  piso = 1;

  equipmentList: Equipment[] = [
    { name: 'Proyector', icon: 'videocam', enabled: true },
    { name: 'Sistema de Audio', icon: 'volume_up', enabled: false },
    { name: 'Pizarra Digital', icon: 'tv', enabled: true },
    { name: 'Aire Acondicionado', icon: 'ac_unit', enabled: false },
    { name: 'Acceso Discapacidad', icon: 'accessible', enabled: true },
  ];

  sedes: any[] = [];

  ngOnInit(): void {
    this.sedeService.obtenerSedes().subscribe({
      next: (data: any) => this.sedes = data || [],
      error: (err: any) => console.error('Error cargando sedes:', err),
    });
  }

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
    if (!this.className.trim() || !this.selectedSede) return;
    const data = {
      sedeId: Number(this.selectedSede),
      nombre: this.className,
      capacidad: this.capacity,
      piso: this.piso,
      tipo: 'Aula',
    };
    this.sedeService.crearAula(data).subscribe({
      next: () => this.close.emit(),
      error: (err: any) => console.error('Error creando aula:', err),
    });
  }
}
