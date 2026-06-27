import { Component, inject, OnInit, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ApiService, DoseHistoryItem } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';

const TREND_ARROWS: Record<string, string> = {
  DoubleUp: '↑↑', SingleUp: '↑', FortyFiveUp: '↗',
  Flat: '→', FortyFiveDown: '↘', SingleDown: '↓', DoubleDown: '↓↓',
};

@Component({
  selector: 'app-historial',
  imports: [DatePipe],
  templateUrl: './historial.html',
  styleUrl: './historial.scss',
})
export class HistorialComponent implements OnInit {
  private api  = inject(ApiService);
  private auth = inject(AuthService);

  loading = signal(true);
  doses   = signal<DoseHistoryItem[]>([]);

  ngOnInit() { this.load(); }

  load() {
    this.loading.set(true);
    this.api.getHistory(this.auth.profileId()).subscribe({
      next:  d => { this.doses.set(d); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  delete(id: number) {
    this.api.deleteDose(id).subscribe(() =>
      this.doses.update(d => d.filter(i => i.id !== id))
    );
  }

  arrow(trend: string) { return TREND_ARROWS[trend] ?? '→'; }

  bgClass(bg: number) {
    if (bg < 70 || bg > 250) return 'text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400';
    if (bg < 90 || bg > 180) return 'text-amber-600 bg-amber-50 dark:bg-amber-900/20 dark:text-amber-400';
    return 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 dark:text-emerald-400';
  }
}
