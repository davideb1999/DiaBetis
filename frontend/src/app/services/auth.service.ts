import { inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

const API = '/api';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);

  isAuth     = signal(sessionStorage.getItem('diabetis_auth') === '1');
  profileId  = signal<number>(Number(sessionStorage.getItem('diabetis_pid') ?? '0'));

  login(profileId: number, pin: string): Observable<{ ok: boolean; name: string }> {
    return this.http.post<{ ok: boolean; name: string }>(`${API}/profile/login/${profileId}`, { pin });
  }

  setAuthenticated(profileId: number) {
    sessionStorage.setItem('diabetis_auth', '1');
    sessionStorage.setItem('diabetis_pid', String(profileId));
    this.isAuth.set(true);
    this.profileId.set(profileId);
  }

  logout() {
    sessionStorage.removeItem('diabetis_auth');
    sessionStorage.removeItem('diabetis_pid');
    this.isAuth.set(false);
    this.profileId.set(0);
  }
}
