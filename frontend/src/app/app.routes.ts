import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { AuthComponent } from './features/auth/auth.component';
import { CalculatorComponent } from './features/calculator/calculator.component';
import { DiaryComponent } from './features/diary/diary.component';

export const routes: Routes = [
  { path: 'auth', component: AuthComponent },
  { path: 'diary', component: DiaryComponent, canActivate: [authGuard] },
  { path: 'calculator', component: CalculatorComponent, canActivate: [authGuard] },
  { path: '', pathMatch: 'full', redirectTo: 'diary' },
  { path: '**', redirectTo: 'diary' }
];
