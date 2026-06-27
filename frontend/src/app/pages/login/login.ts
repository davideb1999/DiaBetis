import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ApiService, ProfileSummary } from '../../services/api.service';
import { ToastService } from '../../services/toast.service';
import { ThemeService, ThemeColor } from '../../services/theme.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './login.html',
})
export class LoginComponent {
  private auth   = inject(AuthService);
  private api    = inject(ApiService);
  private router = inject(Router);
  private toast  = inject(ToastService);
  theme          = inject(ThemeService);

  // Mode: 'profiles' = card list, 'password' = username+password form, 'pin' = PIN entry
  mode = signal<'profiles' | 'password' | 'pin'>('password');

  profiles = signal<ProfileSummary[]>([]);
  loading  = signal(true);

  selected = signal<ProfileSummary | null>(null);

  // Username+password form
  username = signal('');
  password = signal('');
  showPass = signal(false);

  // PIN form
  pin = signal('');

  entering = signal(false);

  constructor() {
    this.api.getAllProfiles().subscribe({
      next: ps => { this.profiles.set(ps); this.loading.set(false); },
      error: () => { this.loading.set(false); },
    });
  }

  // --- Username + password login ---
  loginWithPassword() {
    if (!this.username() || !this.password()) return;
    this.entering.set(true);
    this.api.loginByUsername(this.username(), this.password()).subscribe({
      next: r => {
        this.auth.setAuthenticated(r.id);
        this.router.navigate(['/inicio']);
      },
      error: e => {
        this.entering.set(false);
        this.toast.show(e.error?.error ?? 'Usuario o contraseña incorrectos', 'error');
      },
    });
  }

  // --- PIN login (local / fallback) ---
  selectForPin(p: ProfileSummary) {
    this.selected.set(p);
    this.pin.set('');
    this.theme.applyColor((p.theme_color as ThemeColor) ?? 'blue');
    this.theme.applyDark(p.dark_mode === 1);
    this.mode.set('pin');
  }

  enterPin() {
    const p = this.selected();
    if (!p) return;
    this.entering.set(true);
    this.auth.login(p.id, this.pin()).subscribe({
      next: () => { this.auth.setAuthenticated(p.id); this.router.navigate(['/inicio']); },
      error: e => {
        this.entering.set(false);
        this.toast.show(e.error?.error ?? 'PIN incorrecto', 'error');
      },
    });
  }

  back() {
    this.selected.set(null);
    this.pin.set('');
    this.theme.applyColor('blue');
    this.theme.applyDark(false);
    this.mode.set(this.profiles().some(p => p.has_password) ? 'password' : 'profiles');
  }

  newProfile() { this.router.navigate(['/setup']); }
  initial(name: string) { return name.charAt(0).toUpperCase(); }
}
