import { Component, inject, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService, Profile } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';
import { ThemeService, ThemeColor } from '../../services/theme.service';

const COLOR_LABELS: Record<ThemeColor, { label: string; hex: string }> = {
  blue:    { label: 'Azul',     hex: '#2563eb' },
  rose:    { label: 'Rosa',     hex: '#e11d48' },
  violet:  { label: 'Violeta',  hex: '#7c3aed' },
  teal:    { label: 'Verde azulado', hex: '#0d9488' },
  orange:  { label: 'Naranja',  hex: '#ea580c' },
  emerald: { label: 'Verde',    hex: '#059669' },
};

@Component({
  selector: 'app-perfil',
  imports: [FormsModule],
  templateUrl: './perfil.html',
  styleUrl: './perfil.scss',
})
export class PerfilComponent implements OnInit {
  private api    = inject(ApiService);
  private router = inject(Router);
  private auth   = inject(AuthService);
  theme          = inject(ThemeService);
  toast          = inject(ToastService);

  profile = signal<Partial<Profile>>({
    name: '', icr: 10, isf: 50, target_bg: 100, dia: 3.5,
    nightscout_url: '', nightscout_token: '', pin: '', dark_mode: 0, theme_color: 'blue',
  });
  saving  = signal(false);
  testing = signal(false);
  tdd     = signal<number | null>(null);
  calcTdd = signal(false);

  newPin     = signal('');
  confirmPin = signal('');
  showPin    = signal(false);

  newUsername    = signal('');
  newPassword    = signal('');
  confirmPassword = signal('');
  showPassword   = signal(false);

  readonly colorOptions = Object.entries(COLOR_LABELS) as [ThemeColor, { label: string; hex: string }][];

  ngOnInit() {
    this.api.getProfile(this.auth.profileId()).subscribe(p => {
      if (p) this.profile.set({ ...p });
    });
  }

  set(key: keyof Profile, value: any) {
    this.profile.update(p => ({ ...p, [key]: value }));
  }

  toggleDark() {
    this.theme.toggleDark();
    this.profile.update(p => ({ ...p, dark_mode: this.theme.isDark() ? 1 : 0 }));
  }

  pickColor(c: ThemeColor) {
    this.theme.applyColor(c);
    this.profile.update(p => ({ ...p, theme_color: c }));
  }

  colorLabel(c: string) { return COLOR_LABELS[c as ThemeColor]?.label ?? c; }
  colorHex(c: string)   { return COLOR_LABELS[c as ThemeColor]?.hex ?? '#2563eb'; }

  estimateTDD() {
    const tdd = this.tdd();
    if (!tdd || tdd <= 0) return;
    this.calcTdd.set(true);
    this.api.estimateFromTDD(tdd).subscribe({
      next: r => {
        this.profile.update(p => ({ ...p, icr: r.icr, isf: r.isf }));
        this.toast.show(`Calculado: ratio ${r.icr}g/u · factor ${r.isf} mg/dL`, 'success');
        this.calcTdd.set(false);
      },
      error: () => this.calcTdd.set(false),
    });
  }

  save() {
    if (this.newPin()) {
      if (this.newPin().length < 4) { this.toast.show('El PIN debe tener al menos 4 dígitos', 'error'); return; }
      if (this.newPin() !== this.confirmPin()) { this.toast.show('Los PINs no coinciden', 'error'); return; }
      this.profile.update(p => ({ ...p, pin: this.newPin() }));
    }
    if (this.newPassword()) {
      if (this.newPassword().length < 6) { this.toast.show('La contraseña debe tener al menos 6 caracteres', 'error'); return; }
      if (this.newPassword() !== this.confirmPassword()) { this.toast.show('Las contraseñas no coinciden', 'error'); return; }
      if (!this.newUsername()) { this.toast.show('Introduce un nombre de usuario', 'error'); return; }
    }
    this.saving.set(true);
    const data: any = { ...this.profile() };
    if (this.newUsername()) data['username'] = this.newUsername();
    if (this.newPassword()) data['password'] = this.newPassword();
    this.api.saveProfile(this.auth.profileId(), data).subscribe({
      next: () => {
        this.saving.set(false);
        this.toast.show('Perfil guardado', 'success');
        this.newPin.set(''); this.confirmPin.set(''); this.showPin.set(false);
        this.newUsername.set(''); this.newPassword.set(''); this.confirmPassword.set(''); this.showPassword.set(false);
      },
      error: () => { this.saving.set(false); this.toast.show('Error al guardar', 'error'); },
    });
  }

  testNightscout() {
    this.testing.set(true);
    this.api.getNightscoutReading().subscribe({
      next:  r => { this.testing.set(false); this.toast.show(`Conectado · ${r.sgv} mg/dL hace ${r.minutesAgo} min`, 'success'); },
      error: () => { this.testing.set(false); this.toast.show('No se pudo conectar con Nightscout', 'error'); },
    });
  }

  logout() { this.auth.logout(); this.router.navigate(['/login']); }
  goSetup() { this.router.navigate(['/setup']); }
}
