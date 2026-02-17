import { Component } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule, FormGroup } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-login-screen',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './login-screen.component.html',
  styleUrl: './login-screen.component.scss',
})
export class LoginScreenComponent {
  form!: FormGroup;

  constructor(private fb: FormBuilder, private router: Router) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]],
      remember: [false],
    });
  }
  // helpers
  get email() { return this.form.get('email'); }
  get password() { return this.form.get('password'); }

  login(): void {
    // fuerza a mostrar errores
    this.form.markAllAsTouched();

    if (this.form.invalid) return;

    // aquí iría tu llamada al backend
    // this.router.navigate(['home']);
    console.log('login ok', this.form.value);
  }
}
