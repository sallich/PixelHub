import {
  AfterViewInit,
  Component,
  DestroyRef,
  ElementRef,
  EventEmitter,
  HostListener,
  Output,
  ViewChild,
  computed,
  effect,
  inject,
  signal
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CanvasStateService } from '../../core/services/canvas-state.service';
import { ConfigService } from '../../core/services/config.service';
import { PixelPlacementService } from '../../core/services/pixel-placement.service';
import { StatusService } from '../../core/services/status.service';
import { BoardLoaderService } from '../../core/services/board-loader.service';
import { CooldownService } from '../../core/services/cooldown.service';
import { UserStateService } from '../../core/services/user-state.service';

const MIN_ZOOM = 0.25;
const MAX_ZOOM = 40;

interface PointerState {
  x: number;
  y: number;
}

@Component({
  selector: 'app-canvas-board',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './canvas-board.component.html',
  styleUrl: './canvas-board.component.scss'
})
export class CanvasBoardComponent implements AfterViewInit {
  @ViewChild('boardCanvas', { static: true }) canvasRef!: ElementRef<HTMLCanvasElement>;
  @Output() authRequired = new EventEmitter<void>();
  @Output() changeNickname = new EventEmitter<void>();

  private readonly canvasState = inject(CanvasStateService);
  private readonly configService = inject(ConfigService);
  private readonly placementService = inject(PixelPlacementService);
  private readonly statusService = inject(StatusService);
  private readonly boardLoader = inject(BoardLoaderService);
  private readonly cooldownService = inject(CooldownService);
  private readonly userState = inject(UserStateService);
  private readonly destroyRef = inject(DestroyRef);

  private readonly pointerState = new Map<number, PointerState>();
  private isDragging = false;
  private pointerMoved = false;
  private dragStart = { x: 0, y: 0 };
  private dragOrigin = { x: 0, y: 0 };
  private animationFrameId: number | null = null;

  readonly scale = signal(8);
  readonly offset = signal({ x: 0, y: 0 });
  readonly hoverPixel = signal<{ x: number; y: number } | null>(null);
  private readonly viewportWidth = signal(
    typeof window !== 'undefined' ? window.innerWidth : 1024
  );
  readonly boardDimensions = computed(() => this.canvasState.getDimensions());
  readonly isBoardLoading = computed(() => this.boardLoader.loading());
  readonly isMobile = computed(() => this.viewportWidth() <= 768);
  readonly cooldownActive = computed(() => this.cooldownService.isActive());
  readonly cooldownLabel = computed(() => {
    const remaining = this.cooldownService.remainingSeconds();
    return remaining > 0 ? `${remaining}s` : 'Ready';
  });
  readonly nickname = computed(() => this.userState.nickname());
  readonly pixelCount = computed(() => this.userState.pixelCount());
  readonly showOverlayCards = signal(true);
  readonly hoverStyle = computed(() => {
    const pixel = this.hoverPixel();
    const scale = this.scale();
    const { x, y } = this.offset();

    if (!pixel) {
      return { opacity: '0' };
    }

    return {
      opacity: '1',
      transform: `translate(${pixel.x * scale + x}px, ${pixel.y * scale + y}px)`,
      width: `${scale}px`,
      height: `${scale}px`
    };
  });

  constructor() {
    effect(
      () => {
        const config = this.configService.config();
        this.canvasState.initializeBoard(config);
        queueMicrotask(() => this.resetViewport());
      },
      { allowSignalWrites: true }
    );

    effect(
      () => {
        if (!this.isMobile()) {
          this.showOverlayCards.set(true);
        }
      },
      { allowSignalWrites: true }
    );
  }

  async ngAfterViewInit(): Promise<void> {
    this.initializeRenderer();
  }

  @HostListener('window:resize')
  onResize(): void {
    if (typeof window !== 'undefined') {
      this.viewportWidth.set(window.innerWidth);
    }
    this.resizeCanvasToWrapper();
  }

  handleZoomChange(event: Event): void {
    const target = event.target as HTMLInputElement | null;
    if (!target) return;
    const value = Number.parseFloat(target.value);
    if (Number.isFinite(value)) {
      this.setZoom(value);
    }
  }

  get zoomDisplay(): string {
    const current = this.scale();
    const formatted = current >= 10 ? Math.round(current).toString() : current.toFixed(2);
    return `${formatted}×`;
  }

  centerCanvas(): void {
    this.resetViewport();
    this.hoverPixel.set(null);
  }

  toggleCards(): void {
    if (!this.isMobile()) {
      return;
    }

    this.showOverlayCards.update((value) => !value);
  }

  gotoX = '';
  gotoY = '';

  focusPixel(): void {
    const xVal = Number(this.gotoX);
    const yVal = Number(this.gotoY);
    if (!Number.isInteger(xVal) || !Number.isInteger(yVal)) {
      this.statusService.push('Enter integer coordinates.', 'warning');
      return;
    }

    const { width, height } = this.boardDimensions();
    if (xVal < 0 || yVal < 0 || xVal >= width || yVal >= height) {
      this.statusService.push('Coordinates out of bounds.', 'warning');
      return;
    }

    if (this.scale() < 20) {
      this.scale.set(20);
    }

    const canvas = this.canvasRef?.nativeElement;
    if (!canvas) return;

    const ratio = window.devicePixelRatio || 1;
    const displayWidth = canvas.width / ratio;
    const displayHeight = canvas.height / ratio;
    const scale = this.scale();

    this.offset.set({
      x: displayWidth / 2 - xVal * scale - scale / 2,
      y: displayHeight / 2 - yVal * scale - scale / 2
    });
    this.hoverPixel.set({ x: xVal, y: yVal });
    this.statusService.push(`Moved to (${xVal}, ${yVal}).`, 'info');
  }

  placePixelFromClick(canvasPoint: { x: number; y: number }): void {
    const boardPoint = this.canvasToBoard(canvasPoint);
    const { width, height } = this.canvasState.getDimensions();
    const x = Math.floor(boardPoint.x);
    const y = Math.floor(boardPoint.y);
    if (Number.isNaN(x) || Number.isNaN(y) || x < 0 || y < 0 || x >= width || y >= height) {
      this.statusService.push('Click inside the canvas bounds.', 'warning');
      return;
    }

    const result = this.placementService.requestPlacement({
      x,
      y,
      c: this.canvasState.selectedColor()
    });

    if (result === 'not-authenticated') {
      this.authRequired.emit();
    }
  }

  triggerNicknameChange(): void {
    this.changeNickname.emit();
  }

  private initializeRenderer(): void {
    this.resizeCanvasToWrapper();
    const canvas = this.canvasRef.nativeElement;
    const render = () => {
      this.renderFrame();
      this.animationFrameId = window.requestAnimationFrame(render);
    };
    this.animationFrameId = window.requestAnimationFrame(render);

    this.setupEventListeners(canvas);

    this.destroyRef.onDestroy(() => {
      if (this.animationFrameId !== null) {
        window.cancelAnimationFrame(this.animationFrameId);
      }
    });
  }

  private setupEventListeners(canvas: HTMLCanvasElement): void {
    const pointerDown = (event: PointerEvent) => {
      canvas.setPointerCapture(event.pointerId);
      this.pointerState.set(event.pointerId, { x: event.clientX, y: event.clientY });
      this.isDragging = true;
      this.pointerMoved = false;
      this.dragStart = { x: event.clientX, y: event.clientY };
      this.dragOrigin = { ...this.offset() };
      this.updateHoverFromPointer(event.clientX, event.clientY);
    };

    const pointerMove = (event: PointerEvent) => {
      if (!this.isDragging || !this.pointerState.has(event.pointerId)) {
        this.updateHoverFromPointer(event.clientX, event.clientY);
        return;
      }
      const dx = event.clientX - this.dragStart.x;
      const dy = event.clientY - this.dragStart.y;
      if (Math.abs(dx) > 2 || Math.abs(dy) > 2) {
        this.pointerMoved = true;
      }
      this.offset.set({ x: this.dragOrigin.x + dx, y: this.dragOrigin.y + dy });
      this.hoverPixel.set(null);
    };

    const pointerUp = (event: PointerEvent) => {
      if (canvas.hasPointerCapture(event.pointerId)) {
        canvas.releasePointerCapture(event.pointerId);
      }
      this.pointerState.delete(event.pointerId);
      if (this.pointerState.size === 0) {
        this.isDragging = false;
      }
      this.hoverPixel.set(null);
    };

    const wheel = (event: WheelEvent) => {
      event.preventDefault();
      const delta = -event.deltaY;
      const factor = delta > 0 ? 1.1 : 0.9;
      const canvasPoint = this.getCanvasPointFromEvent(event);
      if (canvasPoint) {
        const boardPoint = this.canvasToBoard(canvasPoint);
        this.setZoom(this.scale() * factor, boardPoint);
      }
      this.updateHoverFromPointer(event.clientX, event.clientY);
    };

    const click = (event: MouseEvent) => {
      if (this.pointerMoved) {
        this.pointerMoved = false;
        return;
      }
      const canvasPoint = this.getCanvasPointFromEvent(event);
      if (canvasPoint) {
        this.placePixelFromClick(canvasPoint);
      }
    };

    canvas.addEventListener('pointerdown', pointerDown);
    canvas.addEventListener('pointermove', pointerMove);
    canvas.addEventListener('pointerup', pointerUp);
    canvas.addEventListener('pointercancel', pointerUp);
    canvas.addEventListener('pointerleave', pointerUp);
    canvas.addEventListener('wheel', wheel, { passive: false });
    canvas.addEventListener('click', click);

    this.destroyRef.onDestroy(() => {
      canvas.removeEventListener('pointerdown', pointerDown);
      canvas.removeEventListener('pointermove', pointerMove);
      canvas.removeEventListener('pointerup', pointerUp);
      canvas.removeEventListener('pointercancel', pointerUp);
      canvas.removeEventListener('pointerleave', pointerUp);
      canvas.removeEventListener('wheel', wheel);
      canvas.removeEventListener('click', click);
    });
  }

  private renderFrame(): void {
    const canvas = this.canvasRef.nativeElement;
    const ctx = canvas.getContext('2d');
    const offscreen = this.canvasState.getOffscreenCanvas();
    if (!ctx || !offscreen) return;

    const ratio = window.devicePixelRatio || 1;
    
    ctx.save();
    // Сбрасываем трансформацию и очищаем весь канвас
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Масштабируем для работы с CSS координатами
    // После этого все координаты интерпретируются в CSS размерах (rect.width x rect.height)
    ctx.scale(ratio, ratio);
    
    const { x, y } = this.offset();
    const scale = this.scale();
    
    // Применяем пользовательский масштаб и offset
    // Все координаты теперь в CSS пространстве благодаря предыдущему scale(ratio, ratio)
    ctx.transform(scale, 0, 0, scale, x, y);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(offscreen, 0, 0);
    ctx.restore();
  }

  private resizeCanvasToWrapper(): void {
    const canvas = this.canvasRef.nativeElement;
    const wrapper = canvas.parentElement;
    if (!wrapper) return;
    const rect = wrapper.getBoundingClientRect();
    const ratio = window.devicePixelRatio || 1;
    // Устанавливаем внутренние размеры канваса с учетом devicePixelRatio для четкости на Retina
    canvas.width = rect.width * ratio;
    canvas.height = rect.height * ratio;
    const ctx = canvas.getContext('2d');
    // НЕ используем ctx.scale(ratio, ratio), так как это создает проблемы с координатами
    // Вместо этого работаем только с CSS координатами, а devicePixelRatio учитывается
    // автоматически через внутренние размеры канваса
    this.resetViewport();
  }

  private resetViewport(): void {
    if (!this.canvasRef?.nativeElement) {
      return;
    }
    const canvas = this.canvasRef.nativeElement;
    const { width, height } = this.canvasState.getDimensions();
    const ratio = window.devicePixelRatio || 1;
    // Получаем CSS размеры canvas элемента
    const rect = canvas.getBoundingClientRect();
    const displayWidth = rect.width;
    const displayHeight = rect.height;
    const scale = this.scale();
    // В renderFrame используется setTransform(scale, 0, 0, scale, x, y).
    // setTransform работает в логических координатах канваса после сброса трансформации.
    // После setTransform(1, 0, 0, 1, 0, 0) координаты интерпретируются как координаты
    // в логическом пространстве канваса, которое имеет размеры canvas.width x canvas.height.
    // Но поскольку мы используем setTransform без учета предыдущего scale(ratio, ratio),
    // и canvas.width = rect.width * ratio, логические координаты фактически соответствуют
    // CSS размерам, умноженным на ratio. Однако offset применяется в координатах,
    // соответствующих CSS размерам, так как мы вычисляем его как displayWidth = rect.width.
    // Это работает корректно, потому что setTransform интерпретирует координаты относительно
    // текущего состояния трансформации после сброса.
    this.offset.set({
      x: (displayWidth - width * scale) / 2,
      y: (displayHeight - height * scale) / 2
    });
  }

  private setZoom(value: number, anchor?: { x: number; y: number }): void {
    const newScale = clamp(value, MIN_ZOOM, MAX_ZOOM);
    const prevScale = this.scale();
    if (Math.abs(newScale - prevScale) < 0.01) return;

    const canvas = this.canvasRef.nativeElement;
    const center = anchor ?? {
      x: canvas.width / (2 * window.devicePixelRatio),
      y: canvas.height / (2 * window.devicePixelRatio)
    };
    const boardPoint = anchor ?? this.canvasToBoard(center);
    this.scale.set(newScale);
    const canvasPoint = this.boardToCanvas(boardPoint);
    this.offset.set({
      x: canvasPoint.x - boardPoint.x * this.scale(),
      y: canvasPoint.y - boardPoint.y * this.scale()
    });
  }

  private canvasToBoard(point: { x: number; y: number }): { x: number; y: number } {
    const { x, y } = this.offset();
    const scale = this.scale();
    return {
      x: (point.x - x) / scale,
      y: (point.y - y) / scale
    };
  }

  private boardToCanvas(point: { x: number; y: number }): { x: number; y: number } {
    const { x, y } = this.offset();
    const scale = this.scale();
    return {
      x: point.x * scale + x,
      y: point.y * scale + y
    };
  }

  /**
   * Преобразует координаты события мыши в логические координаты канваса.
   * 
   * В renderFrame после setTransform(1, 0, 0, 1, 0, 0) координаты интерпретируются
   * в пространстве canvas.width x canvas.height (которое = rect.width * ratio).
   * Offset также умножается на ratio в renderFrame.
   * 
   * Поэтому для правильной работы нужно преобразовать CSS координаты клика
   * в координаты пространства canvas.width x canvas.height, умножив на ratio.
   * Но затем в canvasToBoard нужно использовать offset, также умноженный на ratio.
   * 
   * Однако проще работать в CSS координатах везде, поэтому возвращаем CSS координаты,
   * а в canvasToBoard используем offset в CSS координатах (без умножения на ratio).
   * Это работает, потому что соотношение сохраняется.
   */
  private getCanvasPointFromEvent(event: MouseEvent | PointerEvent | WheelEvent): { x: number; y: number } | null {
    const canvas = this.canvasRef?.nativeElement;
    if (!canvas) {
      return null;
    }

    const rect = canvas.getBoundingClientRect();

    // Получаем CSS координаты относительно canvas элемента
    const cssX = event.clientX - rect.left;
    const cssY = event.clientY - rect.top;

    // Проверяем, что CSS координаты в пределах canvas
    if (cssX < 0 || cssY < 0 || cssX > rect.width || cssY > rect.height) {
      return null;
    }

    // Возвращаем координаты в CSS пространстве
    // canvasToBoard использует offset в CSS координатах, поэтому все работает правильно
    return { x: cssX, y: cssY };
  }

  private updateHoverFromPointer(clientX: number, clientY: number): void {
    const canvas = this.canvasRef?.nativeElement;
    if (!canvas) {
      this.hoverPixel.set(null);
      return;
    }

    // Создаем временный объект события для использования getCanvasPointFromEvent
    const mockEvent = {
      clientX,
      clientY
    } as MouseEvent;

    const canvasPoint = this.getCanvasPointFromEvent(mockEvent);
    if (!canvasPoint) {
      this.hoverPixel.set(null);
      return;
    }

    const boardPoint = this.canvasToBoard(canvasPoint);
    const { width, height } = this.canvasState.getDimensions();
    const boardX = Math.floor(boardPoint.x);
    const boardY = Math.floor(boardPoint.y);

    if (
      Number.isNaN(boardX) ||
      Number.isNaN(boardY) ||
      boardX < 0 ||
      boardY < 0 ||
      boardX >= width ||
      boardY >= height
    ) {
      this.hoverPixel.set(null);
    } else {
      this.hoverPixel.set({ x: boardX, y: boardY });
    }
  }
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}


