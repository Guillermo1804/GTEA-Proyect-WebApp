import { Component, OnInit, ChangeDetectorRef, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TopNavbar } from '../../../partials/top-navbar/top-navbar';
import { BottomNav } from '../../../partials/bottom-nav/bottom-nav';
import { BackHeader } from '../../../partials/back-header/back-header';
import { NuevaAulaModal } from '../../../shared/modals/nueva-aula-modal/nueva-aula-modal';
import { NuevaSedeModal } from '../../../shared/modals/nueva-sede-modal/nueva-sede-modal';
import { NuevaCategoriaModal } from '../../../shared/modals/nueva-categoria-modal/nueva-categoria-modal';
import { NuevoUsuarioModal } from '../../../shared/modals/nuevo-usuario-modal/nuevo-usuario-modal';
import { FiltrosSedesModal } from '../../../shared/modals/filtros-sedes-modal/filtros-sedes-modal.component';
import { SedeService, Sede, Aula } from '../../../services/sede.service';
import { ToastService } from '../../../services/tools/toast.service';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

interface Classroom {
  id: number;
  name: string;
  capacity: number;
  status: string;
}

interface Venue {
  id: number;
  name: string;
  icon: string;
  classroomCount: number;
  totalCapacity: number;
  expanded: boolean;
  classrooms: Classroom[];
}

interface FiltrosSedes {
  estadoAula: string[];
  capacidadMin: number | null;
  capacidadMax: number | null;
  busqueda: string;
}

@Component({
  selector: 'app-admin-sedes',
  imports: [TopNavbar, BottomNav, NuevaAulaModal, NuevaSedeModal, NuevaCategoriaModal, NuevoUsuarioModal, FiltrosSedesModal, FormsModule],
  templateUrl: './sedes.html',
  styleUrl: './sedes.scss',
})
export class Sedes implements OnInit {
  readonly form: any;
  isLoading = true;
  private toastService = inject(ToastService);

  constructor(private sedeService: SedeService, private cdr: ChangeDetectorRef) { }

  ngOnInit(): void {
    this.venuesFiltrados = [];
    this.loadSedes();
  }

  onFiltrosAplicados(filtros: FiltrosSedes): void {
    this.filtros = filtros;
    this.aplicarFiltros();
  }

  activeModal: 'nueva-aula' | 'nueva-sede' | 'nueva-categoria' | 'nuevo-usuario' | 'filtros' | null = null;

  venues: Venue[] = [];
  venuesFiltrados: Venue[] = [];
  filtros: FiltrosSedes = {
    estadoAula: [],
    capacidadMin: null,
    capacidadMax: null,
    busqueda: ''
  };

  loadSedes(): void {
    this.sedeService.obtenerSedes().subscribe({
      next: (sedes) => {
        this.venues = sedes.map((s: any) => ({
          id: s.id,
          name: s.nombre,
          icon: 'business',
          classroomCount: 0,
          totalCapacity: 0,
          expanded: false,
          classrooms: [],
        }));
        this.cdr.markForCheck();
        // Cargar aulas para cada sede
        this.venues.forEach((v) => {
          this.sedeService.obtenerAulasPorSede(v.id).subscribe({
            next: (aulas) => {
              v.classrooms = aulas.map((a: any) => ({
                id: a.id,
                name: a.nombre,
                capacity: a.capacidad,
                status: a.estado === 'disponible' ? 'Disponible' : a.estado === 'en-uso' ? 'Ocupada' : 'Mantenimiento',
              }));
              v.classroomCount = v.classrooms.length;
              v.totalCapacity = v.classrooms.reduce((sum, c) => sum + c.capacity, 0);
              this.cdr.markForCheck();
              this.aplicarFiltros();
            },
          });
        });
      },
      error: (err) => {
        console.error('Error cargando sedes:', err);
        this.toastService.show('Error al cargar sedes', 'error');
        this.isLoading = false;
        this.cdr.markForCheck();
      },
    });
  }

  aplicarFiltros(): void {
    this.venuesFiltrados = this.venues.map(venue => {
      const classroomsFiltrados = venue.classrooms.filter(classroom => {
        // Filtro por estado
        if (this.filtros.estadoAula.length > 0 && !this.filtros.estadoAula.includes(classroom.status)) {
          return false;
        }

        // Filtro por capacidad mínima
        if (this.filtros.capacidadMin !== null && classroom.capacity < this.filtros.capacidadMin) {
          return false;
        }

        // Filtro por capacidad máxima
        if (this.filtros.capacidadMax !== null && classroom.capacity > this.filtros.capacidadMax) {
          return false;
        }

        // Filtro por búsqueda (nombre de aula o sede)
        if (this.filtros.busqueda.trim()) {
          const busqueda = this.filtros.busqueda.toLowerCase();
          const coincideAula = classroom.name.toLowerCase().includes(busqueda);
          const coincideSede = venue.name.toLowerCase().includes(busqueda);
          if (!coincideAula && !coincideSede) {
            return false;
          }
        }

        return true;
      });

      // Solo incluir sedes que tengan aulas después del filtro
      if (classroomsFiltrados.length === 0) {
        return null;
      }

      return {
        ...venue,
        classrooms: classroomsFiltrados,
        classroomCount: classroomsFiltrados.length,
        totalCapacity: classroomsFiltrados.reduce((sum, c) => sum + c.capacity, 0)
      };
    }).filter(venue => venue !== null) as Venue[];

    this.cdr.markForCheck();
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'Disponible': return 'status-available';
      case 'Ocupada': return 'status-occupied';
      case 'Mantenimiento': return 'status-maintenance';
      default: return '';
    }
  }

  onFabAction(action: string): void { this.activeModal = action as any; }
  closeModal(): void {
    const wasFiltrosModal = this.activeModal === 'filtros';
    this.activeModal = null;
    if (!wasFiltrosModal) {
      this.loadSedes();
    }
  }

  openFiltros(): void { this.activeModal = 'filtros'; }

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
      const logoWidth = 120; // ancho deseado en puntos (mayor tamaño)
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
    doc.text('Reporte de Sedes y Aulas', 40, 55);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.text(`Generado: ${fecha.toLocaleString()}`, 40, 70);

    // Determinar el filtro aplicado
    let filtroTexto = '(ninguno)';
    if (this.filtros.estadoAula.length > 0 || this.filtros.capacidadMin !== null ||
        this.filtros.capacidadMax !== null || this.filtros.busqueda.trim()) {
      const filtrosAplicados: string[] = [];
      if (this.filtros.estadoAula.length > 0) {
        filtrosAplicados.push(`Estado: ${this.filtros.estadoAula.join(', ')}`);
      }
      if (this.filtros.capacidadMin !== null || this.filtros.capacidadMax !== null) {
        const min = this.filtros.capacidadMin ?? 0;
        const max = this.filtros.capacidadMax ?? '∞';
        filtrosAplicados.push(`Capacidad: ${min}-${max}`);
      }
      if (this.filtros.busqueda.trim()) {
        filtrosAplicados.push(`Búsqueda: "${this.filtros.busqueda.trim()}"`);
      }
      filtroTexto = filtrosAplicados.join(' | ');
    }
    doc.text(`Filtro: ${filtroTexto}`, 40, 85);

    // Datos a exportar (usar datos filtrados)
    const datos = this.venuesFiltrados.flatMap(venue =>
      venue.classrooms.map(room => ({
        sede: venue.name,
        aula: room.name,
        capacidad: room.capacity,
        estado: room.status
      }))
    );

    const totalRegistros = datos.length;
    doc.text(`Total de aulas: ${totalRegistros}`, 40, 100);

    // Calcular capacidad total
    const totalCapacidad = datos.reduce((acc: number, r: any) => acc + r.capacidad, 0);

    const head = [['Sede', 'Aula', 'Capacidad', 'Estado']];

    const body = datos.map((r: any) => [
      r.sede,
      r.aula,
      String(r.capacidad),
      r.estado
    ]);

    autoTable(doc, {
      head,
      body,
      startY: 120,
      styles: {
        font: 'helvetica',
        fontSize: 10,
        cellPadding: 8,
        lineColor: [229, 231, 235], // #e5e7eb
        lineWidth: 0.5
      },
      headStyles: {
        fillColor: [19, 70, 236], // #1346ec - primary blue
        textColor: [255, 255, 255],
        fontStyle: 'bold'
      },
      bodyStyles: {
        textColor: [15, 23, 42] // #0f172a
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252] // light gray for alternating rows
      },
      columnStyles: {
        0: { cellWidth: 120 }, // Sede
        1: { cellWidth: 120 }, // Aula
        2: { halign: 'center', cellWidth: 80 }, // Capacidad
        3: { halign: 'center', cellWidth: 100 }  // Estado
      },
      didDrawPage: () => {
        // Footer con número de página
        const pageSize = doc.internal.pageSize as any;
        const pageHeight = pageSize.height ?? pageSize.getHeight?.() ?? 842;
        const pageWidth = pageSize.width ?? pageSize.getWidth?.() ?? 595;
        const page = doc.getNumberOfPages();
        doc.setFontSize(9);
        doc.setTextColor(107, 114, 128); // #6b7280
        doc.text(`Página ${page}`, pageWidth - 60, pageHeight - 20);
      }
    });

    // Línea divisoria
    const finalY = (doc as any).lastAutoTable?.finalY ?? 120;
    doc.setDrawColor(229, 231, 235); // #e5e7eb
    doc.setLineWidth(0.5);
    doc.line(40, finalY + 15, 555, finalY + 15);

    // Escribir total al final de la tabla
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(19, 70, 236); // #1346ec
    doc.text(
      `Capacidad total: ${totalCapacidad} asientos`,
      40,
      finalY + 35
    );

    const stamp = fecha.toISOString().slice(0, 19).replace(/[:T]/g, '-'); // yyyy-mm-dd-hh-mm-ss
    doc.save(`sedes-${stamp}.pdf`);
  }

  exportarExcel(): void {
    const datos = this.venuesFiltrados.flatMap(venue =>
      venue.classrooms.map(room => ({
        Sede: venue.name,
        Aula: room.name,
        Capacidad: room.capacity,
        Estado: room.status
      }))
    );

    const ws = XLSX.utils.json_to_sheet(datos);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sedes');
    const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
    XLSX.writeFile(wb, `sedes-${stamp}.xlsx`);
  }

  toggleVenue(venue: Venue): void { venue.expanded = !venue.expanded; }

  openNewAula(): void { this.activeModal = 'nueva-aula'; }
  openNewSede(): void { this.activeModal = 'nueva-sede'; }
}
