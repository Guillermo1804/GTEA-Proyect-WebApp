import { Component, OnInit } from '@angular/core';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FacadeService, EMAIL_DOMAIN_REGEX } from '../../services/facade-service';
import { TopNavbar } from '../../partials/top-navbar/top-navbar';

@Component({
  selector: 'app-registro-screen',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, TopNavbar],
  templateUrl: './registro-screen.component.html',
  styleUrl: './registro-screen.component.scss',
})
export class RegistroScreenComponent implements OnInit {
  readonly form;
  errorMessage: string = '';
  successMessage: string = '';
  ngOnInit(): void {

  }
  constructor(
    private fb: FormBuilder,
    private facadeService: FacadeService,
    private router: Router,
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
      { validators: [this.facadeService.passwordsMatchValidator] },
    );
  }

  get passwordStrength(): { level: number; label: string } {
    return this.facadeService.getPasswordStrength(this.form.controls.password.value || '');
  }

  get showPasswordMismatch(): boolean {
    const { password, confirmPassword } = this.form.controls;
    return this.form.hasError('passwordMismatch') && (password.touched || confirmPassword.touched);
  }

  isInvalid(controlName: 'firstName' | 'lastName' | 'idNumber' | 'email' | 'password' | 'confirmPassword' | 'terms'): boolean {
    const control = this.form.controls[controlName];
    return !!(control?.invalid && (control.dirty || control.touched));
  }

  isSubmitting = false;
  showPassword = false;
  showConfirmPassword = false;

  get passwordsMatch(): boolean {
    const { password, confirmPassword } = this.form.controls;
    return !!password.value && !!confirmPassword.value && password.value === confirmPassword.value;
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
    }

    this.isSubmitting = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.facadeService.registroUsuario(this.form.getRawValue()).subscribe({
      next: (response) => {
        this.isSubmitting = false;
        this.successMessage = '¡Registro exitoso! Redirigiendo al login...';
        console.log('Registro exitoso:', response);
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
