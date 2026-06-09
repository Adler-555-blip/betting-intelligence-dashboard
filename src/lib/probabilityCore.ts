export function sigmoid(x: number) {
  return 1 / (1 + Math.exp(-x));
}

export function clampProbability(value: number) {
  if (!Number.isFinite(value)) return 50;
  return Math.max(1, Math.min(99, value));
}

export function decimalOddsToImpliedProbability(odds: number | null | undefined) {
  if (!odds || odds <= 1) return 0;
  return clampProbability((1 / odds) * 100);
}

export function calculateNoVigProbability(oddsA: number | null | undefined, oddsB: number | null | undefined) {
  const impliedA = decimalOddsToImpliedProbability(oddsA);
  const impliedB = decimalOddsToImpliedProbability(oddsB);
  const total = impliedA + impliedB;

  if (!total) {
    return { teamA: 0, teamB: 0, overround: 0 };
  }

  return {
    teamA: (impliedA / total) * 100,
    teamB: (impliedB / total) * 100,
    overround: total - 100
  };
}

export function calculateEdgePercent(systemProbability: number, impliedProbability: number) {
  if (!impliedProbability) return 0;
  return round1(systemProbability - impliedProbability);
}

export function calculateExpectedValue(systemProbability: number, odds: number | null | undefined) {
  if (!odds || odds <= 1) return 0;
  return round1(((systemProbability / 100) * odds - 1) * 100);
}

export function normalizeScoreToProbability(score: number, minProbability: number, maxProbability: number) {
  const normalized = Math.max(0, Math.min(100, score)) / 100;
  return clampProbability(minProbability + normalized * (maxProbability - minProbability));
}

export function round1(value: number) {
  return Math.round(value * 10) / 10;
}
