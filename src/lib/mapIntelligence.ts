import { liquipediaSnapshotProvider } from "./providers/liquipediaProvider";
import type { MapProvider } from "./providers/contracts";
import type { NormalizedMapResult, NormalizedTeamMapStats } from "./providers/normalized";

export type MapPoolEntry = {
  mapName: string;
  matchesPlayed: number;
  wins: number;
  losses: number;
  winrate: number;
  lastPlayedAt?: Date;
  frequency: number;
  recentResults: Array<"W" | "L">;
  source: string;
  sourceUrl?: string;
  sampleSize: number;
  freshness: string;
  dataQualityScore: number;
  capturedAt?: string;
  verificationStatus?: "verified" | "manual" | "unverified";
};

export type TeamMapProfile = {
  teamId: string;
  teamName: string;
  maps: MapPoolEntry[];
  strongestMaps: MapPoolEntry[];
  weakestMaps: MapPoolEntry[];
  mostPlayedMaps: MapPoolEntry[];
  sampleSize: number;
  source: string;
  sourceUrl?: string;
  dataQualityScore: number;
  limitations: string[];
};

export type MapFeatureSnapshot = {
  mapName: string;
  teamWinrate: number;
  opponentWinrate: number;
  sampleSize: number;
  recentForm: string;
  source: string;
  qualityScore: number;
};

export async function buildTeamMapProfile(teamName: string, provider: MapProvider = liquipediaSnapshotProvider as MapProvider): Promise<TeamMapProfile> {
  const [statsResult, recentResult] = await Promise.all([
    provider.getTeamMapStats(teamName, { game: "cs2" }),
    provider.listRecentMapsByTeam(teamName, { game: "cs2", limit: 40 })
  ]);
  const stats = statsResult.data;
  const recentMaps = recentResult.data;
  const maps = stats.map((map) => mapPoolEntry(map, recentMaps));
  const sampleSize = maps.reduce((sum, map) => sum + map.matchesPlayed, 0);
  const qualityScores = maps.map((map) => map.dataQualityScore);

  return {
    teamId: `team-map-profile:${normalize(teamName)}`,
    teamName,
    maps,
    strongestMaps: [...maps].filter((map) => map.matchesPlayed >= 5).sort((a, b) => b.winrate - a.winrate || b.matchesPlayed - a.matchesPlayed).slice(0, 3),
    weakestMaps: [...maps].filter((map) => map.matchesPlayed >= 5).sort((a, b) => a.winrate - b.winrate || b.matchesPlayed - a.matchesPlayed).slice(0, 3),
    mostPlayedMaps: [...maps].sort((a, b) => b.matchesPlayed - a.matchesPlayed || b.winrate - a.winrate).slice(0, 3),
    sampleSize,
    source: statsResult.source.providerName,
    sourceUrl: statsResult.source.sourceUrl,
    dataQualityScore: qualityScores.length ? Math.round(qualityScores.reduce((sum, score) => sum + score, 0) / qualityScores.length) : 0,
    limitations: [
      "Liquipedia snapshot, not live API sync",
      "No veto sequence",
      "No CT/T split",
      "No player stats attached to map sample",
      "Opponent strength is not fully normalized yet"
    ]
  };
}

export async function buildMapFeatureSnapshots(teamName: string, opponentName: string, provider: MapProvider = liquipediaSnapshotProvider as MapProvider): Promise<MapFeatureSnapshot[]> {
  const [teamProfile, opponentProfile] = await Promise.all([
    buildTeamMapProfile(teamName, provider),
    buildTeamMapProfile(opponentName, provider)
  ]);
  const opponentMaps = new Map(opponentProfile.maps.map((map) => [map.mapName, map]));

  return teamProfile.maps.map((map) => {
    const opponentMap = opponentMaps.get(map.mapName);
    const sampleSize = map.matchesPlayed + (opponentMap?.matchesPlayed ?? 0);
    const qualityScore = Math.round((map.dataQualityScore + (opponentMap?.dataQualityScore ?? 0)) / (opponentMap ? 2 : 1));

    return {
      mapName: map.mapName,
      teamWinrate: map.winrate,
      opponentWinrate: opponentMap?.winrate ?? 0,
      sampleSize,
      recentForm: map.recentResults.join("-") || "нет recent snapshot",
      source: map.source,
      qualityScore
    };
  });
}

function mapPoolEntry(map: NormalizedTeamMapStats, recentMaps: NormalizedMapResult[]): MapPoolEntry {
  const recentResults = recentMaps
    .filter((result) => result.mapName === map.mapName)
    .slice(0, 5)
    .map((result) => (result.winnerName === map.teamName ? "W" : "L"));

  return {
    mapName: map.mapName,
    matchesPlayed: map.mapsPlayed,
    wins: map.wins,
    losses: map.losses,
    winrate: map.winrate,
    lastPlayedAt: map.lastPlayedAt ? new Date(map.lastPlayedAt) : undefined,
    frequency: map.frequency ?? 0,
    recentResults: recentResults.length ? recentResults : map.recentResults ?? [],
    source: map.source.providerName,
    sourceUrl: map.source.sourceUrl,
    sampleSize: map.quality.sampleSize ?? map.mapsPlayed,
    freshness: map.quality.freshness,
    dataQualityScore: map.dataQualityScore ?? map.quality.reliabilityScore,
    capturedAt: map.capturedAt,
    verificationStatus: map.verificationStatus
  };
}

function normalize(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}
