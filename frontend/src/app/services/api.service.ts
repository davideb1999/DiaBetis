import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

const API = '/api';

export interface Profile {
  id: number;
  name: string;
  icr: number;
  isf: number;
  target_bg: number;
  dia: number;
  nightscout_url: string;
  nightscout_token: string;
  units: string;
  setup_done: number;
  pin?: string;
  dark_mode?: number;
  theme_color?: string;
}

export interface ProfileSummary {
  id: number;
  name: string;
  theme_color: string;
  dark_mode: number;
  has_password: number;
}

export interface DosisRetardada {
  recomendada: boolean;
  unidadesEstimadas: number;
  cuandoMinutos: number;
  nota: string;
}

export interface FoodAnalysis {
  descripcion: string;
  alimentos: { nombre: string; cantidad: string; carbohidratos: number }[];
  totalCarbohidratos: number;
  confianza: 'alta' | 'media' | 'baja';
  nota: string;
  imagePath: string;
  absorcion: 'rapida' | 'media' | 'lenta';
  tiempoEfecto: string;
  recomendacionTiming: string;
  ajusteContextual: string;
  dosisRetardada: DosisRetardada;
}

export interface DoseResult {
  carbDose: number;
  correctionDose: number;
  trendAdjustment: number;
  totalDose: number;
  roundedDose: number;
  explanation: string;
}

export interface NightscoutReading {
  sgv: number;
  direction: string;
  dateString: string;
  minutesAgo: number;
}

export interface DoseHistoryItem {
  id: number;
  created_at: string;
  food_description: string;
  carbs: number;
  current_bg: number;
  trend: string;
  carb_dose: number;
  correction_dose: number;
  total_dose: number;
}

@Injectable({ providedIn: 'root' })
export class ApiService {
  private http = inject(HttpClient);

  getAllProfiles(): Observable<ProfileSummary[]> {
    return this.http.get<ProfileSummary[]>(`${API}/profile/all`);
  }

  loginByUsername(username: string, password: string): Observable<{ ok: boolean; id: number; name: string }> {
    return this.http.post<{ ok: boolean; id: number; name: string }>(`${API}/profile/login-by-username`, { username, password });
  }

  getProfile(id: number): Observable<Profile | null> {
    return this.http.get<Profile | null>(`${API}/profile/${id}`);
  }

  saveProfile(id: number, data: Partial<Profile>): Observable<{ ok: boolean }> {
    return this.http.post<{ ok: boolean }>(`${API}/profile/${id}`, data);
  }

  createProfile(data: Partial<Profile>): Observable<{ ok: boolean; id: number }> {
    return this.http.post<{ ok: boolean; id: number }>(`${API}/profile/new`, data);
  }

  deleteProfile(id: number): Observable<{ ok: boolean }> {
    return this.http.delete<{ ok: boolean }>(`${API}/profile/${id}`);
  }

  estimateFromTDD(tdd: number): Observable<{ icr: number; isf: number }> {
    return this.http.post<{ icr: number; isf: number }>(`${API}/profile/util/estimate-from-tdd`, { tdd });
  }

  analyzeFood(profileId: number, file: File, comment: string, periodo = false, medicamentos = ''): Observable<FoodAnalysis> {
    const fd = new FormData();
    fd.append('image', file);
    fd.append('comment', comment);
    fd.append('profileId', String(profileId));
    if (periodo) fd.append('periodo', 'true');
    if (medicamentos) fd.append('medicamentos', medicamentos);
    return this.http.post<FoodAnalysis>(`${API}/food/analyze`, fd);
  }

  analyzeCGM(file: File): Observable<{ sgv: number; direction: string }> {
    const fd = new FormData();
    fd.append('image', file);
    return this.http.post<{ sgv: number; direction: string }>(`${API}/food/analyze-cgm`, fd);
  }

  calculateDose(profileId: number, data: {
    carbs: number; currentBg: number; trend: string;
    foodDescription?: string; imagePath?: string;
  }): Observable<DoseResult> {
    return this.http.post<DoseResult>(`${API}/dose/calculate`, { ...data, profileId });
  }

  getHistory(profileId: number): Observable<DoseHistoryItem[]> {
    return this.http.get<DoseHistoryItem[]>(`${API}/dose/history?profileId=${profileId}`);
  }

  deleteDose(id: number): Observable<{ ok: boolean }> {
    return this.http.delete<{ ok: boolean }>(`${API}/dose/history/${id}`);
  }

  getNightscoutReading(): Observable<NightscoutReading> {
    return this.http.get<NightscoutReading>(`${API}/nightscout/current`);
  }
}
