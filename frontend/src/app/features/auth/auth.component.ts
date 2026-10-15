import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
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

        <mat-tab-group
          [selectedIndex]="selectedTabIndex()"
          (selectedIndexChange)="selectedTabIndex.set($event)"
          animationDuration="200ms"
          dynamicHeight
        >
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

              <div class="forgot-link-wrapper">
                <button
                  type="button"
                  mat-button
                  color="primary"
                  class="forgot-link-btn"
                  (click)="openForgotPasswordTab()"
                >
                  Nie pamiętasz hasła?
                </button>
              </div>

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
                <mat-label>Hasło (min. 10 znaków)</mat-label>
                <input matInput [type]="hidePassword() ? 'password' : 'text'" formControlName="password" />
                <button
                  type="button"
                  mat-icon-button
                  matSuffix
                  (click)="hidePassword.set(!hidePassword())"
                >
                  <mat-icon>{{ hidePassword() ? 'visibility_off' : 'visibility' }}</mat-icon>
                </button>
                @if (registerForm.controls.password.touched && registerForm.controls.password.invalid) {
                  <mat-error>Hasło nie spełnia wymogów bezpieczeństwa</mat-error>
                }
              </mat-form-field>

              @if ((registerForm.controls.password.value || '').length > 0) {
                <div class="password-criteria-box">
                  <div class="crit-title">Wymagania dotyczące hasła:</div>
                  <div class="crit-grid">
                    <div class="crit-item" [class.valid]="checkPasswordCriteria(registerForm.controls.password.value).hasMinLength">
                      <mat-icon>{{ checkPasswordCriteria(registerForm.controls.password.value).hasMinLength ? 'check_circle' : 'radio_button_unchecked' }}</mat-icon>
                      <span>Min. 10 znaków</span>
                    </div>
                    <div class="crit-item" [class.valid]="checkPasswordCriteria(registerForm.controls.password.value).hasUpper">
                      <mat-icon>{{ checkPasswordCriteria(registerForm.controls.password.value).hasUpper ? 'check_circle' : 'radio_button_unchecked' }}</mat-icon>
                      <span>Wielka litera (A-Z)</span>
                    </div>
                    <div class="crit-item" [class.valid]="checkPasswordCriteria(registerForm.controls.password.value).hasLower">
                      <mat-icon>{{ checkPasswordCriteria(registerForm.controls.password.value).hasLower ? 'check_circle' : 'radio_button_unchecked' }}</mat-icon>
                      <span>Mała litera (a-z)</span>
                    </div>
                    <div class="crit-item" [class.valid]="checkPasswordCriteria(registerForm.controls.password.value).hasDigit">
                      <mat-icon>{{ checkPasswordCriteria(registerForm.controls.password.value).hasDigit ? 'check_circle' : 'radio_button_unchecked' }}</mat-icon>
                      <span>Cyfra (0-9)</span>
                    </div>
                    <div class="crit-item" [class.valid]="checkPasswordCriteria(registerForm.controls.password.value).hasSpecial">
                      <mat-icon>{{ checkPasswordCriteria(registerForm.controls.password.value).hasSpecial ? 'check_circle' : 'radio_button_unchecked' }}</mat-icon>
                      <span>Znak specjalny (np. !, &#64;, #, $, *)</span>
                    </div>
                  </div>
                </div>
              }

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

          <!-- RESET HASŁA -->
          <mat-tab label="Reset hasła">
            <div class="auth-form">
              @if (resetStep() === 1) {
                <p class="reset-desc">
                  Podaj adres e-mail przypisany do Twojego konta. Wyślemy na niego bezpieczną wiadomość z linkiem do zresetowania hasła.
                </p>

                <form [formGroup]="forgotForm" (ngSubmit)="onSendResetToken()">
                  <mat-form-field appearance="outline" class="w-100">
                    <mat-label>Adres e-mail</mat-label>
                    <input matInput type="email" formControlName="email" placeholder="jan@example.com" />
                    <mat-icon matSuffix>mail_outline</mat-icon>
                  </mat-form-field>

                  <button
                    mat-flat-button
                    color="primary"
                    type="submit"
                    class="submit-btn"
                    [disabled]="forgotForm.invalid || isLoading()"
                  >
                    @if (isLoading()) {
                      <mat-spinner diameter="20"></mat-spinner>
                    } @else {
                      Wyślij link resetujący na e-mail
                    }
                  </button>
                </form>
              } @else {
                <div class="email-notice-card">
                  <mat-icon color="primary">mark_email_read</mat-icon>
                  <div>
                    <strong>Wiadomość została wysłana!</strong>
                    <p>Sprawdź swoją skrzynkę pocztową i kliknij w otrzymany link lub wklej poniżej token z wiadomości.</p>
                  </div>
                </div>

                <form [formGroup]="resetForm" (ngSubmit)="onResetPassword()">
                  <mat-form-field appearance="outline" class="w-100">
                    <mat-label>Adres e-mail</mat-label>
                    <input matInput type="email" formControlName="email" />
                    <mat-icon matSuffix>mail_outline</mat-icon>
                  </mat-form-field>

                  <mat-form-field appearance="outline" class="w-100">
                    <mat-label>Token resetujący (z wiadomości e-mail)</mat-label>
                    <input matInput formControlName="token" placeholder="Wklej token resetujący" />
                    <mat-icon matSuffix>vpn_key</mat-icon>
                  </mat-form-field>

                  <mat-form-field appearance="outline" class="w-100">
                    <mat-label>Nowe hasło (min. 10 znaków)</mat-label>
                    <input
                      matInput
                      [type]="hidePassword() ? 'password' : 'text'"
                      formControlName="newPassword"
                    />
                    <button
                      type="button"
                      mat-icon-button
                      matSuffix
                      (click)="hidePassword.set(!hidePassword())"
                    >
                      <mat-icon>{{ hidePassword() ? 'visibility_off' : 'visibility' }}</mat-icon>
                    </button>
                    @if (resetForm.controls.newPassword.touched && resetForm.controls.newPassword.invalid) {
                      <mat-error>Nowe hasło nie spełnia wymogów bezpieczeństwa</mat-error>
                    }
                  </mat-form-field>

                  @if ((resetForm.controls.newPassword.value || '').length > 0) {
                    <div class="password-criteria-box">
                      <div class="crit-title">Wymagania dotyczące nowego hasła:</div>
                      <div class="crit-grid">
                        <div class="crit-item" [class.valid]="checkPasswordCriteria(resetForm.controls.newPassword.value).hasMinLength">
                          <mat-icon>{{ checkPasswordCriteria(resetForm.controls.newPassword.value).hasMinLength ? 'check_circle' : 'radio_button_unchecked' }}</mat-icon>
                          <span>Min. 10 znaków</span>
                        </div>
                        <div class="crit-item" [class.valid]="checkPasswordCriteria(resetForm.controls.newPassword.value).hasUpper">
                          <mat-icon>{{ checkPasswordCriteria(resetForm.controls.newPassword.value).hasUpper ? 'check_circle' : 'radio_button_unchecked' }}</mat-icon>
                          <span>Wielka litera (A-Z)</span>
                        </div>
                        <div class="crit-item" [class.valid]="checkPasswordCriteria(resetForm.controls.newPassword.value).hasLower">
                          <mat-icon>{{ checkPasswordCriteria(resetForm.controls.newPassword.value).hasLower ? 'check_circle' : 'radio_button_unchecked' }}</mat-icon>
                          <span>Mała litera (a-z)</span>
                        </div>
                        <div class="crit-item" [class.valid]="checkPasswordCriteria(resetForm.controls.newPassword.value).hasDigit">
                          <mat-icon>{{ checkPasswordCriteria(resetForm.controls.newPassword.value).hasDigit ? 'check_circle' : 'radio_button_unchecked' }}</mat-icon>
                          <span>Cyfra (0-9)</span>
                        </div>
                        <div class="crit-item" [class.valid]="checkPasswordCriteria(resetForm.controls.newPassword.value).hasSpecial">
                          <mat-icon>{{ checkPasswordCriteria(resetForm.controls.newPassword.value).hasSpecial ? 'check_circle' : 'radio_button_unchecked' }}</mat-icon>
                          <span>Znak specjalny (np. !, &#64;, #, $, *)</span>
                        </div>
                      </div>
                    </div>
                  }

                  <button
                    mat-flat-button
                    color="primary"
                    type="submit"
                    class="submit-btn"
                    [disabled]="resetForm.invalid || isLoading()"
                  >
                    @if (isLoading()) {
                      <mat-spinner diameter="20"></mat-spinner>
                    } @else {
                      Ustaw nowe hasło
                    }
                  </button>

                  <button
                    type="button"
                    mat-button
                    (click)="resetStep.set(1)"
                    class="back-btn"
                  >
                    <mat-icon>arrow_back</mat-icon>
                    Wróć do wpisywania e-maila
                  </button>
                </form>
              }
            </div>
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

    .w-100 {
      width: 100%;
    }

    .forgot-link-wrapper {
      display: flex;
      justify-content: flex-end;
      margin-top: -6px;
      margin-bottom: 4px;
    }

    .forgot-link-btn {
      font-size: 13px;
      font-weight: 500;
      padding: 0 6px;
    }

    .reset-desc {
      font-size: 13.5px;
      color: #64748b;
      line-height: 1.45;
      margin: 0 0 14px;
    }

    .email-notice-card {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      background: #eef2ff;
      border: 1px solid #c7d2fe;
      border-radius: 10px;
      padding: 12px 14px;
      margin-bottom: 14px;

      strong {
        display: block;
        font-size: 13.5px;
        color: #312e81;
        margin-bottom: 2px;
      }

      p {
        margin: 0;
        font-size: 12.5px;
        color: #4338ca;
        line-height: 1.4;
      }
    }

    .password-criteria-box {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      padding: 10px 14px;
      margin-bottom: 16px;
      font-size: 12.5px;

      .crit-title {
        font-weight: 600;
        color: #475569;
        margin-bottom: 6px;
      }

      .crit-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 4px 10px;
      }

      .crit-item {
        display: flex;
        align-items: center;
        gap: 5px;
        color: #94a3b8;
        font-size: 12px;
        transition: color 0.15s ease;

        mat-icon {
          font-size: 15px;
          width: 15px;
          height: 15px;
        }

        &.valid {
          color: #16a34a;
          font-weight: 600;

          mat-icon {
            color: #16a34a;
          }
        }
      }
    }

    .submit-btn {
      width: 100%;
      height: 46px;
      font-size: 15px;
      font-weight: 600;
      margin-top: 8px;
      border-radius: 10px;
    }

    .back-btn {
      width: 100%;
      margin-top: 8px;
    }
  `]
})
export class AuthComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly snackBar = inject(MatSnackBar);

  readonly selectedTabIndex = signal(0);
  readonly resetStep = signal(1);
  readonly hidePassword = signal(true);
  readonly isLoading = signal(false);

  readonly passwordValidators = [
    Validators.required,
    Validators.minLength(10),
    Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z0-9]).{10,}$/)
  ];

  checkPasswordCriteria(pwd: string | null | undefined) {
    const val = pwd || '';
    return {
      hasMinLength: val.length >= 10,
      hasUpper: /[A-Z]/.test(val),
      hasLower: /[a-z]/.test(val),
      hasDigit: /\d/.test(val),
      hasSpecial: /[^a-zA-Z0-9]/.test(val)
    };
  }

  readonly loginForm = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]]
  });

  readonly registerForm = this.fb.nonNullable.group({
    displayName: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', this.passwordValidators]
  });

  readonly forgotForm = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]]
  });

  readonly resetForm = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    token: ['', [Validators.required]],
    newPassword: ['', this.passwordValidators]
  });

  ngOnInit(): void {
    this.route.queryParamMap.subscribe((params) => {
      const tab = params.get('tab');
      const email = params.get('email');
      const token = params.get('token');

      if (email && token) {
        this.resetForm.patchValue({ email, token });
        this.resetStep.set(2);
        this.selectedTabIndex.set(2);
        this.snackBar.open('Token zweryfikowany z linku! Wprowadź nowe hasło.', 'OK', { duration: 4000 });
      } else if (tab === 'reset') {
        if (email) {
          this.forgotForm.patchValue({ email });
        }
        this.selectedTabIndex.set(2);
      }
    });
  }

  openForgotPasswordTab(): void {
    const currentEmail = this.loginForm.controls.email.value;
    if (currentEmail) {
      this.forgotForm.patchValue({ email: currentEmail });
    }
    this.resetStep.set(1);
    this.selectedTabIndex.set(2);
  }

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
        const msg = err?.error?.message ?? 'Nieprawidłowy adres e-mail lub hasło.';
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

  onSendResetToken(): void {
    if (this.forgotForm.invalid) return;
    this.isLoading.set(true);
    const email = this.forgotForm.controls.email.value;

    this.authService.forgotPassword(email).subscribe({
      next: (res) => {
        this.isLoading.set(false);
        this.resetForm.patchValue({ email });
        this.resetStep.set(2);
        this.snackBar.open(
          res.message ?? 'Wysłaliśmy wiadomość e-mail z linkiem do zresetowania hasła!',
          'OK',
          { duration: 6000 }
        );
      },
      error: (err) => {
        this.isLoading.set(false);
        const msg = err?.error?.message ?? 'Błąd podczas wysyłania wiadomości z resetem hasła.';
        this.snackBar.open(msg, 'Zamknij', { duration: 5000 });
      }
    });
  }

  onResetPassword(): void {
    if (this.resetForm.invalid) return;
    this.isLoading.set(true);
    const { email, token, newPassword } = this.resetForm.getRawValue();

    this.authService.resetPassword(email, token, newPassword).subscribe({
      next: (res) => {
        this.isLoading.set(false);
        this.snackBar.open(res.message ?? 'Hasło zostało pomyślnie zmienione! Możesz się zalogować.', 'Super', {
          duration: 4000
        });
        this.loginForm.patchValue({ email, password: newPassword });
        this.resetStep.set(1);
        this.selectedTabIndex.set(0);
      },
      error: (err) => {
        this.isLoading.set(false);
        const msg = err?.error?.message ?? 'Nie udało się zresetować hasła. Upewnij się, że token jest poprawny.';
        this.snackBar.open(msg, 'Zamknij', { duration: 5000 });
      }
    });
  }
}
