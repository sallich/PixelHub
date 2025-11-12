import { Injectable, computed, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class CooldownService {
  private readonly _cooldownUntil = signal<number | null>(null);
  private readonly _timerId = signal<number | null>(null);
  private readonly _remainingSeconds = signal(0); // Прямой signal для оставшегося времени

  readonly remainingSeconds = computed(() => this._remainingSeconds());
  readonly isActive = computed(() => this._remainingSeconds() > 0);

  start(seconds: number): void {
    this.stop();
    const until = Date.now() + seconds * 1000;
    this._cooldownUntil.set(until);
    
    // Обновляем каждые 100ms для плавного уменьшения по 0.1 секунды
    const id = window.setInterval(() => {
      const now = Date.now();
      const remaining = until - now;
      
      if (remaining <= 0) {
        this._remainingSeconds.set(0);
        this.stop();
      } else {
        // Вычисляем значение с точностью до 0.1 секунды, округляя вниз
        const secondsRemaining = Math.max(0, Math.floor(remaining / 100) / 10);
        this._remainingSeconds.set(secondsRemaining);
      }
    }, 100);
    this._timerId.set(id);
    
    // Устанавливаем начальное значение
    const initialRemaining = Math.max(0, Math.floor((until - Date.now()) / 100) / 10);
    this._remainingSeconds.set(initialRemaining);
  }

  stop(): void {
    const id = this._timerId();
    if (id !== null) {
      window.clearInterval(id);
      this._timerId.set(null);
    }
    this._cooldownUntil.set(null);
    this._remainingSeconds.set(0);
  }
}


