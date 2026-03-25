import { Component, Input, OnInit } from '@angular/core';
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

  constructor(private router: Router, private facadeService: FacadeService) { }

  ngOnInit(): void {
    if (this.mode !== 'auth') {
      return;
    }

    const fullName = this.facadeService.getUserDisplayName();

    if (fullName && fullName !== 'Usuario') {
      this.userName = fullName.split(' ')[0];
      return;
    }

    this.userName = 'Usuario';
  }

  navigate(path: string): void {
    this.router.navigate([path]);
  }

  onNotifications(): void {
    // TODO: open notifications panel
  }

  onSettings(): void {
    // TODO: open settings
  }

  get isAdminUser(): boolean {
    const group = this.facadeService.getUserGroup();
    return this.mode === 'auth' && (group === 'administrador' || group === 'admin');
  }

  logout(): void {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.removeItem('userRole');
      localStorage.removeItem('gtea-proyecto-token');
      localStorage.removeItem('gtea-proyecto-email');
      localStorage.removeItem('gtea-proyecto-user_id');
      localStorage.removeItem('gtea-proyecto-user_complete_name');
      localStorage.removeItem('gtea-proyecto-group_name');
      localStorage.removeItem('group_name');
      localStorage.removeItem('user_complete_name');
      localStorage.removeItem('userName');
    }
    this.router.navigate(['/']);
  }
}
