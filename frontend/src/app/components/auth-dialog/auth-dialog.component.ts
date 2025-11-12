import {
  Component,
  ElementRef,
  EventEmitter,
  Output,
  ViewChild,
  computed,
  inject,
  signal
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { UserStateService } from '../../core/services/user-state.service';

@Component({
  selector: 'app-auth-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './auth-dialog.component.html',
  styleUrl: './auth-dialog.component.scss'
})
export class AuthDialogComponent {
  private readonly authService = inject(AuthService);
  private readonly userState = inject(UserStateService);

  @ViewChild('dialog', { static: true }) dialogRef!: ElementRef<HTMLDialogElement>;
  @Output() authenticated = new EventEmitter<void>();

  readonly isAuthenticating = computed(() => this.authService.isAuthenticating());
  readonly authError = computed(() => this.authService.error());

  readonly formModel = signal({
    nickname: ''
  });

  updateNickname(value: string): void {
    this.formModel.update((state) => ({ ...state, nickname: value }));
  }

  open(): void {
    this.formModel.set({
      nickname: this.userState.nickname()
    });
    this.authService.setError(null);
    this.dialogRef.nativeElement.showModal();
  }

  close(): void {
    this.dialogRef.nativeElement.close();
    this.authService.setError(null);
  }

  async submit(): Promise<void> {
    const nickname = this.formModel().nickname.trim();

    if (!nickname) {
      this.authService.setError('Nickname is required.');
      return;
    }

    try {
      await this.authService.authenticate(nickname);
      this.dialogRef.nativeElement.close();
      this.authenticated.emit();
    } catch {
      // error already handled in service
    }
  }
}


