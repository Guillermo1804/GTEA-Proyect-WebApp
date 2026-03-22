import { Component, Input, OnInit } from '@angular/core';
import { Router } from '@angular/router';

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

  constructor(private router: Router) { }

  ngOnInit(): void {
    if (this.mode === 'auth' && typeof window !== 'undefined' && window.localStorage) {
      const storedName = localStorage.getItem('gtea-proyecto-user_complete_name');
      if (storedName) {
        this.userName = storedName.split(' ')[0]; // Show first name only
      }
    }
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

  logout(): void {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.removeItem('userRole');
      localStorage.removeItem('gtea-proyecto-token');
      localStorage.removeItem('gtea-proyecto-email');
      localStorage.removeItem('gtea-proyecto-user_id');
      localStorage.removeItem('gtea-proyecto-user_complete_name');
      localStorage.removeItem('gtea-proyecto-group_name');
    }
    this.router.navigate(['/']);
  }
}
