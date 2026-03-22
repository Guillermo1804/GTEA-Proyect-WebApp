import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { AdminServiceService } from '../../../services/admin-service.service';
import { EventoService, Evento } from '../../../services/evento-service';
import { CategoriaService } from '../../../services/categoria.service';
import { TopNavbar } from '../../../partials/top-navbar/top-navbar';
import { BottomNav } from '../../../partials/bottom-nav/bottom-nav';
import { NuevaAulaModal } from '../../../shared/modals/nueva-aula-modal/nueva-aula-modal';
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

  constructor(
    private router: Router,
    private adminService: AdminServiceService,
    private eventoService: EventoService,
    private categoriaService: CategoriaService,
    private cdr: ChangeDetectorRef,
  ) { }

  ngOnInit(): void {
    // Cargar total de usuarios
    this.adminService.getTotalUsuarios().subscribe({
      next: (data: any) => {
        const total = (data?.admins || 0) + (data?.organizadores || 0) + (data?.alumnos || 0);
        const usersStat = this.stats.find(s => s.label === 'Usuarios');
        if (usersStat) usersStat.value = total.toLocaleString();
        this.cdr.markForCheck();
      },
      error: (err: any) => console.error('Error cargando stats usuarios:', err),
    });

    // Cargar eventos reales
    this.eventoService.obtenerEventos().subscribe({
      next: (eventos: Evento[]) => {
        // Total de eventos
        const eventosStat = this.stats.find(s => s.label === 'Eventos');
        if (eventosStat) eventosStat.value = eventos.length.toLocaleString();

        // Eventos de esta semana
        const now = new Date();
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay());
        startOfWeek.setHours(0, 0, 0, 0);
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 7);
        const thisWeek = eventos.filter(e => {
          const d = new Date(e.fechaInicio);
          return d >= startOfWeek && d < endOfWeek;
        });
        const weekStat = this.stats.find(s => s.label === 'Esta Semana');
        if (weekStat) weekStat.value = thisWeek.length.toString();

        // Total Inscripciones
        const totalInscritos = eventos.reduce((sum, e) => sum + (e.inscritos || 0), 0);
        this.totalInscriptions = totalInscritos.toLocaleString();
        this.inscriptionsTrend = ''; // No historical data

        // Ocupación promedio
        const withCap = eventos.filter(e => e.cupoMaximo > 0);
        if (withCap.length > 0) {
          const avgOcc = withCap.reduce((sum, e) =>
            sum + ((e.inscritos || 0) / e.cupoMaximo) * 100, 0) / withCap.length;
          const occStat = this.stats.find(s => s.label === 'Ocupación Prom.');
          if (occStat) {
            occStat.value = Math.round(avgOcc) + '%';
            occStat.sublabel = avgOcc >= 70 ? 'Alta demanda' : 'Demanda normal';
          }
        }

        // Eventos recientes (últimos 3)
        const months = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
        const sorted = [...eventos].sort((a, b) =>
          new Date(b.fechaInicio).getTime() - new Date(a.fechaInicio).getTime()
        );
        this.recentEvents = sorted.slice(0, 3).map(e => {
          const date = new Date(e.fechaInicio);
          return {
            month: months[date.getMonth()],
            day: date.getDate(),
            title: e.titulo,
            location: e.modalidad === 'Virtual' ? 'Virtual' : 'Presencial',
            status: e.publicarInmediatamente ? 'Abierto' as const : 'Pocos lugares' as const,
            statusClass: e.publicarInmediatamente ? 'status-open' : 'status-few',
          };
        });

        // Inscripciones por mes (últimos 6 meses)
        const today = new Date();
        const monthlyMap = new Map<string, number>();
        for (let i = 5; i >= 0; i--) {
          const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
          const key = `${d.getFullYear()}-${d.getMonth()}`;
          monthlyMap.set(key, 0);
        }
        for (const e of eventos) {
          const d = new Date(e.fechaInicio);
          const key = `${d.getFullYear()}-${d.getMonth()}`;
          if (monthlyMap.has(key)) {
            monthlyMap.set(key, monthlyMap.get(key)! + (e.inscritos || 0));
          }
        }
        this.monthlyData = Array.from(monthlyMap.entries()).map(([key, val]) => {
          const parts = key.split('-');
          return { label: months[Number(parts[1])], value: val };
        });

        this.cdr.markForCheck();
      },
      error: (err: any) => console.error('Error cargando eventos:', err),
    });

    // Cargar categorías reales
    this.categoriaService.obtenerCategorias().subscribe({
      next: (cats: any[]) => {
        const defaultColors = ['#1e3fae', '#a855f7', '#f97316', '#059669', '#e11d48', '#6b7280'];
        this.categoryData = cats.map((c: any, i: number) => {
          const color = c.color || defaultColors[i % defaultColors.length];
          return {
            label: (c.nombre || '').substring(0, 5) + '.',
            value: 1,
            color: color,
            bgColor: color + '33',
          };
        });
        this.cdr.markForCheck();
      },
      error: (err: any) => console.error('Error cargando categorías:', err),
    });
  }

  // Modal state
  activeModal: 'nueva-aula' | 'nueva-sede' | 'nueva-categoria' | 'nuevo-usuario' | null = null;

  stats: StatCard[] = [
    {
      icon: 'event', iconColor: '#1e3fae', iconBg: '#eff6ff',
      label: 'Eventos', value: '0',
      sublabel: 'Total', sublabelColor: '#9ca3af'
    },
    {
      icon: 'group', iconColor: '#4f46e5', iconBg: '#eef2ff',
      label: 'Usuarios', value: '0',
      sublabel: 'Registrados', sublabelColor: '#9ca3af'
    },
    {
      icon: '', iconColor: '', iconBg: '',
      label: 'Ocupación Prom.', value: '0%',
      sublabel: '', sublabelColor: '#9ca3af'
    },
    {
      icon: 'calendar_today', iconColor: '#ea580c', iconBg: '#fff7ed',
      label: 'Esta Semana', value: '0',
      sublabel: 'Eventos programados', sublabelColor: '#9ca3af'
    },
  ];

  categoryData: any[] = [];

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

  recentEvents: RecentEvent[] = [];

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
