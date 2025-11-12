import { Injectable, inject } from '@angular/core';
import { PixelDto } from '../models/api.model';
import { AuthService } from './auth.service';
import { RealtimeService } from './realtime.service';
import { CooldownService } from './cooldown.service';
import { StatusService } from './status.service';
import { ConfigService } from './config.service';
import { CanvasStateService } from './canvas-state.service';
import { UserStateService } from './user-state.service';

export type PlacementResult = 'sent' | 'skipped' | 'not-authenticated' | 'invalid';

@Injectable({ providedIn: 'root' })
export class PixelPlacementService {
  private readonly authService = inject(AuthService);
  private readonly realtimeService = inject(RealtimeService);
  private readonly cooldownService = inject(CooldownService);
  private readonly statusService = inject(StatusService);
  private readonly configService = inject(ConfigService);
  private readonly canvasState = inject(CanvasStateService);
  private readonly userState = inject(UserStateService);

  requestPlacement(pixel: PixelDto): PlacementResult {
    if (!this.authService.isAuthenticated()) {
      this.statusService.push('Sign in to place pixels.', 'warning');
      return 'not-authenticated';
    }

    if (this.canvasState.historyMode()) {
      this.statusService.push('Cannot place pixels while viewing history. Reset to current state first.', 'warning');
      return 'invalid';
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


