import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DecimalPipe } from '@angular/common';
import { ApiService, FoodAnalysis, DoseResult } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { ThemeService } from '../../services/theme.service';
import { ToastService } from '../../services/toast.service';

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
  selector: 'app-home',
  imports: [FormsModule, DecimalPipe],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class HomeComponent implements OnInit {
  private api  = inject(ApiService);
  private auth = inject(AuthService);
  toast        = inject(ToastService);
  theme        = inject(ThemeService);

  readonly trends = TRENDS;

  profileName   = signal('');
  hasNightscout = signal(false);

  currentBg    = signal<number | null>(null);
  trend        = signal('Flat');
  nsMinutesAgo = signal<number | null>(null);
  fetchingBg   = signal(false);
  bgFromCapture = signal(false); // true when BG was read from a screenshot

  analyzingCgm = signal(false);

  selectedFile = signal<File | null>(null);
  previewUrl   = signal<string | null>(null);
  comment      = '';
  analyzing    = signal(false);
  foodAnalysis = signal<FoodAnalysis | null>(null);

  calculating = signal(false);
  doseResult  = signal<DoseResult | null>(null);

  showContextual    = signal(false);
  periodo           = signal(false);
  tomasMedicacion   = signal(false);
  medicamentosTexto = signal('');

  canAnalyze = computed(() => !!this.selectedFile() && !this.analyzing());

  bgStatus = computed(() => {
    const bg = this.currentBg();
    if (bg === null) return 'none';
    if (bg < 70 || bg > 250) return 'danger';
    if (bg < 90 || bg > 180) return 'warn';
    return 'ok';
  });

  ngOnInit() {
    this.api.getProfile(this.auth.profileId()).subscribe(p => {
      if (p) {
        this.profileName.set(p.name);
        this.hasNightscout.set(!!p.nightscout_url);
        if (p.nightscout_url) this.fetchNightscout();
      }
    });
  }

  fetchNightscout() {
    this.fetchingBg.set(true);
    this.api.getNightscoutReading().subscribe({
      next: r => { this.currentBg.set(r.sgv); this.trend.set(r.direction); this.nsMinutesAgo.set(r.minutesAgo); this.fetchingBg.set(false); },
      error: () => { this.fetchingBg.set(false); this.toast.show('No se pudo conectar con Nightscout', 'error'); },
    });
  }

  onCgmScreenshot(e: Event) {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;
    this.analyzingCgm.set(true);
    this.bgFromCapture.set(false);
    this.api.analyzeCGM(file).subscribe({
      next: r => {
        this.currentBg.set(r.sgv);
        this.trend.set(r.direction);
        this.bgFromCapture.set(true);
        this.analyzingCgm.set(false);
        this.toast.show(`Glucemia leída: ${r.sgv} mg/dL`, 'success');
      },
      error: () => {
        this.analyzingCgm.set(false);
        this.toast.show('No se pudo leer la captura. Introdúcela manualmente.', 'error');
      },
    });
    // Reset input so same file can be re-selected
    (e.target as HTMLInputElement).value = '';
  }

  onFileSelected(e: Event) {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;
    this.selectedFile.set(file);
    this.foodAnalysis.set(null);
    this.doseResult.set(null);
    const reader = new FileReader();
    reader.onload = ev => this.previewUrl.set(ev.target?.result as string);
    reader.readAsDataURL(file);
  }

  analyzeFood() {
    const file = this.selectedFile();
    if (!file) return;
    this.analyzing.set(true);
    this.doseResult.set(null);
    const meds = this.tomasMedicacion() ? this.medicamentosTexto() : '';
    this.api.analyzeFood(this.auth.profileId(), file, this.comment, this.periodo(), meds).subscribe({
      next: result => {
        this.foodAnalysis.set(result);
        this.analyzing.set(false);
        if (this.currentBg() !== null) this.calculateDose(result);
      },
      error: err => {
        this.analyzing.set(false);
        this.toast.show(err?.error?.error ?? 'Error al analizar la imagen', 'error');
      },
    });
  }

  calculateDose(food?: FoodAnalysis) {
    const f = food ?? this.foodAnalysis();
    const bg = this.currentBg();
    if (!f || bg === null) return;
    this.calculating.set(true);
    this.api.calculateDose(this.auth.profileId(), {
      carbs: f.totalCarbohidratos, currentBg: bg,
      trend: this.trend(), foodDescription: f.descripcion, imagePath: f.imagePath ?? '',
    }).subscribe({
      next: r => { this.doseResult.set(r); this.calculating.set(false); },
      error: () => { this.calculating.set(false); this.toast.show('Error al calcular la dosis', 'error'); },
    });
  }

  getTrendShort() { return TRENDS.find(t => t.value === this.trend())?.short ?? '→'; }

  getDoseGradient(dose: number) {
    if (dose <= 4)  return 'from-emerald-400 to-emerald-600';
    if (dose <= 10) return 'from-blue-500 to-blue-700';
    if (dose <= 15) return 'from-amber-400 to-orange-500';
    return 'from-red-400 to-red-600';
  }

  absorcionLabel(a: string) { return { rapida: 'Rápida ⚡', media: 'Media ⏱', lenta: 'Lenta 🌙' }[a] ?? a; }

  reset() {
    this.selectedFile.set(null);
    this.previewUrl.set(null);
    this.foodAnalysis.set(null);
    this.doseResult.set(null);
    this.comment = '';
    this.showContextual.set(false);
  }
}
