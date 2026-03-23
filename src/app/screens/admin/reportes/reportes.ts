import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { TopNavbar } from '../../../partials/top-navbar/top-navbar';
import { BottomNav } from '../../../partials/bottom-nav/bottom-nav';
import { NuevaAulaModal } from '../../../shared/modals/nueva-aula-modal/nueva-aula-modal';
import { NuevaSedeModal } from '../../../shared/modals/nueva-sede-modal/nueva-sede-modal';
import { NuevaCategoriaModal } from '../../../shared/modals/nueva-categoria-modal/nueva-categoria-modal';
import { NuevoUsuarioModal } from '../../../shared/modals/nuevo-usuario-modal/nuevo-usuario-modal';
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
    errorMessage: string = '';
    successMessage: string = '';

    constructor(
        private http: HttpClient,
        private facadeService: FacadeService,
        private cdr: ChangeDetectorRef,
    ) { }

    ngOnInit(): void {
        this.loadReportes();
    }

    activeModal: 'nueva-aula' | 'nueva-sede' | 'nueva-categoria' | 'nuevo-usuario' | null = null;

    activePeriod = 'Mensual';
    periods = ['Semanal', 'Mensual', 'Semestral'];

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

    monthlyData: MonthlyData[] = [];

    categoryBreakdown: any[] = [];

    topEvents: TopEvent[] = [];

    get maxEvents(): number { return Math.max(1, ...this.monthlyData.map(d => d.events)); }

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
                this.cdr.markForCheck();
            },
            error: (err) => console.error('Error cargando reportes:', err),
        });
    }

    setPeriod(period: string): void { this.activePeriod = period; }

    getOccupancy(event: TopEvent): number {
        return Math.round((event.enrolled / event.capacity) * 100);
    }

    onFabAction(action: string): void { this.activeModal = action as any; }
    closeModal(): void { this.activeModal = null; }
}
