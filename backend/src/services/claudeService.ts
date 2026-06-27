import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'fs';

const genai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY ?? '');
const model = genai.getGenerativeModel({ model: 'gemini-2.5-flash' });

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
  absorcion: 'rapida' | 'media' | 'lenta';
  tiempoEfecto: string;
  recomendacionTiming: string;
  ajusteContextual: string;
  dosisRetardada: DosisRetardada;
}

export interface ContextualFactors {
  periodo?: boolean;
  medicamentos?: string;
}

export interface ProfileParams {
  icr: number;
  isf: number;
  targetBg: number;
}

function toBase64(p: string) {
  const buf = fs.readFileSync(p);
  const ext = p.split('.').pop()?.toLowerCase() ?? 'jpeg';
  return { data: buf.toString('base64'), mimeType: ext === 'png' ? 'image/png' : 'image/jpeg' };
}

function round05(n: number) { return Math.round(n * 2) / 2; }

export async function analyzeFoodImage(
  imagePath: string,
  comment = '',
  contextual: ContextualFactors = {},
  profile?: ProfileParams
): Promise<FoodAnalysis> {
  const { data, mimeType } = toBase64(imagePath);

  const lines: string[] = [];
  if (contextual.periodo) lines.push('- Período menstrual activo (resistencia a insulina +10-30%).');
  if (contextual.medicamentos) lines.push(`- Medicamentos: ${contextual.medicamentos}.`);
  const ctx = lines.length ? `\nFACTORES CONTEXTUALES:\n${lines.join('\n')}` : '';
  const userNote = comment ? `Nota del usuario: "${comment}".` : '';
  const icrInfo = profile ? `\nPerfil de la usuaria: ICR=${profile.icr}g/U (1 unidad cubre ${profile.icr}g de carbos), ISF=${profile.isf}mg/dL por U, glucemia objetivo=${profile.targetBg}mg/dL.` : '';

  const prompt = `Eres especialista en nutrición y diabetes tipo 1. Analiza esta imagen de comida.${ctx}${icrInfo}
${userNote}

PASOS:
1. Identifica cada alimento y sus carbohidratos estimados.
2. Clasifica velocidad de absorción GLOBAL del plato:
   - RÁPIDA: arroz, pan, pasta, fruta, azúcar, patatas, cereales.
   - MEDIA: mezcla de rápidos y lentos.
   - LENTA: principalmente carne, pescado, huevos, queso, frutos secos (proteína/grasa dominante).
3. Indica en cuánto tiempo subirá el azúcar y cuándo pincharse la insulina rápida.
4. DOSIS RETARDADA (solo si absorción LENTA o MEDIA con proteína significativa):
   - La proteína se convierte en glucosa al ~50% en 3-6h.
   - Calcula: equivalente_glucosa = proteina_g * 0.5 (estima proteína si no es visible).
   - unidades = equivalente_glucosa / ICR, redondeado a múltiplo de 0.5. Mínimo 0.5u si recomendada.
   - cuandoMinutos: 120-180 para carnes puras, 90-120 para mezcla.
   - Si absorción RÁPIDA y sin proteína significativa: recomendada=false.
5. Factores contextuales: ajusta el texto de ajuste si aplica.

Responde ÚNICAMENTE con JSON válido (sin markdown, sin texto extra):
{
  "descripcion": "descripción breve",
  "alimentos": [{"nombre":"...","cantidad":"...","carbohidratos": número}],
  "totalCarbohidratos": número,
  "confianza": "alta|media|baja",
  "nota": "",
  "absorcion": "rapida|media|lenta",
  "tiempoEfecto": "ej: 15-30 minutos",
  "recomendacionTiming": "ej: Pínchate 10 min antes de comer",
  "ajusteContextual": "",
  "dosisRetardada": {
    "recomendada": true,
    "unidadesEstimadas": 2.0,
    "cuandoMinutos": 150,
    "nota": "Monitoriza tu glucemia en 2-3h y pínchate si supera 180 mg/dL"
  }
}`;

  const result = await model.generateContent([prompt, { inlineData: { data, mimeType } }]);
  const text = result.response.text();
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('No se pudo parsear la respuesta de la IA');
  const parsed = JSON.parse(jsonMatch[0]) as FoodAnalysis;

  if (parsed.dosisRetardada?.unidadesEstimadas) {
    parsed.dosisRetardada.unidadesEstimadas = round05(parsed.dosisRetardada.unidadesEstimadas);
  }
  return parsed;
}

export async function analyzeScreenshot(imagePath: string): Promise<{ sgv: number; direction: string }> {
  const { data, mimeType } = toBase64(imagePath);
  const result = await model.generateContent([
    `CGM screenshot (Dexcom). Extrae glucosa y tendencia. Solo JSON:
{"sgv": número mg/dL, "direction": "DoubleUp|SingleUp|FortyFiveUp|Flat|FortyFiveDown|SingleDown|DoubleDown"}`,
    { inlineData: { data, mimeType } },
  ]);
  const text = result.response.text();
  const m = text.match(/\{[\s\S]*\}/);
  if (!m) throw new Error('No se pudo leer la captura del CGM');
  return JSON.parse(m[0]);
}
