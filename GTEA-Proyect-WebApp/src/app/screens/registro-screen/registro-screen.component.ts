import { Component } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { RouterLink } from '@angular/router';
const EMAIL_DOMAIN_REGEX = /^[^@\s]+@(alumno|admin|organizador)\.com$/i;
@Component({
  selector: 'app-registro-screen',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './registro-screen.component.html',
  styleUrl: './registro-screen.component.scss',
})
export class RegistroScreenComponent {
  readonly form;

  constructor(private fb: FormBuilder) {
    this.form = this.fb.nonNullable.group(
      {
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
  isInvalid(controlName: 'email' | 'password' | 'confirmPassword' | 'terms'): boolean {
    const control = this.form.controls[controlName];
    return control.invalid && (control.dirty || control.touched);
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
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    setTimeout(() => {
      this.isSubmitting = false;
      console.log('Registro', this.form.getRawValue());
  }, 1000);}
}
