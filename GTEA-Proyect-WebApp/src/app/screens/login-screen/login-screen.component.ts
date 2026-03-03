import { Component, OnInit } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FacadeService } from '../../services/facade-service';
import { TopNavbar } from '../../partials/top-navbar/top-navbar';

@Component({
  selector: 'app-login-screen',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TopNavbar],
  templateUrl: './login-screen.component.html',
  styleUrl: './login-screen.component.scss',
})
export class LoginScreenComponent implements OnInit {
  readonly form;
  errorMessage: string = '';
  successMessage: string = '';

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private facadeService: FacadeService,
  ) {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]],
      remember: [false],
    });
  }

  ngOnInit(): void {

  }

  // helpers
  get email() { return this.form.get('email'); }
  get password() { return this.form.get('password'); }

  login(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;

    this.errorMessage = '';
    this.successMessage = '';

    const emailValue = this.form.value.email || '';
    const passwordValue = this.form.value.password || '';

    // Validar con el servicio
    const errors = this.facadeService.validarLogin(emailValue, passwordValue);
    if (Object.keys(errors).length > 0) {
      this.errorMessage = Object.values(errors).join('. ');
      return;
    }

    // Llamar al endpoint de login
    this.facadeService.login(emailValue, passwordValue).subscribe({
      next: (response) => {
        // Guardar datos de sesión
        this.facadeService.saveUserData(response);
        this.successMessage = '¡Inicio de sesión exitoso!';

        // Navegar según rol
        const rol = response.rol || this.facadeService.getUserGroup();
        if (rol === 'administrador') {
          this.router.navigate(['/admin/dashboard']);
        } else {
          this.router.navigate(['/landing-screen']);
        }
      },
      error: (error) => {
        console.error('Error en login:', error);
        this.errorMessage = error?.error?.message || error?.error?.detail || 'Credenciales incorrectas. Intenta de nuevo.';
      },
    });
  }

  navigate(path: string): void {
    this.router.navigate([path]);
  }
}
