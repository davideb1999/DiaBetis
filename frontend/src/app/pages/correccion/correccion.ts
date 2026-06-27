import { Component, inject, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService, DoseResult } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';
import { ThemeService } from '../../services/theme.service';

const TRENDS = [
  { value: 'DoubleUp',     label: '↑↑ Subiendo rápido', short: '↑↑' },
  { value: 'SingleUp',     label: '↑  Subiendo',        short: '↑'  },
  { value: 'FortyFiveUp',  label: '↗  Subiendo poco',   short: '↗'  },
  { value: 'Flat',         label: '→  Estable',          short: '→'  },
  { value: 'FortyFiveDown',label: '↘  Bajando poco',    short: '↘'  },
  { value: 'SingleDown',   label: '↓  Bajando',         short: '↓'  },
  { value: 'DoubleDown',   label: '↓↓ Bajando rápido',  short: '↓↓' },
];

@Component({
  selector: 'app-correccion',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './correccion.html',
})
export class CorreccionComponent {
  private api  = inject(ApiService);
  private auth = inject(AuthService);
  toast        = inject(ToastService);
  theme        = inject(ThemeService);

  readonly trends = TRENDS;

  currentBg   = signal<number | null>(null);
  trend       = signal('Flat');
  calculating = signal(false);
  result      = signal<DoseResult | null>(null);

  bgStatus = computed(() => {
    const bg = this.currentBg();
    if (bg === null) return 'none';
    if (bg < 70 || bg > 250) return 'danger';
    if (bg < 90 || bg > 180) return 'warn';
    return 'ok';
  });

  canCalculate = computed(() => this.currentBg() !== null && !this.calculating());

  calculate() {
    const bg = this.currentBg();
    if (bg === null) return;
    this.calculating.set(true);
    this.api.calculateDose(this.auth.profileId(), {
      carbs: 0, currentBg: bg, trend: this.trend(),
      foodDescription: 'Corrección sin comida', imagePath: '',
    }).subscribe({
      next: r => { this.result.set(r); this.calculating.set(false); },
      error: () => { this.calculating.set(false); this.toast.show('Error al calcular', 'error'); },
    });
  }

  getTrendShort() { return TRENDS.find(t => t.value === this.trend())?.short ?? '→'; }

  reset() { this.result.set(null); this.currentBg.set(null); this.trend.set('Flat'); }
}
