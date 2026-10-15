import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { AuthResponse, ConfirmEmailResponse, ForgotPasswordResponse, RegisterResponse } from '../models/api.models';

const STORAGE_KEY = 'macroguard_auth';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly apiUrl = 'http://localhost:5000/api/auth';

  readonly currentUser = signal<AuthResponse | null>(this.loadFromStorage());
  readonly isAuthenticated = computed(() => !!this.currentUser()?.token);

  login(email: string, password: string): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.apiUrl}/login`, { email, password })
      .pipe(tap((res) => this.setSession(res)));
  }

  register(email: string, password: string, displayName: string): Observable<RegisterResponse> {
    return this.http.post<RegisterResponse>(`${this.apiUrl}/register`, { email, password, displayName });
  }

  confirmEmail(email: string, token: string): Observable<ConfirmEmailResponse> {
    return this.http.post<ConfirmEmailResponse>(`${this.apiUrl}/confirm-email`, { email, token });
  }

  resendConfirmationEmail(email: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.apiUrl}/resend-confirmation-email`, { email });
  }

  forgotPassword(email: string): Observable<ForgotPasswordResponse> {
    return this.http.post<ForgotPasswordResponse>(`${this.apiUrl}/forgot-password`, { email });
  }

  resetPassword(email: string, token: string, newPassword: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.apiUrl}/reset-password`, {
      email,
      token,
      newPassword
    });
  }

  logout(): void {
    localStorage.removeItem(STORAGE_KEY);
    this.currentUser.set(null);
    this.router.navigate(['/auth']);
  }

  getToken(): string | null {
    return this.currentUser()?.token ?? null;
  }

  private setSession(auth: AuthResponse): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(auth));
    this.currentUser.set(auth);
  }

  private loadFromStorage(): AuthResponse | null {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? (JSON.parse(raw) as AuthResponse) : null;
    } catch {
      return null;
    }
  }
}

