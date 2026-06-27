import { Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { ToastService } from './services/toast.service';
import { ThemeService } from './services/theme.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  toast = inject(ToastService);
  theme = inject(ThemeService);
  private router = inject(Router);

  currentRoute = signal('');

  showNav = computed(() => {
    const r = this.currentRoute();
    return r.startsWith('/inicio') || r.startsWith('/correccion') ||
           r.startsWith('/historial') || r.startsWith('/perfil');
  });

  readonly nav = [
    { path: '/inicio',     icon: 'home',       label: 'Inicio'     },
    { path: '/correccion', icon: 'speed',       label: 'Corrección' },
    { path: '/historial',  icon: 'history',     label: 'Historial'  },
    { path: '/perfil',     icon: 'person',      label: 'Perfil'     },
  ];

  constructor() {
    this.router.events.pipe(filter(e => e instanceof NavigationEnd)).subscribe(e => {
      this.currentRoute.set((e as NavigationEnd).urlAfterRedirects);
    });
  }
}
