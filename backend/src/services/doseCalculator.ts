export interface DoseInput {
  carbs: number;
  currentBg: number;
  trend: string;
  icr: number;
  isf: number;
  targetBg: number;
}

export interface DoseResult {
  carbDose: number;
  correctionDose: number;
  trendAdjustment: number;
  totalDose: number;
  roundedDose: number;
  explanation: string;
}

const TREND_FACTORS: Record<string, number> = {
  DoubleUp: 0.20,
  SingleUp: 0.10,
  FortyFiveUp: 0.05,
  Flat: 0,
  FortyFiveDown: -0.05,
  SingleDown: -0.10,
  DoubleDown: -0.20,
  'NOT COMPUTABLE': 0,
  'RATE OUT OF RANGE': 0,
  None: 0,
};

const TREND_LABELS: Record<string, string> = {
  DoubleUp: 'subiendo rápido ↑↑',
  SingleUp: 'subiendo ↑',
  FortyFiveUp: 'subiendo ligeramente ↗',
  Flat: 'estable →',
  FortyFiveDown: 'bajando ligeramente ↘',
  SingleDown: 'bajando ↓',
  DoubleDown: 'bajando rápido ↓↓',
  None: 'sin tendencia',
};

function roundToHalf(value: number): number {
  return Math.round(value * 2) / 2;
}

export function calculateDose(input: DoseInput): DoseResult {
  const { carbs, currentBg, trend, icr, isf, targetBg } = input;

  const carbDose = carbs / icr;
  const correctionDose = (currentBg - targetBg) / isf;
  const subtotal = carbDose + correctionDose;

  const trendFactor = TREND_FACTORS[trend] ?? 0;
  const trendAdjustment = subtotal * trendFactor;

  const total = Math.max(0, subtotal + trendAdjustment);
  const roundedDose = roundToHalf(total);

  const parts: string[] = [];
  parts.push(`Dosis por comida: ${carbDose.toFixed(2)}u (${carbs}g carbos ÷ ratio ${icr})`);

  if (Math.abs(correctionDose) >= 0.1) {
    const sign = correctionDose >= 0 ? '+' : '';
    parts.push(
      `Corrección glucemia: ${sign}${correctionDose.toFixed(2)}u ` +
      `(${currentBg} - ${targetBg} mg/dL ÷ factor ${isf})`
    );
  }

  if (Math.abs(trendAdjustment) >= 0.05) {
    const sign = trendAdjustment >= 0 ? '+' : '';
    const label = TREND_LABELS[trend] ?? trend;
    parts.push(
      `Ajuste tendencia (${label}): ${sign}${trendAdjustment.toFixed(2)}u`
    );
  }

  parts.push(`Total redondeado a 0.5u: **${roundedDose}u**`);

  return {
    carbDose: parseFloat(carbDose.toFixed(2)),
    correctionDose: parseFloat(correctionDose.toFixed(2)),
    trendAdjustment: parseFloat(trendAdjustment.toFixed(2)),
    totalDose: parseFloat(total.toFixed(2)),
    roundedDose,
    explanation: parts.join('\n'),
  };
}

export function estimateParamsFromTDD(tdd: number) {
  return {
    icr: parseFloat((500 / tdd).toFixed(1)),
    isf: parseFloat((1800 / tdd).toFixed(1)),
  };
}
