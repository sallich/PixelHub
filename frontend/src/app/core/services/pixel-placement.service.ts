import { Injectable, inject, signal } from '@angular/core';
import { PixelDto } from '../models/api.model';
import { AuthService } from './auth.service';
import { RealtimeService } from './realtime.service';
import { CooldownService } from './cooldown.service';
import { StatusService } from './status.service';
import { ConfigService } from './config.service';
import { CanvasStateService } from './canvas-state.service';
import { UserStateService } from './user-state.service';

export type PlacementResult = 'sent' | 'skipped' | 'not-authenticated' | 'invalid' | 'disabled';

@Injectable({ providedIn: 'root' })
export class PixelPlacementService {
  private readonly authService = inject(AuthService);
  private readonly realtimeService = inject(RealtimeService);
  private readonly cooldownService = inject(CooldownService);
  private readonly statusService = inject(StatusService);
  private readonly configService = inject(ConfigService);
  private readonly canvasState = inject(CanvasStateService);
  private readonly userState = inject(UserStateService);

  private readonly _placingEnabled = signal(true);

  placingEnabled() {
    return this._placingEnabled();
  }

  setPlacingEnabled(enabled: boolean): void {
    this._placingEnabled.set(enabled);
    this.canvasState.setPlacementEnabled(enabled);
  }

  togglePlacement(): void {
    this.setPlacingEnabled(!this._placingEnabled());
    this.statusService.push(this._placingEnabled() ? 'Placement enabled.' : 'Placement disabled. Pan mode only.', 'info');
  }

  requestPlacement(pixel: PixelDto): PlacementResult {
    if (!this._placingEnabled()) {
      return 'disabled';
    }

    if (!this.authService.isAuthenticated()) {
      this.statusService.push('Sign in to place pixels.', 'warning');
      return 'not-authenticated';
    }

    if (!this.canvasState.isValidPixel(pixel)) {
      this.statusService.push('Click inside the canvas bounds.', 'warning');
      return 'invalid';
    }

    if (this.cooldownService.isActive()) {
      this.statusService.push('Cooldown active. Pixel skipped.', 'warning');
      return 'skipped';
    }

    const sent = this.sendPixel(pixel);
    return sent ? 'sent' : 'skipped';
  }

  private sendPixel(pixel: PixelDto): boolean {
    try {
      this.realtimeService.sendPixel(pixel);
      const rate = this.configService.config().rateLimitSeconds;
      console.log('rate', rate);
      this.cooldownService.start(rate);
      this.userState.incrementPixelCount();
      this.statusService.push(`Placed pixel at (${pixel.x}, ${pixel.y}).`, 'success');
      return true;
    } catch (error) {
      console.error(error);
      this.statusService.push('Failed to send pixel.', 'error');
      return false;
    }
  }
}


