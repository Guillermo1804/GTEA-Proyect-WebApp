import { Component, OnInit } from '@angular/core';
import { TopNavbar } from '../../../partials/top-navbar/top-navbar';
import { BottomNav } from '../../../partials/bottom-nav/bottom-nav';
import { NuevaAulaModal } from '../sedes/nueva-aula-modal/nueva-aula-modal';
import { NuevaSedeModal } from '../../../shared/modals/nueva-sede-modal/nueva-sede-modal';
import { NuevaCategoriaModal } from '../../../shared/modals/nueva-categoria-modal/nueva-categoria-modal';
import { NuevoUsuarioModal } from '../../../shared/modals/nuevo-usuario-modal/nuevo-usuario-modal';

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
    ngOnInit(): void {

    }
    activeModal: 'nueva-aula' | 'nueva-sede' | 'nueva-categoria' | 'nuevo-usuario' | null = null;

    activePeriod = 'Mensual';
    periods = ['Semanal', 'Mensual', 'Semestral'];

    stats: ReportStat[] = [
        {
            icon: 'event', iconColor: '#1e3fae', iconBg: '#eff6ff',
            label: 'Total Eventos', value: '324',
            change: '+18%', changeColor: '#059669', changeIcon: 'trending_up'
        },
        {
            icon: 'group', iconColor: '#7c3aed', iconBg: '#f5f3ff',
            label: 'Inscripciones', value: '12,430',
            change: '+24%', changeColor: '#059669', changeIcon: 'trending_up'
        },
        {
            icon: 'percent', iconColor: '#ea580c', iconBg: '#fff7ed',
            label: 'Tasa Ocupación', value: '78%',
            change: '+5%', changeColor: '#059669', changeIcon: 'trending_up'
        },
        {
            icon: 'star', iconColor: '#eab308', iconBg: '#fefce8',
            label: 'Satisfacción', value: '4.6',
            change: '-0.2', changeColor: '#dc2626', changeIcon: 'trending_down'
        },
    ];

    monthlyData: MonthlyData[] = [
        { label: 'Sep', events: 28, inscriptions: 1200 },
        { label: 'Oct', events: 35, inscriptions: 1500 },
        { label: 'Nov', events: 42, inscriptions: 1800 },
        { label: 'Dic', events: 15, inscriptions: 600 },
        { label: 'Ene', events: 38, inscriptions: 1650 },
        { label: 'Feb', events: 45, inscriptions: 1900 },
    ];

    categoryBreakdown = [
        { name: 'Talleres', count: 89, percentage: 27, color: '#1e3fae' },
        { name: 'Conferencias', count: 65, percentage: 20, color: '#7c3aed' },
        { name: 'Seminarios', count: 52, percentage: 16, color: '#f97316' },
        { name: 'Deportivos', count: 48, percentage: 15, color: '#059669' },
        { name: 'Culturales', count: 42, percentage: 13, color: '#e11d48' },
        { name: 'Otros', count: 28, percentage: 9, color: '#6b7280' },
    ];

    topEvents: TopEvent[] = [
        { rank: 1, title: 'Hackathon GTEA 2026', category: 'Talleres', categoryColor: '#1e3fae', enrolled: 120, capacity: 120 },
        { rank: 2, title: 'Conferencia AI', category: 'Conferencias', categoryColor: '#7c3aed', enrolled: 195, capacity: 200 },
        { rank: 3, title: 'Torneo de Ajedrez', category: 'Deportes', categoryColor: '#059669', enrolled: 50, capacity: 50 },
        { rank: 4, title: 'Taller de Python', category: 'Talleres', categoryColor: '#1e3fae', enrolled: 38, capacity: 40 },
        { rank: 5, title: 'Expo Arte Digital', category: 'Culturales', categoryColor: '#e11d48', enrolled: 95, capacity: 100 },
    ];

    get maxEvents(): number { return Math.max(...this.monthlyData.map(d => d.events)); }

    setPeriod(period: string): void { this.activePeriod = period; }

    getOccupancy(event: TopEvent): number {
        return Math.round((event.enrolled / event.capacity) * 100);
    }

    onFabAction(action: string): void { this.activeModal = action as any; }
    closeModal(): void { this.activeModal = null; }
}
