import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login',          loadComponent: () => import('./pages/login/login').then(m => m.LoginComponent) },
  { path: 'consentimiento', loadComponent: () => import('./pages/consentimiento/consentimiento').then(m => m.ConsentimientoComponent) },
  { path: 'privacidad',     loadComponent: () => import('./pages/privacidad/privacidad').then(m => m.PrivacidadComponent) },
  { path: 'inicio',         loadComponent: () => import('./pages/home/home').then(m => m.HomeComponent) },
  { path: 'correccion',     loadComponent: () => import('./pages/correccion/correccion').then(m => m.CorreccionComponent) },
  { path: 'historial',      loadComponent: () => import('./pages/historial/historial').then(m => m.HistorialComponent) },
  { path: 'perfil',         loadComponent: () => import('./pages/perfil/perfil').then(m => m.PerfilComponent) },
  { path: 'setup',          loadComponent: () => import('./pages/setup/setup').then(m => m.SetupComponent) },
  { path: '**', redirectTo: 'login' },
];
