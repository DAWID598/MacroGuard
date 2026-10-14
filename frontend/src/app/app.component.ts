import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { AuthService } from './core/services/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterModule, MatToolbarModule, MatButtonModule, MatIconModule],
  template: `
    @if (authService.isAuthenticated()) {
      <mat-toolbar color="primary" class="top-nav">
        <div class="nav-inner">
          <a routerLink="/diary" class="brand-link">
            <mat-icon>fitness_center</mat-icon>
            <span>MacroGuard</span>
          </a>

          <div class="nav-links">
            <a mat-button routerLink="/diary" routerLinkActive="active-link">
              <mat-icon>menu_book</mat-icon>
              Dziennik (4 posiłki)
            </a>
            <a mat-button routerLink="/stats" routerLinkActive="active-link">
              <mat-icon>show_chart</mat-icon>
              Waga & Postępy
            </a>
            <a mat-button routerLink="/calculator" routerLinkActive="active-link">
              <mat-icon>calculate</mat-icon>
              Kalkulator BMR/TDEE
            </a>
            <a mat-button routerLink="/guide" routerLinkActive="active-link">
              <mat-icon>school</mat-icon>
              Baza Wiedzy
            </a>
          </div>

          <div class="user-actions">
            @if (authService.currentUser(); as user) {
              <span class="user-greeting">Cześć, <strong>{{ user.displayName }}</strong></span>
            }
            <button mat-stroked-button class="logout-btn" (click)="authService.logout()">
              <mat-icon>logout</mat-icon>
              Wyloguj
            </button>
          </div>
        </div>
      </mat-toolbar>
    }

    <main>
      <router-outlet></router-outlet>
    </main>
  `,
  styles: [`
    .top-nav {
      position: sticky;
      top: 0;
      z-index: 100;
      box-shadow: 0 2px 12px rgba(15, 23, 42, 0.12);
    }

    .nav-inner {
      max-width: 1180px;
      width: 100%;
      margin: 0 auto;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
    }

    .brand-link {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      color: #ffffff;
      text-decoration: none;
      font-weight: 700;
      font-size: 20px;
    }

    .nav-links {
      display: flex;
      align-items: center;
      gap: 6px;

      a {
        color: rgba(255, 255, 255, 0.88);
        border-radius: 8px;

        &.active-link {
          background: rgba(255, 255, 255, 0.18);
          color: #ffffff;
          font-weight: 600;
        }
      }
    }

    .user-actions {
      display: flex;
      align-items: center;
      gap: 12px;

      .user-greeting {
        font-size: 13.5px;
        opacity: 0.92;
      }

      .logout-btn {
        color: #ffffff;
        border-color: rgba(255, 255, 255, 0.45);
      }
    }

    @media (max-width: 720px) {
      .user-greeting {
        display: none;
      }
    }
  `]
})
export class AppComponent {
  readonly authService = inject(AuthService);
}
