import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { Subscription } from 'rxjs';

interface NavTab {
  icon: string;
  label: string;
  route: string;
}

interface FabAction {
  icon: string;
  label: string;
  color: string;
  action: string;
}

@Component({
  selector: 'app-bottom-nav',
  imports: [],
  templateUrl: './bottom-nav.html',
  styleUrl: './bottom-nav.scss',
})
export class BottomNav implements OnInit, OnDestroy {
  @Input() role: 'admin' | 'organizador' | 'estudiante' = 'estudiante';
  @Input() activeTab = '';
  @Output() fabAction = new EventEmitter<string>();

  showFabMenu = false;
  private routerSub!: Subscription;

  constructor(
    private router: Router,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.routerSub = this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      this.cdr.detectChanges();
    });
  }

  ngOnDestroy(): void {
    if (this.routerSub) {
      this.routerSub.unsubscribe();
    }
  }

  private get effectiveRole(): 'admin' | 'organizador' | 'estudiante' {
    const groupRole = localStorage.getItem('gtea-proyecto-group_name');
    const userRole = localStorage.getItem('userRole');

    const currentRole = groupRole || userRole || this.role;

    if (currentRole === 'administrador') return 'admin';
    if (currentRole === 'organizador') return 'organizador';
    if (currentRole === 'alumno') return 'estudiante';

    return this.role;
  }

  private tabConfigs: Record<string, { left: NavTab[]; right: NavTab[] }> = {
    admin: {
      left: [
        { icon: 'dashboard', label: 'Inicio', route: '/admin/dashboard' },
        { icon: 'event', label: 'Eventos', route: '/admin/eventos' },
        { icon: 'domain', label: 'Sedes', route: '/admin/sedes' },
      ],
      right: [
        { icon: 'category', label: 'Categorías', route: '/admin/categorias' },
        { icon: 'group', label: 'Usuarios', route: '/admin/usuarios' },
        { icon: 'assessment', label: 'Reportes', route: '/admin/reportes' },
      ],
    },
    organizador: {
      left: [
        { icon: 'dashboard', label: 'Inicio', route: '/admin/dashboard' },
        { icon: 'event', label: 'Eventos', route: '/admin/eventos' },
      ],
      right: [
        { icon: 'assessment', label: 'Reportes', route: '/admin/reportes' },
        { icon: 'group', label: 'Usuarios', route: '/admin/usuarios' },
      ],
    },
    estudiante: {
      left: [
        { icon: 'grid_view', label: 'Catálogo', route: '/alumno/catalogo' },
        { icon: 'bookmark', label: 'Mis Eventos', route: '/alumno/mis-eventos' },
      ],
      right: [
        // { icon: 'history', label: 'Historial', route: '/alumno/historial' },
        { icon: 'person', label: 'Perfil', route: '/alumno/perfil' },
      ],
    },
  };

  fabActions: FabAction[] = [
    { icon: 'person_add', label: 'Nuevo Usuario', color: '#ea580c', action: 'nuevo-usuario' },
    { icon: 'category', label: 'Nueva Categoría', color: '#7c3aed', action: 'nueva-categoria' },
    { icon: 'domain_add', label: 'Nueva Sede', color: '#059669', action: 'nueva-sede' },
    { icon: 'meeting_room', label: 'Nueva Aula', color: '#16a34a', action: 'nueva-aula' },
    { icon: 'event', label: 'Nuevo Evento', color: '#1e3fae', action: 'nuevo-evento' },
  ];

  get visibleFabActions(): FabAction[] {
    if (this.effectiveRole === 'organizador') {
      return this.fabActions.filter(action => action.action === 'nuevo-evento');
    }
    // admin y estudiante (si se habilita) pueden ver todo lo definido
    return this.fabActions;
  }

  get leftTabs(): NavTab[] {
    return this.tabConfigs[this.effectiveRole]?.left ?? [];
  }

  get rightTabs(): NavTab[] {
    return this.tabConfigs[this.effectiveRole]?.right ?? [];
  }

  get hasFab(): boolean {
    return this.effectiveRole === 'admin' || this.effectiveRole === 'organizador';
  }

  isActive(route: string): boolean {
    return this.router.url.startsWith(route);
  }

  navigate(route: string): void {
    this.router.navigate([route]);
  }

  toggleFabMenu(): void {
    this.showFabMenu = !this.showFabMenu;
  }

  closeFabMenu(): void {
    this.showFabMenu = false;
  }

  onFabAction(action: string): void {
    this.showFabMenu = false;
    
    // Si es "nuevo-evento", navegar directamente a /admin/eventos con query param
    if (action === 'nuevo-evento') {
      this.router.navigate(['/admin/eventos'], { queryParams: { new: 'true' } });
      return;
    }
    
    this.fabAction.emit(action);
  }
}
