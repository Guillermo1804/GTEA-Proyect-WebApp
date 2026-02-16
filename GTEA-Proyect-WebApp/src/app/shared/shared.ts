// src/app/shared/shared.ts

import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';

export const SHARED_IMPORTS = [
  CommonModule,
  ReactiveFormsModule,
  RouterLink,

  MatFormFieldModule,
  MatInputModule,
  MatIconModule,
  MatButtonModule,
  MatSlideToggleModule,
];
