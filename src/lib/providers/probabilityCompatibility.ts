import type { EdgeFeature, EdgeFeatureSource } from "../dataQuality";
import { calculateDataQualityScore } from "../dataQuality";
import type { NormalizedMap, NormalizedMatch, NormalizedPlayer, NormalizedTeam, NormalizedTournament, ProviderQuality } from "./normalized";

export type ProviderFeatureSnapshot = {
  features: EdgeFeature[];
  dataQualityScore: number;
  canUseForProbability: boolean;
  missingInputs: string[];
};

export function buildTeamFeatureSnapshot(team: NormalizedTeam | null): ProviderFeatureSnapshot {
  const features: EdgeFeature[] = [
    feature("Team identity", team?.name ?? "нет данных", 15, team ? sourceFromQuality(team.quality) : "Missing", team ? "neutral" : "negative"),
    feature("Team ranking", team?.ranking?.rank ?? "нет данных", 30, team?.ranking?.rank ? sourceFromQuality(team.quality) : "Missing", team?.ranking?.rank ? "positive" : "negative"),
    feature("Ranking points", team?.ranking?.points ?? "нет данных", 20, team?.ranking?.points ? sourceFromQuality(team.quality) : "Missing", "neutral"),
    feature("Provider reliability", team?.quality.reliabilityScore ?? "нет данных", 20, team ? sourceFromQuality(team.quality) : "Missing", "neutral"),
    feature("Provider coverage", team?.quality.coverage ?? "нет данных", 15, team ? sourceFromQuality(team.quality) : "Missing", "neutral")
  ];

  return snapshot(features, ["map pool", "recent form", "player logs"].filter((item) => !team || item !== "recent form"));
}

export function buildPlayerFeatureSnapshot(players: NormalizedPlayer[]): ProviderFeatureSnapshot {
  const hasStats = players.some((player) => player.stats?.averageKills || player.stats?.kd || player.stats?.adr);
  const features: EdgeFeature[] = [
    feature("Roster size", players.length, 25, players.length ? sourceFromQuality(players[0].quality) : "Missing", players.length >= 5 ? "positive" : "negative"),
    feature("Average kills", hasStats ? "есть" : "нет данных", 25, hasStats ? sourceFromQuality(players[0].quality) : "Missing", hasStats ? "positive" : "negative"),
    feature("K/D", hasStats ? "есть" : "нет данных", 20, hasStats ? sourceFromQuality(players[0].quality) : "Missing", "neutral"),
    feature("ADR", hasStats ? "есть" : "нет данных", 20, hasStats ? sourceFromQuality(players[0].quality) : "Missing", "neutral"),
    feature("Provider coverage", players[0]?.quality.coverage ?? "нет данных", 10, players.length ? sourceFromQuality(players[0].quality) : "Missing", "neutral")
  ];

  return snapshot(features, hasStats ? [] : ["player match logs", "kills", "K/D", "ADR"]);
}

export function buildMapFeatureSnapshot(maps: NormalizedMap[]): ProviderFeatureSnapshot {
  const hasMapPool = maps.length > 0;
  const hasWinrate = maps.some((map) => typeof map.teamAWinrate === "number" || typeof map.teamBWinrate === "number");
  const hasSideStats = maps.some((map) => typeof map.teamACTWinrate === "number" || typeof map.teamATWinrate === "number");
  const source = maps[0] ? sourceFromQuality(maps[0].quality) : "Missing";
  const features: EdgeFeature[] = [
    feature("Map pool", hasMapPool ? maps.length : "нет данных", 30, hasMapPool ? source : "Missing", hasMapPool ? "positive" : "negative"),
    feature("Map winrate", hasWinrate ? "есть" : "нет данных", 25, hasWinrate ? source : "Missing", hasWinrate ? "positive" : "negative"),
    feature("CT/T", hasSideStats ? "есть" : "нет данных", 20, hasSideStats ? source : "Missing", hasSideStats ? "positive" : "negative"),
    feature("Sample size", maps[0]?.quality.sampleSize ?? "нет данных", 15, hasMapPool ? source : "Missing", "neutral"),
    feature("Veto probability", "нет данных", 10, "Missing", "negative")
  ];

  return snapshot(features, ["veto probability"].concat(hasWinrate ? [] : ["map winrate"]).concat(hasSideStats ? [] : ["CT/T"]));
}

export function buildMatchFeatureSnapshot(match: NormalizedMatch | null): ProviderFeatureSnapshot {
  const features: EdgeFeature[] = [
    feature("Match identity", match ? `${match.teamAName} vs ${match.teamBName}` : "нет данных", 20, match ? sourceFromQuality(match.quality) : "Missing", match ? "neutral" : "negative"),
    feature("Tournament", match?.tournamentName ?? "нет данных", 20, match ? sourceFromQuality(match.quality) : "Missing", "neutral"),
    feature("Format", match?.format ?? "нет данных", 20, match ? sourceFromQuality(match.quality) : "Missing", "neutral"),
    feature("Start time", match?.startTime ?? "нет данных", 15, match?.startTime ? sourceFromQuality(match.quality) : "Missing", "neutral"),
    feature("Provider quality", match?.quality.reliabilityScore ?? "нет данных", 25, match ? sourceFromQuality(match.quality) : "Missing", "neutral")
  ];

  return snapshot(features, match ? [] : ["match"]);
}

export function buildTournamentFeatureSnapshot(tournament: NormalizedTournament | null): ProviderFeatureSnapshot {
  const features: EdgeFeature[] = [
    feature("Tournament", tournament?.name ?? "нет данных", 25, tournament ? sourceFromQuality(tournament.quality) : "Missing", tournament ? "neutral" : "negative"),
    feature("Tournament tier", tournament?.tier ?? "нет данных", 15, tournament ? sourceFromQuality(tournament.quality) : "Missing", "neutral"),
    feature("Provider reliability", tournament?.quality.reliabilityScore ?? "нет данных", 25, tournament ? sourceFromQuality(tournament.quality) : "Missing", "neutral"),
    feature("Provider coverage", tournament?.quality.coverage ?? "нет данных", 20, tournament ? sourceFromQuality(tournament.quality) : "Missing", "neutral"),
    feature("Freshness", tournament?.quality.freshness ?? "нет данных", 15, tournament ? sourceFromQuality(tournament.quality) : "Missing", "neutral")
  ];

  return snapshot(features, tournament ? [] : ["tournament context"]);
}

export function sourceFromQuality(quality: ProviderQuality): EdgeFeatureSource {
  if (quality.dataKind === "real") return "Real";
  if (quality.dataKind === "partial") return "Partial";
  if (quality.dataKind === "snapshot") return "Snapshot";
  if (quality.dataKind === "demo") return "Demo";
  if (quality.dataKind === "fallback") return "Fallback";
  return "Missing";
}

function snapshot(features: EdgeFeature[], missingInputs: string[]): ProviderFeatureSnapshot {
  const dataQualityScore = calculateDataQualityScore(features);
  return {
    features,
    dataQualityScore,
    canUseForProbability: dataQualityScore >= 45 && missingInputs.length <= 2,
    missingInputs
  };
}

function feature(name: string, value: string | number, weight: number, source: EdgeFeatureSource, impact: EdgeFeature["impact"]): EdgeFeature {
  return { name, value, weight, source, impact };
}
