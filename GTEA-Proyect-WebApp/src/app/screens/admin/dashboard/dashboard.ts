import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AdminServiceService } from '../../../services/admin-service.service';
import { TopNavbar } from '../../../partials/top-navbar/top-navbar';
import { BottomNav } from '../../../partials/bottom-nav/bottom-nav';
import { NuevaAulaModal } from '../sedes/nueva-aula-modal/nueva-aula-modal';
import { NuevaSedeModal } from '../../../shared/modals/nueva-sede-modal/nueva-sede-modal';
import { NuevaCategoriaModal } from '../../../shared/modals/nueva-categoria-modal/nueva-categoria-modal';
import { NuevoUsuarioModal } from '../../../shared/modals/nuevo-usuario-modal/nuevo-usuario-modal';

interface StatCard {
  icon: string;
  iconColor: string;
  iconBg: string;
  label: string;
  value: string;
  sublabel: string;
  sublabelColor: string;
  sublabelIcon?: string;
}

interface RecentEvent {
  month: string;
  day: number;
  title: string;
  location: string;
  status: 'Abierto' | 'Lleno' | 'Pocos lugares';
  statusClass: string;
}

@Component({
  selector: 'app-admin-dashboard',
  imports: [TopNavbar, BottomNav, NuevaAulaModal, NuevaSedeModal, NuevaCategoriaModal, NuevoUsuarioModal],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class Dashboard implements OnInit {
  readonly form: any;
  errorMessage: string = '';
  successMessage: string = '';
  ngOnInit(): void {
    this.adminService.getTotalUsuarios().subscribe({
      next: (data: any) => {
        // Backend devuelve { admins: N, organizadores: N, alumnos: N }
        const total = (data?.admins || 0) + (data?.organizadores || 0) + (data?.alumnos || 0);
        const usersStat = this.stats.find(s => s.label === 'Usuarios');
        if (usersStat) usersStat.value = total.toLocaleString();
      },
      error: (err: any) => console.error('Error cargando stats:', err),
    });
  }
  constructor(private router: Router, private adminService: AdminServiceService) { }

  // Modal state
  activeModal: 'nueva-aula' | 'nueva-sede' | 'nueva-categoria' | 'nuevo-usuario' | null = null;

  stats: StatCard[] = [
    {
      icon: 'event', iconColor: '#1e3fae', iconBg: '#eff6ff',
      label: 'Eventos', value: '124',
      sublabel: '+12%', sublabelColor: '#059669', sublabelIcon: 'trending_up'
    },
    {
      icon: 'group', iconColor: '#4f46e5', iconBg: '#eef2ff',
      label: 'Usuarios', value: '3,450',
      sublabel: 'Activos hoy', sublabelColor: '#9ca3af'
    },
    {
      icon: '', iconColor: '', iconBg: '',
      label: 'Ocupación Prom.', value: '85%',
      sublabel: 'Alta demanda', sublabelColor: '#059669'
    },
    {
      icon: 'calendar_today', iconColor: '#ea580c', iconBg: '#fff7ed',
      label: 'Esta Semana', value: '8',
      sublabel: 'Eventos programados', sublabelColor: '#9ca3af'
    },
  ];

  categoryData = [
    { label: 'Acad.', value: 137, color: '#1e3fae', bgColor: '#d2d9ef' },
    { label: 'Cult.', value: 72, color: '#a855f7', bgColor: '#f3e8ff' },
    { label: 'Dep.', value: 61, color: '#f97316', bgColor: '#ffedd5' },
  ];

  inscriptionsExpanded = false;
  totalInscriptions = '8,450';
  inscriptionsTrend = '+5.2% vs prev';

  monthlyData = [
    { label: 'Ene', value: 1200 },
    { label: 'Feb', value: 1400 },
    { label: 'Mar', value: 1100 },
    { label: 'Abr', value: 1600 },
    { label: 'May', value: 1800 },
    { label: 'Jun', value: 1350 },
  ];

  recentEvents: RecentEvent[] = [
    {
      month: 'Mar', day: 12,
      title: 'Taller de Python',
      location: 'Lab. de Sistemas #3',
      status: 'Abierto', statusClass: 'status-open'
    },
    {
      month: 'Mar', day: 15,
      title: 'Conferencia AI',
      location: 'Auditorio Principal',
      status: 'Pocos lugares', statusClass: 'status-few'
    },
    {
      month: 'Mar', day: 20,
      title: 'Torneo Ajedrez',
      location: 'Sala de Usos Múltiples',
      status: 'Lleno', statusClass: 'status-full'
    },
  ];

  get maxCategoryValue(): number {
    return Math.max(...this.categoryData.map(c => c.value));
  }

  get maxMonthlyValue(): number {
    return Math.max(...this.monthlyData.map(d => d.value));
  }

  toggleInscriptions(): void {
    this.inscriptionsExpanded = !this.inscriptionsExpanded;
  }

  goToEventos(): void {
    this.router.navigate(['/admin/eventos']);
  }

  onFabAction(action: string): void {
    this.activeModal = action as any;
  }

  closeModal(): void {
    this.activeModal = null;
  }
}
