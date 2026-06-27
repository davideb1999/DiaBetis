import { inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

const API = '/api';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);

  isAuth       = signal(sessionStorage.getItem('diabetis_auth') === '1');
  profileId    = signal<number>(Number(sessionStorage.getItem('diabetis_pid') ?? '0'));
  needsConsent = signal(sessionStorage.getItem('diabetis_consent') !== '1');

  login(profileId: number, pin: string): Observable<{ ok: boolean; name: string }> {
    return this.http.post<{ ok: boolean; name: string }>(`${API}/profile/login/${profileId}`, { pin });
  }

  setAuthenticated(profileId: number, consentGiven = false) {
    sessionStorage.setItem('diabetis_auth', '1');
    sessionStorage.setItem('diabetis_pid', String(profileId));
    if (consentGiven) sessionStorage.setItem('diabetis_consent', '1');
    this.isAuth.set(true);
    this.profileId.set(profileId);
    this.needsConsent.set(!consentGiven);
  }

  markConsentGiven() {
    sessionStorage.setItem('diabetis_consent', '1');
    this.needsConsent.set(false);
  }

  logout() {
    sessionStorage.removeItem('diabetis_auth');
    sessionStorage.removeItem('diabetis_pid');
    sessionStorage.removeItem('diabetis_consent');
    this.isAuth.set(false);
    this.profileId.set(0);
    this.needsConsent.set(true);
  }
}
