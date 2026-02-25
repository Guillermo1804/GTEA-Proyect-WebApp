import { Component } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { first } from 'rxjs';
import { FacadeService } from '../../services/facade-service';
// CookieService removed (was 'ngx-cookie-service')
import { Inject, PLATFORM_ID } from '@angular/core'; // Añade Inject y PLATFORM_ID
import { isPlatformBrowser } from '@angular/common'; // Añade esto


const EMAIL_DOMAIN_REGEX = /^[^@\s]+@(alumno|admin|organizador)\.com$/i;
@Component({
  selector: 'app-registro-screen',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './registro-screen.component.html',
  styleUrl: './registro-screen.component.scss',
})
export class RegistroScreenComponent {
  readonly form;
  errorMessage: string = '';
  successMessage: string = '';

  constructor(
    private fb: FormBuilder,
    private facadeService: FacadeService,
    private router: Router,
    // cookie handling removed: private cookieService: CookieService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.form = this.fb.nonNullable.group(
      {
        
        firstName: ['', [Validators.required, Validators.minLength(2)]],
        lastName: ['', [Validators.required, Validators.minLength(2)]],
        idNumber: ['', [Validators.required, Validators.pattern(/^\d{9}$/)]],
        email: [
          '',
          [Validators.required, Validators.email, Validators.pattern(EMAIL_DOMAIN_REGEX)],
        ],
        password: ['', [Validators.required, Validators.minLength(8)]],
        confirmPassword: ['', [Validators.required]],
        terms: [false, [Validators.requiredTrue]],
      },
      { validators: [this.passwordsMatchValidator] },
    );
  }
  

  get passwordStrength(): { level: number; label: string } {
    const value = this.form.controls.password.value || '';
    let score = 0;

    if (value.length >= 8) score += 1;
    if (value.length >= 12) score += 1;
    if (/[A-Z]/.test(value)) score += 1;
    if (/[0-9]/.test(value)) score += 1;
    if (/[^A-Za-z0-9]/.test(value)) score += 1;

    const level = Math.min(4, score);
    const labels = ['Muy debil', 'Debil', 'Medio', 'Fuerte', 'Muy fuerte'];

    return { level, label: labels[level] };
  }
  get showPasswordMismatch(): boolean {
    const { password, confirmPassword } = this.form.controls;
    return this.form.hasError('passwordMismatch') && (password.touched || confirmPassword.touched);
  }
  isInvalid(controlName: 'firstName' | 'lastName' | 'idNumber' | 'email' | 'password' | 'confirmPassword' | 'terms'): boolean {
    const control = this.form.controls[controlName];
    return !!(control?.invalid && (control.dirty || control.touched));
  }

  private passwordsMatchValidator(control: AbstractControl): ValidationErrors | null {
    const password = control.get('password')?.value;
    const confirmPassword = control.get('confirmPassword')?.value;
    return password && confirmPassword && password !== confirmPassword
      ? { passwordMismatch: true }
      : null;
  }
  isSubmitting = false;

  onSubmit(): void {
    // Allow submission even if the form is invalid so backend/DB connectivity can be tested.
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      // continue instead of returning to call the backend regardless of client validation
    }

    this.isSubmitting = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.facadeService.registroUsuario(this.form.getRawValue()).subscribe({
      next: (response) => {
        this.isSubmitting = false;
        this.successMessage = '¡Registro exitoso! Redirigiendo al login...';
        console.log('Registro exitoso:', response);

// --- CAMBIO AQUÍ ---
    // Cookie write removed (ngx-cookie-service was uninstalled)
    // -------------------        // Redirigir al login después de 2 segundos
        setTimeout(() => {
          this.router.navigate(['/login']);
        }, 2000);
      },
      error: (error) => {
        this.isSubmitting = false;
        console.error('Error en registro:', error);
        this.errorMessage = error?.error?.message || error?.error?.detail || 'Error al registrar usuario. Intenta de nuevo.';
      },
    });
  }
  
  navigate(path: string): void {
    this.router.navigate([path]);
  }
}
