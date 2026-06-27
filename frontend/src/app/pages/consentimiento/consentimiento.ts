import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { ThemeService } from '../../services/theme.service';

@Component({
  selector: 'app-consentimiento',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './consentimiento.html',
})
export class ConsentimientoComponent {
  private api    = inject(ApiService);
  private auth   = inject(AuthService);
  private router = inject(Router);
  theme          = inject(ThemeService);

  accepting = signal(false);

  accept() {
    this.accepting.set(true);
    this.api.giveConsent(this.auth.profileId()).subscribe({
      next: () => {
        this.auth.markConsentGiven();
        this.router.navigate(['/inicio']);
      },
      error: () => this.accepting.set(false),
    });
  }

  reject() {
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}
