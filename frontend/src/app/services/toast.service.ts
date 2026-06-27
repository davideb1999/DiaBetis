import { Injectable, signal } from '@angular/core';

export interface Toast {
  text: string;
  type: 'success' | 'error' | 'info';
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  toast = signal<Toast | null>(null);

  show(text: string, type: Toast['type'] = 'info') {
    this.toast.set({ text, type });
    setTimeout(() => this.toast.set(null), 3500);
  }
}
