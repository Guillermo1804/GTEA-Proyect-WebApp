import { Component, Input } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-top-navbar',
  imports: [],
  templateUrl: './top-navbar.html',
  styleUrl: './top-navbar.scss',
})

export class TopNavbar {
  @Input() role: 'admin' | 'organizador' | 'estudiante' = 'admin';
  @Input() mode: 'public' | 'auth' = 'auth';
  @Input() ctaLabel: string = '';
  @Input() ctaRoute: string = '';

  constructor(private router: Router) { }

  navigate(path: string): void {
    this.router.navigate([path]);
  }

  onNotifications(): void {
    // TODO: open notifications panel
  }

  onSettings(): void {
    // TODO: open settings
  }

  logout(): void {
    localStorage.removeItem('userRole');
    localStorage.removeItem('gtea-proyecto-token');
    localStorage.removeItem('gtea-proyecto-email');
    localStorage.removeItem('gtea-proyecto-user_id');
    localStorage.removeItem('gtea-proyecto-user_complete_name');
    localStorage.removeItem('gtea-proyecto-group_name');
    this.router.navigate(['/']);
  }
}
