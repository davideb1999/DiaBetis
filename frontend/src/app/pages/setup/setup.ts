import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-setup',
  imports: [ReactiveFormsModule],
  templateUrl: './setup.html',
  styleUrl: './setup.scss',
})
export class SetupComponent {
  private fb     = inject(FormBuilder);
  private api    = inject(ApiService);
  private auth   = inject(AuthService);
  private router = inject(Router);

  step        = signal(1);
  calculating = signal(false);
  saving      = signal(false);
  useTDD      = signal(false);
  estimated   = signal<{ icr: number; isf: number } | null>(null);

  f1 = this.fb.group({
    name:        ['', Validators.required],
    insulinType: ['3.5', Validators.required],
  });

  f2 = this.fb.group({
    tdd:      [null as number | null],
    icr:      [10 as number | null, [Validators.required, Validators.min(1)]],
    isf:      [50 as number | null, [Validators.required, Validators.min(1)]],
    targetBg: [100, [Validators.required, Validators.min(60), Validators.max(250)]],
  });

  f3 = this.fb.group({
    nightscoutUrl:   [''],
    nightscoutToken: [''],
  });

  next() { if (this.step() < 3) this.step.update(s => s + 1); }
  back() { if (this.step() > 1) this.step.update(s => s - 1); }

  estimateFromTDD() {
    const tdd = this.f2.get('tdd')?.value;
    if (!tdd || tdd <= 0) return;
    this.calculating.set(true);
    this.api.estimateFromTDD(tdd).subscribe({
      next: r => { this.estimated.set(r); this.f2.patchValue({ icr: r.icr, isf: r.isf }); this.calculating.set(false); },
      error: () => this.calculating.set(false),
    });
  }

  save() {
    if (this.f1.invalid || this.f2.invalid) return;
    this.saving.set(true);
    const v1 = this.f1.value, v2 = this.f2.value, v3 = this.f3.value;
    this.api.createProfile({
      name:             v1.name!,
      icr:              v2.icr!,
      isf:              v2.isf!,
      target_bg:        v2.targetBg!,
      dia:              parseFloat(v1.insulinType!),
      nightscout_url:   v3.nightscoutUrl ?? '',
      nightscout_token: v3.nightscoutToken ?? '',
      units:            'mg/dL',
      theme_color:      'blue',
    }).subscribe({
      next:  r => { this.saving.set(false); this.auth.setAuthenticated(r.id); this.router.navigate(['/inicio']); },
      error: () => this.saving.set(false),
    });
  }
}
