import { Component, Input, Output, EventEmitter } from '@angular/core';
import { Router } from '@angular/router';

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
export class BottomNav {
  @Input() role: 'admin' | 'organizador' | 'estudiante' = 'estudiante';
  @Input() activeTab = '';
  @Output() fabAction = new EventEmitter<string>();

  showFabMenu = false;

  constructor(private router: Router) { }

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
        { icon: 'dashboard', label: 'Inicio', route: '/organizador/dashboard' },
        { icon: 'event', label: 'Eventos', route: '/organizador/eventos' },
      ],
      right: [
        { icon: 'assessment', label: 'Reportes', route: '/organizador/reportes' },
        { icon: 'person', label: 'Perfil', route: '/organizador/perfil' },
      ],
    },
    estudiante: {
      left: [
        { icon: 'dashboard', label: 'Inicio', route: '/estudiante/dashboard' },
        { icon: 'calendar_month', label: 'Eventos', route: '/estudiante/explorar' },
      ],
      right: [
        { icon: 'history', label: 'Historial', route: '/estudiante/historial' },
        { icon: 'person', label: 'Perfil', route: '/estudiante/perfil' },
      ],
    },
  };

  fabActions: FabAction[] = [
    { icon: 'meeting_room', label: 'Nueva Aula', color: '#1e3fae', action: 'nueva-aula' },
    { icon: 'domain_add', label: 'Nueva Sede', color: '#059669', action: 'nueva-sede' },
    { icon: 'category', label: 'Nueva Categoría', color: '#7c3aed', action: 'nueva-categoria' },
    { icon: 'person_add', label: 'Nuevo Usuario', color: '#ea580c', action: 'nuevo-usuario' },
  ];

  get leftTabs(): NavTab[] {
    return this.tabConfigs[this.role]?.left ?? [];
  }

  get rightTabs(): NavTab[] {
    return this.tabConfigs[this.role]?.right ?? [];
  }

  get hasFab(): boolean {
    return this.role === 'admin' || this.role === 'organizador';
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
    this.fabAction.emit(action);
  }
}
