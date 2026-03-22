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

  toggleTerms(): void {
    const termsControl = this.form.controls.terms;
    termsControl.setValue(!termsControl.value);
    termsControl.markAsTouched();
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.facadeService.registroUsuario(this.form.getRawValue()).subscribe({
      next: (response) => {
        this.isSubmitting = false;
        this.successMessage = '¡Registro exitoso! Redirigiendo al login...';
        // Registro exitoso — navegar al login
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
  public soloLetras(event: KeyboardEvent) {
      const charCode = event.key.charCodeAt(0);
      // Permitir solo letras (mayúsculas y minúsculas) y espacio
      if (
        !(charCode >= 65 && charCode <= 90) &&  // Letras mayúsculas
        !(charCode >= 97 && charCode <= 122) && // Letras minúsculas
        charCode !== 32                         // Espacio
      ) {
        event.preventDefault();
      }
    }
public soloNumeros(event: KeyboardEvent) {
  const input = event.target as HTMLInputElement;
  const valorActual = input.value;

  // 1. Permitir solo números (0-9) usando Regex
  if (!/^[0-9]$/.test(event.key)) {
    event.preventDefault();
    return;
  }

  // 2. Si ya hay 9 dígitos, bloquear cualquier número adicional
  if (valorActual.length >= 9) {
    event.preventDefault();
  }
}
}
