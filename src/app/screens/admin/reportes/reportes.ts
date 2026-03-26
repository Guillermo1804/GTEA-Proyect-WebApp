import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { TopNavbar } from '../../../partials/top-navbar/top-navbar';
import { BottomNav } from '../../../partials/bottom-nav/bottom-nav';
import { NuevaAulaModal } from '../../../shared/modals/nueva-aula-modal/nueva-aula-modal';
import { NuevaSedeModal } from '../../../shared/modals/nueva-sede-modal/nueva-sede-modal';
import { NuevaCategoriaModal } from '../../../shared/modals/nueva-categoria-modal/nueva-categoria-modal';
import { NuevoUsuarioModal } from '../../../shared/modals/nuevo-usuario-modal/nuevo-usuario-modal';
import { EventoService, Evento } from '../../../services/evento-service';
import { FacadeService } from '../../../services/facade-service';
import { environment } from '../../../../environments/environment';

interface ReportStat {
    icon: string;
    iconColor: string;
    iconBg: string;
    label: string;
    value: string;
    change: string;
    changeColor: string;
    changeIcon: string;
}

interface TopEvent {
    rank: number;
    title: string;
    category: string;
    categoryColor: string;
    enrolled: number;
    capacity: number;
}

interface MonthlyData {
    label: string;
    events: number;
    inscriptions: number;
}

@Component({
    selector: 'app-admin-reportes',
    imports: [TopNavbar, BottomNav, NuevaAulaModal, NuevaSedeModal, NuevaCategoriaModal, NuevoUsuarioModal],
    templateUrl: './reportes.html',
    styleUrl: './reportes.scss',
})
export class Reportes implements OnInit {
    readonly form: any;

    constructor(
        private http: HttpClient,
        private eventoService: EventoService,
        private facadeService: FacadeService,
        private cdr: ChangeDetectorRef,
    ) { }

    ngOnInit(): void {
        this.loadReportes();
    }

    activeModal: 'nueva-aula' | 'nueva-sede' | 'nueva-categoria' | 'nuevo-usuario' | null = null;

    activePeriod = 'Mensual';
    periods = ['Semanal', 'Mensual', 'Semestral'];
    weeksOffset = 0; // Para navegar bloques de 6 semanas

    stats: ReportStat[] = [
        {
            icon: 'event', iconColor: '#1e3fae', iconBg: '#eff6ff',
            label: 'Total Eventos', value: '0',
            change: '', changeColor: '#059669', changeIcon: 'trending_up'
        },
        {
            icon: 'group', iconColor: '#7c3aed', iconBg: '#f5f3ff',
            label: 'Inscripciones', value: '0',
            change: '', changeColor: '#059669', changeIcon: 'trending_up'
        },
        {
            icon: 'percent', iconColor: '#ea580c', iconBg: '#fff7ed',
            label: 'Tasa Ocupación', value: '0%',
            change: '', changeColor: '#059669', changeIcon: 'trending_up'
        },
        {
            icon: 'star', iconColor: '#eab308', iconBg: '#fefce8',
            label: 'Categorías', value: '0',
            change: '', changeColor: '#9ca3af', changeIcon: 'trending_up'
        },
    ];

    monthlyData: MonthlyData[] = [
        { label: 'Ene', events: 0, inscriptions: 0 },
        { label: 'Feb', events: 0, inscriptions: 0 },
        { label: 'Mar', events: 0, inscriptions: 0 },
        { label: 'Abr', events: 0, inscriptions: 0 },
        { label: 'May', events: 0, inscriptions: 0 },
        { label: 'Jun', events: 0, inscriptions: 0 },
    ];

    categoryBreakdown: any[] = [];

    topEvents: TopEvent[] = [];

    get maxEvents(): number { return Math.max(1, ...this.monthlyData.map(d => d.events)); }

    private getMonthLabelFromNumber(monthNumber: number): string {
        const labels = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
        return labels[monthNumber % 12];
    }

    private normalizeMonthlyItem(m: any): MonthlyData {
        const monthNumber = Number(m.mes ?? m.month ?? m.mes_numero ?? m.monthNumber ?? -1);
        let label = (m.label || m.mes || m.month || '').toString();
        if (!label && !isNaN(monthNumber) && monthNumber >= 0 && monthNumber < 12) {
            label = this.getMonthLabelFromNumber(monthNumber);
        }

        const events = Number(m.events ?? m.eventos ?? m.cantidad ?? m.count ?? m.total ?? m.valor ?? 0);
        const inscriptions = Number(m.inscripciones ?? m.inscripcion ?? m.inscriptiones ?? m.inscritos ?? m.total_inscritos ?? 0);

        return {
            label: label || 'N/A',
            events: isNaN(events) ? 0 : events,
            inscriptions: isNaN(inscriptions) ? 0 : inscriptions,
        };
    }

    private buildMonthlyFromEvents(eventos: Evento[]): MonthlyData[] {
        const today = new Date();
        const monthlyLabels = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

        // Últimos 6 meses (incluye el mes actual)
        const monthlyMap = new Map<string, { label: string; events: number; inscriptions: number }>();
        for (let i = 5; i >= 0; i--) {
            const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
            const key = `${d.getFullYear()}-${d.getMonth()}`;
            monthlyMap.set(key, { label: monthlyLabels[d.getMonth()], events: 0, inscriptions: 0 });
        }

        for (const e of eventos) {
            if (!e.fechaInicio) continue;
            const d = new Date(e.fechaInicio);
            const key = `${d.getFullYear()}-${d.getMonth()}`;
            if (monthlyMap.has(key)) {
                const current = monthlyMap.get(key)!;
                current.events += 1;
                current.inscriptions += (e.inscritos || 0);
                monthlyMap.set(key, current);
            }
        }

        return Array.from(monthlyMap.values());
    }

    private buildWeeklyFromEvents(eventos: Evento[]): MonthlyData[] {
        const today = new Date();
        const monthlyLabels = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
        const weeklyMap = new Map<string, { label: string; events: number; inscriptions: number }>();

        // Próximas 6 semanas con offset de navegación (cada bloque = 42 días)
        const baseDate = new Date(today);
        baseDate.setDate(baseDate.getDate() + (this.weeksOffset * 42));

        for (let i = 0; i < 6; i++) {
            const weekStart = new Date(baseDate);
            weekStart.setDate(weekStart.getDate() + (i * 7));
            const weekEnd = new Date(weekStart);
            weekEnd.setDate(weekEnd.getDate() + 6);

            // Crear label con rango de fechas: "25 Mar - 31 Mar"
            const label = `${weekStart.getDate()} ${monthlyLabels[weekStart.getMonth()]} - ${weekEnd.getDate()} ${monthlyLabels[weekEnd.getMonth()]}`;

            const key = `${weekStart.getFullYear()}-${weekStart.getMonth()}-${weekStart.getDate()}`;
            weeklyMap.set(key, { label, events: 0, inscriptions: 0 });
        }

        for (const e of eventos) {
            if (!e.fechaInicio) continue;
            const d = new Date(e.fechaInicio);

            // Buscar en qué semana cae este evento
            for (let i = 0; i < 6; i++) {
                const weekStart = new Date(baseDate);
                weekStart.setDate(weekStart.getDate() + (i * 7));
                const weekEnd = new Date(weekStart);
                weekEnd.setDate(weekEnd.getDate() + 6);

                if (d >= weekStart && d <= weekEnd) {
                    const key = `${weekStart.getFullYear()}-${weekStart.getMonth()}-${weekStart.getDate()}`;
                    if (weeklyMap.has(key)) {
                        const current = weeklyMap.get(key)!;
                        current.events += 1;
                        current.inscriptions += (e.inscritos || 0);
                        weeklyMap.set(key, current);
                    }
                    break;
                }
            }
        }

        return Array.from(weeklyMap.values());
    }

    private buildSemestralFromEvents(eventos: Evento[]): MonthlyData[] {
        const yearNow = new Date().getFullYear();
        const monthlyLabels = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

        // 12 meses del año actual
        const semestralMap = new Map<string, { label: string; events: number; inscriptions: number }>();
        for (let m = 0; m < 12; m++) {
            const key = `${yearNow}-${m}`;
            semestralMap.set(key, { label: monthlyLabels[m], events: 0, inscriptions: 0 });
        }

        for (const e of eventos) {
            if (!e.fechaInicio) continue;
            const d = new Date(e.fechaInicio);
            const key = `${d.getFullYear()}-${d.getMonth()}`;
            if (semestralMap.has(key)) {
                const current = semestralMap.get(key)!;
                current.events += 1;
                current.inscriptions += (e.inscritos || 0);
                semestralMap.set(key, current);
            }
        }

        return Array.from(semestralMap.values());
    }

    private buildChartDataByPeriod(eventos: Evento[]): MonthlyData[] {
        switch (this.activePeriod) {
            case 'Semanal':
                return this.buildWeeklyFromEvents(eventos);
            case 'Semestral':
                return this.buildSemestralFromEvents(eventos);
            case 'Mensual':
            default:
                return this.buildMonthlyFromEvents(eventos);
        }
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
        doc.text('Reportes de Eventos', 40, 55);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(11);
        doc.text(`Generado: ${fecha.toLocaleString()}`, 40, 70);
        doc.text(`Período: ${this.activePeriod}`, 40, 85);

        let currentY = 110;

        // KPI Cards
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(13);
        doc.text('Estadísticas', 40, currentY);
        currentY += 20;

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        for (const stat of this.stats) {
            doc.text(`${stat.label}: ${stat.value}`, 40, currentY);
            currentY += 15;
        }

        currentY += 10;

        // Monthly Data Table
        if (this.monthlyData.length > 0) {
            const monthlyHead = [['Período', 'Eventos', 'Inscripciones']];
            const monthlyBody = this.monthlyData.map((d: any) => [
                d.label,
                String(d.events),
                String(d.inscriptions)
            ]);

            autoTable(doc, {
                head: monthlyHead,
                body: monthlyBody,
                startY: currentY,
                styles: {
                    font: 'helvetica',
                    fontSize: 9,
                    cellPadding: 6,
                    lineColor: [229, 231, 235],
                    lineWidth: 0.5
                },
                headStyles: {
                    fillColor: [30, 63, 174],
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
                    0: { cellWidth: 250 },
                    1: { halign: 'center', cellWidth: 80 },
                    2: { halign: 'center', cellWidth: 100 }
                }
            });

            const finalY = (doc as any).lastAutoTable?.finalY || currentY + 100;
            currentY = finalY + 20;
        }

        // Category Breakdown Table
        if (this.categoryBreakdown.length > 0) {
            const catHead = [['Categoría', 'Eventos', 'Inscripciones', 'Porcentaje']];
            const catBody = this.categoryBreakdown.map((c: any) => [
                c.name,
                String(c.count),
                String(c.count),
                `${c.percentage}%`
            ]);

            autoTable(doc, {
                head: catHead,
                body: catBody,
                startY: currentY,
                styles: {
                    font: 'helvetica',
                    fontSize: 9,
                    cellPadding: 6,
                    lineColor: [229, 231, 235],
                    lineWidth: 0.5
                },
                headStyles: {
                    fillColor: [30, 63, 174],
                    textColor: [255, 255, 255],
                    fontStyle: 'bold'
                },
                bodyStyles: {
                    textColor: [15, 23, 42]
                },
                alternateRowStyles: {
                    fillColor: [248, 250, 252]
                }
            });

            const finalY = (doc as any).lastAutoTable?.finalY || currentY + 100;
            currentY = finalY + 20;
        }

        // Top Events Table
        if (this.topEvents.length > 0) {
            const topHead = [['Rank', 'Evento', 'Inscritos', 'Ocupancia']];
            const topBody = this.topEvents.map((e: any) => [
                `#${e.rank}`,
                e.title,
                `${e.enrolled}/${e.capacity}`,
                `${this.getOccupancy(e)}%`
            ]);

            autoTable(doc, {
                head: topHead,
                body: topBody,
                startY: currentY,
                styles: {
                    font: 'helvetica',
                    fontSize: 9,
                    cellPadding: 6,
                    lineColor: [229, 231, 235],
                    lineWidth: 0.5
                },
                headStyles: {
                    fillColor: [30, 63, 174],
                    textColor: [255, 255, 255],
                    fontStyle: 'bold'
                },
                bodyStyles: {
                    textColor: [15, 23, 42]
                },
                alternateRowStyles: {
                    fillColor: [248, 250, 252]
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
        }

        const stamp = fecha.toISOString().slice(0, 19).replace(/[:T]/g, '-');
        doc.save(`reportes-${this.activePeriod}-${stamp}.pdf`);
    }

    exportarExcel(): void {
        const datos: any[] = [];

        // Incluir estadísticas
        datos.push({ Tipo: 'Total Eventos', Valor: this.stats[0].value });
        datos.push({ Tipo: 'Total Inscripciones', Valor: this.stats[1].value });
        datos.push({ Tipo: 'Tasa Ocupación', Valor: this.stats[2].value });
        datos.push({ Tipo: 'Categorías', Valor: this.stats[3].value });
        datos.push({});

        // Datos mensuales
        if (this.monthlyData.length > 0) {
            datos.push({ Período: 'ACTIVIDAD MENSUAL' });
            this.monthlyData.forEach(d => {
                datos.push({
                    Período: d.label,
                    Eventos: d.events,
                    Inscripciones: d.inscriptions
                });
            });
            datos.push({});
        }

        // Categorías
        if (this.categoryBreakdown.length > 0) {
            datos.push({ Categoría: 'EVENTOS POR CATEGORÍA' });
            this.categoryBreakdown.forEach(c => {
                datos.push({
                    Categoría: c.name,
                    Eventos: c.count,
                    Porcentaje: `${c.percentage}%`
                });
            });
            datos.push({});
        }

        // Top eventos
        if (this.topEvents.length > 0) {
            datos.push({ Rank: 'EVENTOS POPULARES' });
            this.topEvents.forEach(e => {
                datos.push({
                    Rank: `#${e.rank}`,
                    Evento: e.title,
                    Inscritos: `${e.enrolled}/${e.capacity}`,
                    Ocupancia: `${this.getOccupancy(e)}%`
                });
            });
        }

        const ws = XLSX.utils.json_to_sheet(datos);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Reportes');
        const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
        XLSX.writeFile(wb, `reportes-${this.activePeriod}-${stamp}.xlsx`);
    }

    loadReportes(): void {
        const token = this.facadeService.getSessionToken();
        const headers = new HttpHeaders({ 'Content-Type': 'application/json', 'Authorization': 'Token ' + token });
        this.http.get<any>(`${environment.url_api}/reportes/resumen/`, { headers }).subscribe({
            next: (data) => {
                const t = data.totales || {};
                this.stats[0].value = (t.eventos || 0).toLocaleString();
                this.stats[1].value = (t.inscripciones || 0).toLocaleString();
                this.stats[3].value = (t.categorias || 0).toLocaleString();

                // Tasa de ocupación promedio
                const topEvts = data.top_eventos || [];
                if (topEvts.length > 0) {
                    const avgOcc = topEvts.reduce((s: number, e: any) => s + (e.cupo_maximo > 0 ? (e.total_inscritos / e.cupo_maximo) * 100 : 0), 0) / topEvts.length;
                    this.stats[2].value = Math.round(avgOcc) + '%';
                }

                // Categorías breakdown
                const cats = data.por_categoria || [];
                const totalEvsByCat = cats.reduce((s: number, c: any) => s + (c.total_eventos || 0), 0) || 1;
                const colors = ['#1e3fae', '#7c3aed', '#f97316', '#059669', '#e11d48', '#6b7280'];
                this.categoryBreakdown = cats.map((c: any, i: number) => ({
                    name: c.nombre,
                    count: c.total_inscritos || 0,
                    percentage: Math.round(((c.total_eventos || 0) / totalEvsByCat) * 100),
                    color: colors[i % colors.length],
                }));

                // Top eventos
                this.topEvents = topEvts.slice(0, 5).map((e: any, i: number) => ({
                    rank: i + 1,
                    title: e.titulo,
                    category: '',
                    categoryColor: '#1e3fae',
                    enrolled: e.total_inscritos || 0,
                    capacity: e.cupo_maximo || 1,
                }));

                // Actividad mensual (espera arreglo con label/events/inscriptions)
                let monthlyCandidates = data.por_mes || data.eventos_mensuales || data.mensual || data.mensualidad || data.eventos_por_mes || [];
                if (!Array.isArray(monthlyCandidates) && monthlyCandidates && typeof monthlyCandidates === 'object') {
                    monthlyCandidates = Object.values(monthlyCandidates);
                }

                if (Array.isArray(monthlyCandidates) && monthlyCandidates.length > 0) {
                    this.monthlyData = monthlyCandidates.map((m: any) => this.normalizeMonthlyItem(m));
                    this.cdr.markForCheck();
                } else {
                    // Si no hay breakdown mensual desde reportes, usar la lista de eventos reales.
                    this.eventoService.obtenerEventos().subscribe({
                        next: (eventos: Evento[]) => {
                            this.monthlyData = this.buildChartDataByPeriod(eventos);
                            console.debug('reportes.ts monthlyData from eventos:', this.monthlyData, 'period:', this.activePeriod);
                            this.cdr.markForCheck();
                        },
                        error: (err) => {
                            console.warn('No se pudieron obtener eventos para monthlyData:', err);
                            const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun'];
                            this.monthlyData = months.map(label => ({ label, events: 0, inscriptions: 0 }));
                            this.cdr.markForCheck();
                        }
                    });
                }

                console.debug('reportes.ts monthlyData cargada:', this.monthlyData, 'payload:', monthlyCandidates);

                this.cdr.markForCheck();
            },
            error: (err) => console.error('Error cargando reportes:', err),
        });
    }

    setPeriod(period: string): void {
        this.activePeriod = period;
        this.weeksOffset = 0; // Resetear navegación al cambiar período
        // Recargar gráfico de actividad mensual con el nuevo período
        this.eventoService.obtenerEventos().subscribe({
            next: (eventos: Evento[]) => {
                this.monthlyData = this.buildChartDataByPeriod(eventos);
                console.debug('reportes.ts período actualizado a:', this.activePeriod, 'monthlyData:', this.monthlyData);
                this.cdr.markForCheck();
            },
            error: (err) => console.warn('Error recargando datos por período:', err),
        });
    }

    nextWeeks(): void {
        this.weeksOffset += 1;
        this.eventoService.obtenerEventos().subscribe({
            next: (eventos: Evento[]) => {
                this.monthlyData = this.buildChartDataByPeriod(eventos);
                console.debug('reportes.ts weeksOffset:', this.weeksOffset, 'monthlyData:', this.monthlyData);
                this.cdr.markForCheck();
            },
            error: (err) => console.warn('Error al avanzar semanas:', err),
        });
    }

    prevWeeks(): void {
        if (this.weeksOffset > 0) {
            this.weeksOffset -= 1;
            this.eventoService.obtenerEventos().subscribe({
                next: (eventos: Evento[]) => {
                    this.monthlyData = this.buildChartDataByPeriod(eventos);
                    console.debug('reportes.ts weeksOffset:', this.weeksOffset, 'monthlyData:', this.monthlyData);
                    this.cdr.markForCheck();
                },
                error: (err) => console.warn('Error al retroceder semanas:', err),
            });
        }
    }

    getOccupancy(event: TopEvent): number {
        return Math.round((event.enrolled / event.capacity) * 100);
    }

    onFabAction(action: string): void { this.activeModal = action as any; }
    closeModal(): void { this.activeModal = null; }
}
