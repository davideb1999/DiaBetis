import { Injectable, signal } from '@angular/core';

export type ThemeColor = 'blue' | 'rose' | 'violet' | 'teal' | 'orange' | 'emerald';

interface Palette {
  from: string; via: string; to: string;
  primary: string; primaryDark: string;
  light: string; lightText: string; onLight: string;
  ring: string;
}

const PALETTES: Record<ThemeColor, Palette> = {
  blue:    { from:'#2563eb', via:'#1d4ed8', to:'#4338ca', primary:'#2563eb', primaryDark:'#1e40af', light:'#eff6ff', lightText:'#93c5fd', onLight:'#1d4ed8', ring:'rgba(37,99,235,0.35)' },
  rose:    { from:'#e11d48', via:'#be123c', to:'#9d174d', primary:'#e11d48', primaryDark:'#9f1239', light:'#fff1f2', lightText:'#fda4af', onLight:'#be123c', ring:'rgba(225,29,72,0.35)'  },
  violet:  { from:'#7c3aed', via:'#6d28d9', to:'#4c1d95', primary:'#7c3aed', primaryDark:'#5b21b6', light:'#f5f3ff', lightText:'#c4b5fd', onLight:'#6d28d9', ring:'rgba(124,58,237,0.35)' },
  teal:    { from:'#0d9488', via:'#0f766e', to:'#115e59', primary:'#0d9488', primaryDark:'#0f766e', light:'#f0fdfa', lightText:'#5eead4', onLight:'#0f766e', ring:'rgba(13,148,136,0.35)' },
  orange:  { from:'#ea580c', via:'#c2410c', to:'#9a3412', primary:'#ea580c', primaryDark:'#c2410c', light:'#fff7ed', lightText:'#fdba74', onLight:'#c2410c', ring:'rgba(234,88,12,0.35)'  },
  emerald: { from:'#059669', via:'#047857', to:'#065f46', primary:'#059669', primaryDark:'#047857', light:'#ecfdf5', lightText:'#6ee7b7', onLight:'#047857', ring:'rgba(5,150,105,0.35)'  },
};

@Injectable({ providedIn: 'root' })
export class ThemeService {
  isDark    = signal(false);
  color     = signal<ThemeColor>('blue');

  constructor() {
    const savedDark  = localStorage.getItem('diabetis_theme');
    const savedColor = (localStorage.getItem('diabetis_color') ?? 'blue') as ThemeColor;
    this.applyDark(savedDark === 'dark');
    this.applyColor(savedColor);
  }

  get palette(): Palette { return PALETTES[this.color()]; }
  get allColors(): ThemeColor[] { return Object.keys(PALETTES) as ThemeColor[]; }

  headerGradient(): string {
    const p = this.palette;
    return `linear-gradient(135deg, ${p.from} 0%, ${p.via} 55%, ${p.to} 100%)`;
  }

  bgGradient(): string {
    const p = this.palette;
    return this.isDark()
      ? `linear-gradient(145deg, #0a0f1e 0%, #111827 60%, #0a0f1e 100%)`
      : `linear-gradient(145deg, ${p.light} 0%, #ffffff 45%, ${p.light} 100%)`;
  }

  navBg(): string {
    return this.isDark()
      ? 'rgba(10, 15, 30, 0.75)'
      : 'rgba(255, 255, 255, 0.72)';
  }

  toggleDark() { this.applyDark(!this.isDark()); }

  setColor(c: ThemeColor) {
    this.applyColor(c);
    localStorage.setItem('diabetis_color', c);
  }

  applyDark(dark: boolean) {
    this.isDark.set(dark);
    localStorage.setItem('diabetis_theme', dark ? 'dark' : 'light');
    document.documentElement.classList.toggle('dark', dark);
  }

  applyColor(c: ThemeColor) {
    this.color.set(c);
    localStorage.setItem('diabetis_color', c);
    const p = PALETTES[c];
    const root = document.documentElement.style;
    root.setProperty('--brand-primary',      p.primary);
    root.setProperty('--brand-dark',         p.primaryDark);
    root.setProperty('--brand-light',        p.light);
    root.setProperty('--brand-light-text',   p.lightText);
    root.setProperty('--brand-on-light',     p.onLight);
    root.setProperty('--brand-ring',         p.ring);
  }
}
