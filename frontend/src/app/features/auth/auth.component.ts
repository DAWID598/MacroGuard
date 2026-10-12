import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTabsModule } from '@angular/material/tabs';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-auth',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatTabsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule,
    MatProgressSpinnerModule
  ],
  template: `
    <div class="auth-wrapper">
      <mat-card class="auth-card" appearance="outlined">
        <div class="brand-header">
          <div class="logo-circle">
            <mat-icon>fitness_center</mat-icon>
          </div>
          <h1>MacroGuard</h1>
          <p>Twój inteligentny dziennik kalorii, makroskładników i kalkulator BMR/TDEE</p>
        </div>

        <mat-tab-group animationDuration="200ms" dynamicHeight>
          <!-- LOGOWANIE -->
          <mat-tab label="Logowanie">
            <form [formGroup]="loginForm" (ngSubmit)="onLogin()" class="auth-form">
              <mat-form-field appearance="outline">
                <mat-label>Adres e-mail</mat-label>
                <input matInput type="email" formControlName="email" placeholder="jan@example.com" />
                <mat-icon matSuffix>mail_outline</mat-icon>
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Hasło</mat-label>
                <input matInput [type]="hidePassword() ? 'password' : 'text'" formControlName="password" />
                <button
                  type="button"
                  mat-icon-button
                  matSuffix
                  (click)="hidePassword.set(!hidePassword())"
                >
                  <mat-icon>{{ hidePassword() ? 'visibility_off' : 'visibility' }}</mat-icon>
                </button>
              </mat-form-field>

              <button
                mat-flat-button
                color="primary"
                type="submit"
                class="submit-btn"
                [disabled]="loginForm.invalid || isLoading()"
              >
                @if (isLoading()) {
                  <mat-spinner diameter="20"></mat-spinner>
                } @else {
                  Zaloguj się
                }
              </button>
            </form>
          </mat-tab>

          <!-- REJESTRACJA -->
          <mat-tab label="Rejestracja">
            <form [formGroup]="registerForm" (ngSubmit)="onRegister()" class="auth-form">
              <mat-form-field appearance="outline">
                <mat-label>Twoje imię / pseudonim</mat-label>
                <input matInput formControlName="displayName" placeholder="Dawid" />
                <mat-icon matSuffix>person_outline</mat-icon>
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Adres e-mail</mat-label>
                <input matInput type="email" formControlName="email" placeholder="dawid@example.com" />
                <mat-icon matSuffix>mail_outline</mat-icon>
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Hasło (min. 6 znaków)</mat-label>
                <input matInput [type]="hidePassword() ? 'password' : 'text'" formControlName="password" />
                <button
                  type="button"
                  mat-icon-button
                  matSuffix
                  (click)="hidePassword.set(!hidePassword())"
                >
                  <mat-icon>{{ hidePassword() ? 'visibility_off' : 'visibility' }}</mat-icon>
                </button>
              </mat-form-field>

              <button
                mat-flat-button
                color="primary"
                type="submit"
                class="submit-btn"
                [disabled]="registerForm.invalid || isLoading()"
              >
                @if (isLoading()) {
                  <mat-spinner diameter="20"></mat-spinner>
                } @else {
                  Utwórz darmowe konto
                }
              </button>
            </form>
          </mat-tab>
        </mat-tab-group>
      </mat-card>
    </div>
  `,
  styles: [`
    .auth-wrapper {
      min-height: calc(100vh - 80px);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 24px 16px;
    }

    .auth-card {
      width: 100%;
      max-width: 440px;
      padding: 28px 24px;
      border-radius: 16px;
      background: #ffffff;
      box-shadow: 0 10px 30px rgba(15, 23, 42, 0.08);
    }

    .brand-header {
      text-align: center;
      margin-bottom: 20px;

      .logo-circle {
        width: 56px;
        height: 56px;
        border-radius: 16px;
        background: linear-gradient(135deg, #3f51b5, #5c6bc0);
        color: #fff;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        margin-bottom: 12px;

        mat-icon {
          font-size: 30px;
          width: 30px;
          height: 30px;
        }
      }

      h1 {
        margin: 0 0 6px;
        font-size: 26px;
        font-weight: 700;
        color: #0f172a;
      }

      p {
        margin: 0;
        font-size: 13.5px;
        color: #64748b;
      }
    }

    .auth-form {
      display: flex;
      flex-direction: column;
      gap: 6px;
      padding-top: 20px;
    }

    .submit-btn {
      height: 46px;
      font-size: 15px;
      font-weight: 600;
      margin-top: 8px;
      border-radius: 10px;
    }
  `]
})
export class AuthComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);

  readonly hidePassword = signal(true);
  readonly isLoading = signal(false);

  readonly loginForm = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]]
  });

  readonly registerForm = this.fb.nonNullable.group({
    displayName: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]]
  });

  onLogin(): void {
    if (this.loginForm.invalid) return;
    this.isLoading.set(true);
    const { email, password } = this.loginForm.getRawValue();

    this.authService.login(email, password).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.snackBar.open('Zalogowano pomyślnie!', 'OK', { duration: 2500 });
        this.router.navigate(['/diary']);
      },
      error: (err) => {
        this.isLoading.set(false);
        const msg = err?.error?.message ?? 'Nie udało się zalogować. Sprawdź dane lub połączenie z API.';
        this.snackBar.open(msg, 'Zamknij', { duration: 4000 });
      }
    });
  }

  onRegister(): void {
    if (this.registerForm.invalid) return;
    this.isLoading.set(true);
    const { email, password, displayName } = this.registerForm.getRawValue();

    this.authService.register(email, password, displayName).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.snackBar.open('Konto utworzone! Możesz teraz skonfigurować cele BMR/TDEE.', 'Super', {
          duration: 3500
        });
        this.router.navigate(['/calculator']);
      },
      error: (err) => {
        this.isLoading.set(false);
        const msg = err?.error?.message ?? 'Błąd podczas rejestracji konta.';
        this.snackBar.open(msg, 'Zamknij', { duration: 4000 });
      }
    });
  }
}

