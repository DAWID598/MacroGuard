import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class DiaryStateService {
  readonly activeMealsCount = signal<number>(this.getInitialCount());

  private getInitialCount(): number {
    try {
      const raw = localStorage.getItem('macroguard_persistent_meals');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          return 4 + parsed.length;
        }
      }
    } catch {}
    return 4;
  }

  updateMealsCount(count: number): void {
    if (count > 0 && this.activeMealsCount() !== count) {
      this.activeMealsCount.set(count);
    }
  }
}

