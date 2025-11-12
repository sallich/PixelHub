import { Injectable, computed, signal } from '@angular/core';
import { PixelDto } from '../models/api.model';
import { PALETTE_HEX } from '../constants/palette.constants';
import { AppConfig } from '../models/app-config.model';

interface RGBAColor {
  r: number;
  g: number;
  b: number;
  a: number;
}

const PALETTE_RGBA: RGBAColor[] = PALETTE_HEX.map(hexToRgba);
const BACKGROUND_COLOR_HEX = '#ffffff';
const BACKGROUND_COLOR_INDEX = (() => {
  const index = PALETTE_HEX.findIndex(
    (value) => value.toLowerCase() === BACKGROUND_COLOR_HEX
  );
  return index >= 0 ? index : 0;
})();

@Injectable({ providedIn: 'root' })
export class CanvasStateService {
  readonly palette = PALETTE_HEX;

  private readonly _selectedColor = signal(0);

  private boardWidth = 0;
  private boardHeight = 0;
  private boardData: Uint8Array = new Uint8Array(0);
  private offscreenCanvas: HTMLCanvasElement | null = null;
  private offscreenCtx: CanvasRenderingContext2D | null = null;
  private imageData: ImageData | null = null;
  private imageRevision = signal(0);
  private readonly _historyMode = signal(false);
  private readonly _historyTimestamp = signal<string | null>(null);

  readonly selectedColor = computed(() => this._selectedColor());
  readonly revision = computed(() => this.imageRevision());
  readonly historyMode = computed(() => this._historyMode());
  readonly historyTimestamp = computed(() => this._historyTimestamp());

  initializeBoard(config: Pick<AppConfig, 'canvasWidth' | 'canvasHeight'>): void {
    this.boardWidth = config.canvasWidth;
    this.boardHeight = config.canvasHeight;
    this.boardData = new Uint8Array(this.boardWidth * this.boardHeight);

    this.offscreenCanvas = document.createElement('canvas');
    this.offscreenCanvas.width = this.boardWidth;
    this.offscreenCanvas.height = this.boardHeight;
    this.offscreenCtx = this.offscreenCanvas.getContext('2d', { willReadFrequently: true });
    if (this.offscreenCtx) {
      this.imageData = this.offscreenCtx.createImageData(this.boardWidth, this.boardHeight);
    }
    this.clearBoard();
  }

  getDimensions(): { width: number; height: number } {
    return { width: this.boardWidth, height: this.boardHeight };
  }

  setSelectedColor(index: number): void {
    if (index >= 0 && index < this.palette.length) {
      this._selectedColor.set(index);
    }
  }

  loadPixels(pixels: PixelDto[]): void {
    if (!this.imageData) return;
    this.clearBoard();
    for (const pixel of pixels) {
      this.applyPixel(pixel, false);
    }
    this.commitImageData();
  }

  applyPixel(pixel: PixelDto, commit = true): void {
    if (!this.isValidPixel(pixel)) {
      return;
    }
    if (!this.imageData) {
      return;
    }
    const idx = pixel.y * this.boardWidth + pixel.x;
    this.boardData[idx] = pixel.c;

    const { r, g, b, a } = PALETTE_RGBA[pixel.c] ?? PALETTE_RGBA[BACKGROUND_COLOR_INDEX];
    const pointer = idx * 4;
    this.imageData.data[pointer] = r;
    this.imageData.data[pointer + 1] = g;
    this.imageData.data[pointer + 2] = b;
    this.imageData.data[pointer + 3] = a;

    if (commit) {
      this.commitImageData();
    }
  }

  getOffscreenCanvas(): HTMLCanvasElement | null {
    return this.offscreenCanvas;
  }

  getImageData(): ImageData | null {
    return this.imageData;
  }

  clearBoard(): void {
    this.boardData.fill(BACKGROUND_COLOR_INDEX);
    if (this.imageData) {
      const { r, g, b, a } = PALETTE_RGBA[BACKGROUND_COLOR_INDEX];
      const data = this.imageData.data;
      for (let i = 0; i < data.length; i += 4) {
        data[i] = r;
        data[i + 1] = g;
        data[i + 2] = b;
        data[i + 3] = a;
      }
      this.commitImageData();
    }
  }

  isValidPixel(pixel: PixelDto): boolean {
    return (
      Number.isInteger(pixel.x) &&
      Number.isInteger(pixel.y) &&
      Number.isInteger(pixel.c) &&
      pixel.x >= 0 &&
      pixel.y >= 0 &&
      pixel.x < this.boardWidth &&
      pixel.y < this.boardHeight &&
      pixel.c >= 0 &&
      pixel.c < this.palette.length
    );
  }

  setHistoryMode(enabled: boolean, timestamp: string | null = null): void {
    this._historyMode.set(enabled);
    this._historyTimestamp.set(timestamp);
  }

  resetToCurrent(): void {
    this._historyMode.set(false);
    this._historyTimestamp.set(null);
  }

  private commitImageData(): void {
    if (!this.offscreenCtx || !this.imageData) return;
    this.offscreenCtx.putImageData(this.imageData, 0, 0);
    this.imageRevision.update((rev) => rev + 1);
  }
}

function hexToRgba(hex: string): RGBAColor {
  const normalized = hex.replace('#', '');
  const len = normalized.length;
  let r: number;
  let g: number;
  let b: number;
  if (len === 3) {
    r = parseInt(normalized[0] + normalized[0], 16);
    g = parseInt(normalized[1] + normalized[1], 16);
    b = parseInt(normalized[2] + normalized[2], 16);
  } else {
    const bigint = Number.parseInt(normalized, 16);
    r = (bigint >> 16) & 0xff;
    g = (bigint >> 8) & 0xff;
    b = bigint & 0xff;
  }
  return { r, g, b, a: 255 };
}


