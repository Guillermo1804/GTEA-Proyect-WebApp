import { Component, Input, OnInit, PLATFORM_ID, Inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { FacadeService } from '../../services/facade-service';

@Component({
  selector: 'app-top-navbar',
  imports: [],
  templateUrl: './top-navbar.html',
  styleUrl: './top-navbar.scss',
})

export class TopNavbar implements OnInit {
  @Input() role: 'admin' | 'organizador' | 'estudiante' = 'admin';
  @Input() mode: 'public' | 'auth' = 'auth';
  @Input() ctaLabel: string = '';
  @Input() ctaRoute: string = '';

  userName: string = 'Usuario';

  constructor(
    private router: Router, 
    private facadeService: FacadeService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) { }

  ngOnInit(): void {
    if (this.mode !== 'auth') {
      return;
    }

    const fullName = this.facadeService.getUserDisplayName();

    if (fullName && fullName !== 'Usuario') {
      this.userName = fullName;
      return;
    }

    this.userName = 'Usuario';
  }

  navigate(path: string): void {
    this.router.navigate([path]);
  }

  getRoleLabel(): string {
    const group = this.facadeService.getUserGroup().toLowerCase();
    if (group === 'admin' || group === 'administrador') return 'Admin';
    if (group === 'organizador') return 'Organizador';
    if (group === 'alumno') return 'Alumno';
    return '';
  }

  get isAdminUser(): boolean {
    const group = this.facadeService.getUserGroup();
    return this.mode === 'auth' && (group === 'administrador' || group === 'admin');
  }

  logout(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.facadeService.destroyUser();
    }
    this.router.navigate(['/']);
  }
}
