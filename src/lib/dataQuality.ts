export type EdgeFeatureSource = "Real" | "Demo" | "Fallback" | "Missing";
export type EdgeFeatureImpact = "positive" | "negative" | "neutral";

export type EdgeFeature = {
  name: string;
  value: string | number;
  weight: number;
  source: EdgeFeatureSource;
  impact: EdgeFeatureImpact;
  note?: string;
};

type QualityInputs = {
  sourceReliability: number;
  freshness: number;
  sampleSize: number;
  coverage: number;
  provenance: number;
  consistency: number;
};

const sourceReliability: Record<EdgeFeatureSource, number> = {
  Real: 92,
  Demo: 38,
  Fallback: 18,
  Missing: 0
};

export function calculateDataQualityScore(features: EdgeFeature[]) {
  if (!features.length) return 0;

  const totalWeight = features.reduce((sum, feature) => sum + positiveWeight(feature.weight), 0) || 1;
  const weighted = features.reduce((sum, feature) => {
    const weight = positiveWeight(feature.weight);
    return sum + featureQuality(feature, features) * weight;
  }, 0);

  return clampQuality(weighted / totalWeight);
}

export function featureQuality(feature: EdgeFeature, allFeatures: EdgeFeature[] = [feature]) {
  const inputs: QualityInputs = {
    sourceReliability: sourceReliability[feature.source],
    freshness: freshnessScore(feature),
    sampleSize: sampleSizeScore(feature),
    coverage: coverageScore(feature, allFeatures),
    provenance: provenanceScore(feature),
    consistency: consistencyScore(feature)
  };

  return clampQuality(
    0.25 * inputs.sourceReliability +
    0.2 * inputs.freshness +
    0.2 * inputs.sampleSize +
    0.15 * inputs.coverage +
    0.1 * inputs.provenance +
    0.1 * inputs.consistency
  );
}

export function sourceLabel(value: EdgeFeatureSource) {
  if (value === "Real") return "Реальные данные";
  if (value === "Demo") return "Демо-данные";
  if (value === "Fallback") return "Fallback";
  return "Недостаточно данных";
}

function freshnessScore(feature: EdgeFeature) {
  if (feature.source === "Real") return 75;
  if (feature.source === "Demo") return 35;
  if (feature.source === "Fallback") return 20;
  return 0;
}

function sampleSizeScore(feature: EdgeFeature) {
  const text = `${feature.name} ${feature.value} ${feature.note ?? ""}`.toLowerCase();
  const numericValue = typeof feature.value === "number" ? feature.value : Number(String(feature.value).match(/\d+/)?.[0]);

  if (feature.source === "Missing") return 0;
  if (text.includes("нет") || text.includes("unknown") || text.includes("missing")) return 0;
  if (text.includes("sample") || text.includes("сыграно") || text.includes("снимков")) {
    if (Number.isFinite(numericValue) && numericValue >= 10) return feature.source === "Real" ? 85 : 45;
    if (Number.isFinite(numericValue) && numericValue >= 3) return feature.source === "Real" ? 60 : 35;
    return 20;
  }
  if (feature.source === "Real") return 70;
  if (feature.source === "Demo") return 35;
  return 15;
}

function coverageScore(feature: EdgeFeature, allFeatures: EdgeFeature[]) {
  const usable = allFeatures.filter((item) => item.source !== "Missing").length;
  const coverage = (usable / allFeatures.length) * 100;
  if (feature.source === "Missing") return 0;
  return coverage;
}

function provenanceScore(feature: EdgeFeature) {
  if (feature.source === "Real" && feature.note) return 90;
  if (feature.source === "Real") return 75;
  if (feature.source === "Demo") return 35;
  if (feature.source === "Fallback") return 20;
  return 0;
}

function consistencyScore(feature: EdgeFeature) {
  if (feature.source === "Missing") return 0;
  if (feature.impact === "neutral") return 55;
  if (feature.source === "Real") return 80;
  if (feature.source === "Demo") return 45;
  return 25;
}

function positiveWeight(value: number) {
  return Math.max(0, value);
}

function clampQuality(value: number) {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, Math.round(value)));
}
