import { mapSnapshotRows } from "../../data/mapSnapshots";
import { cs2FoundationSources, realCs2Matches } from "../cs2RealData";
import { matchesTeamName, normalizeTeamName, resolveTeamAlias } from "../teamAliasResolver";
import type { ProviderBundle, ProviderContext, ProviderResult } from "./contracts";
import type { NormalizedMap, NormalizedMapPool, NormalizedMapResult, NormalizedMatch, NormalizedTeamMapStats, NormalizedTournament, ProviderQuality } from "./normalized";

const source = {
  providerName: "Liquipedia" as const,
  sourceType: "manual_snapshot" as const,
  sourceUrl: cs2FoundationSources.event,
  sourceLabel: "Liquipedia tournament snapshot",
  capturedAt: "2026-06-01",
  freshness: "snapshot" as const,
  reliabilityScore: 82
};

const quality = {
  dataKind: "real" as const,
  reliabilityScore: 82,
  freshness: "snapshot" as const,
  coverage: 58,
  notes: ["Ручной tournament snapshot; без live API, veto и map stats."]
};

const mapSnapshotQuality: ProviderQuality = {
  dataKind: "snapshot",
  reliabilityScore: 64,
  freshness: "snapshot",
  coverage: 42,
  sampleSize: 0,
  notes: [
    "Curated map snapshot for provider-layer validation.",
    "Не является live API и не содержит veto/CT/T/player stats."
  ]
};

const h2hMapResults: NormalizedMapResult[] = [
  mapResult("TYLOO", "9z", "Dust2", "9z", "13:10", "2026-05-12"),
  mapResult("TYLOO", "9z", "Inferno", "TYLOO", "13:9", "2026-05-12"),
  mapResult("Vitality", "NAVI", "Mirage", "Vitality", "13:8", "2026-05-03"),
  mapResult("Vitality", "NAVI", "Inferno", "NAVI", "16:14", "2026-05-03"),
  mapResult("Team Spirit", "MIBR", "Ancient", "Team Spirit", "13:7", "2026-04-28"),
  mapResult("Team Spirit", "NAVI", "Ancient", "Team Spirit", "13:11", "2026-05-18"),
  mapResult("Team Spirit", "NAVI", "Mirage", "NAVI", "13:9", "2026-05-18"),
  mapResult("Vitality", "MOUZ", "Inferno", "Vitality", "13:6", "2026-05-15"),
  mapResult("Vitality", "MOUZ", "Nuke", "MOUZ", "13:10", "2026-05-15"),
  mapResult("FaZe Clan", "G2", "Mirage", "G2", "13:8", "2026-05-11"),
  mapResult("FaZe Clan", "G2", "Inferno", "FaZe Clan", "16:13", "2026-05-11"),
  mapResult("Team Falcons", "G2", "Nuke", "Team Falcons", "13:9", "2026-05-06"),
  mapResult("Team Falcons", "G2", "Ancient", "G2", "13:10", "2026-05-06"),
  mapResult("TYLOO", "9z", "Ancient", "TYLOO", "13:11", "2026-04-21")
];

export const liquipediaSnapshotProvider: ProviderBundle = {
  providerName: "Liquipedia",
  capabilities: ["matches", "tournaments", "rosters", "maps", "h2h"],
  listTournaments: async (context?: ProviderContext) => result(filterByGame([normalizeTournament()], context)),
  getTournamentContext: async (name: string, context?: ProviderContext) => {
    const tournaments = filterByGame([normalizeTournament()], context);
    return result(tournaments.find((tournament) => matchesName(tournament.name, name)) ?? null);
  },
  listMatches: async (context?: ProviderContext) => result(filterByGame(realCs2Matches.map(normalizeMatch), context)),
  getMatch: async (matchId: string, context?: ProviderContext) => {
    const matches = filterByGame(realCs2Matches.map(normalizeMatch), context);
    return result(matches.find((match) => match.id === matchId || match.externalIds.liquipedia === matchId) ?? null);
  },
  getTeamMapPool: async (teamName: string, context?: ProviderContext) => mapResultWrapper(teamMapStats(teamName, context).map(normalizeLegacyMap)),
  getMatchMaps: async (_matchId: string, context?: ProviderContext) => mapResultWrapper(filterMapResults(h2hMapResults, context).map(resultToNormalizedMap)),
  listRecentMapsByTeam: async (teamName: string, context?: ProviderContext) => mapResultWrapper(recentMapsByTeam(teamName, context)),
  getTeamMapStats: async (teamName: string, context?: ProviderContext) => mapResultWrapper(teamMapStats(teamName, context)),
  getHeadToHeadMaps: async (teamAName: string, teamBName: string, context?: ProviderContext) =>
    mapResultWrapper(filterMapResults(h2hMapResults, context).filter((map) => headToHeadMatches(map, teamAName, teamBName))),
  getTournamentMatchMaps: async (_tournamentName: string, context?: ProviderContext) => mapResultWrapper(filterMapResults(h2hMapResults, context)),
  getNormalizedMapPool: async (teamName: string, context?: ProviderContext) => {
    const maps = teamMapStats(teamName, context);
    return mapResultWrapper(maps.length ? {
      id: `liquipedia-map-pool:${normalize(teamName)}`,
      game: "cs2",
      teamName,
      maps,
      sampleSize: maps.reduce((sum, map) => sum + map.mapsPlayed, 0),
      generatedFrom: "manual_snapshot",
      externalIds: { liquipediaUrl: cs2FoundationSources.event },
      source,
      quality: qualityForSample(maps.reduce((sum, map) => sum + map.mapsPlayed, 0))
    } : null);
  }
};

export async function liquipediaProvider() {
  return {
    enabled: true,
    source: "Liquipedia",
    mode: "manual_snapshot",
    reason: "Используются текущие сохраненные tournament/match данные проекта, без внешних запросов."
  };
}

function result<T>(data: T): ProviderResult<T> {
  return {
    data,
    source,
    quality,
    warnings: ["Нет внешнего Liquipedia API-запроса; слой доказывает переносимость через snapshot."]
  };
}

function mapResultWrapper<T>(data: T): ProviderResult<T> {
  return {
    data,
    source,
    quality: mapSnapshotQuality,
    warnings: [
      "Map data is a curated snapshot, not live Liquipedia API output.",
      "Veto, CT/T and player stats are missing, so Map Edge must stay Partial/Snapshot."
    ]
  };
}

function normalizeTournament(): NormalizedTournament {
  return {
    id: "liquipedia:tournament:iem-cologne-major-2026",
    name: "IEM Cologne Major 2026",
    game: "cs2",
    tier: "S-Tier",
    externalIds: {
      liquipediaUrl: cs2FoundationSources.event
    },
    source,
    quality
  };
}

function normalizeMatch(match: (typeof realCs2Matches)[number], index: number): NormalizedMatch {
  return {
    id: `liquipedia-match-snapshot:${index + 1}`,
    game: "cs2",
    teamAName: match.teamA,
    teamBName: match.teamB,
    tournamentName: "IEM Cologne Major 2026",
    status: match.status,
    format: match.format,
    importanceScore: match.importanceScore,
    startTime: new Date(Date.now() + match.startOffsetHours * 60 * 60 * 1000).toISOString(),
    externalIds: {
      liquipedia: `liquipedia-match-snapshot:${index + 1}`,
      liquipediaUrl: cs2FoundationSources.event
    },
    source,
    quality: {
      ...quality,
      coverage: 54,
      notes: [match.officialContext]
    }
  };
}

function filterByGame<T extends { game: string }>(items: T[], context?: ProviderContext) {
  if (context?.game && context.game !== "cs2") return [];
  return items.slice(0, context?.limit ?? items.length);
}

function normalize(value: string) {
  return normalizeTeamName(value);
}

function matchesName(sourceName: string, targetName: string) {
  const source = normalize(sourceName);
  const target = normalize(targetName);
  return source.includes(target) || target.includes(source);
}

function mapResult(teamAName: string, teamBName: string, mapName: string, winnerName: string, score: string, playedAt: string): NormalizedMapResult {
  return {
    id: `liquipedia-map-result:${normalize(teamAName)}:${normalize(teamBName)}:${normalize(mapName)}:${playedAt}`,
    game: "cs2",
    mapName,
    teamAName,
    teamBName,
    winnerName,
    score,
    playedAt,
    tournamentName: "IEM Cologne Major 2026 snapshot",
    matchFormat: "BO3",
    externalIds: { liquipediaUrl: cs2FoundationSources.event },
    source,
    quality: qualityForSample(1)
  };
}

function teamMapStats(teamName: string, context?: ProviderContext): NormalizedTeamMapStats[] {
  if (context?.game && context.game !== "cs2") return [];
  const canonicalTeamName = resolveTeamAlias(teamName);
  return mapSnapshotRows
    .filter((row) => matchesTeamName(row.teamName, canonicalTeamName))
    .map((row) => {
      const sampleSize = row.matchesPlayed;
      return {
        id: `liquipedia-team-map:${normalize(row.teamName)}:${normalize(row.mapName)}`,
        game: "cs2" as const,
        teamName: row.teamName,
        mapName: row.mapName,
        wins: row.wins,
        losses: row.losses,
        mapsPlayed: sampleSize,
        winrate: Math.round((row.wins / sampleSize) * 100),
        lastPlayedAt: row.lastPlayedAt,
        frequency: frequencyForTeam(row.teamName, sampleSize),
        recentResults: row.recentResults,
        dataQualityScore: mapDataQualityScore(sampleSize, row.lastPlayedAt, Boolean(row.sourceUrl), row.verificationStatus),
        capturedAt: row.capturedAt,
        verificationStatus: row.verificationStatus,
        externalIds: { liquipediaUrl: row.sourceUrl },
        source: { ...source, sourceUrl: row.sourceUrl, sourceLabel: `${row.teamName} Liquipedia snapshot` },
        quality: qualityForSample(sampleSize, row.lastPlayedAt, Boolean(row.sourceUrl), row.verificationStatus)
      };
    })
    .slice(0, context?.limit ?? mapSnapshotRows.length);
}

function qualityForSample(sampleSize: number, lastPlayedAt?: string, hasSourceUrl = true, verificationStatus: "verified" | "manual" | "unverified" = "manual"): ProviderQuality {
  return {
    ...mapSnapshotQuality,
    sampleSize,
    coverage: sampleSize >= 20 ? 64 : sampleSize >= 12 ? 56 : sampleSize >= 8 ? 48 : 36,
    reliabilityScore: mapDataQualityScore(sampleSize, lastPlayedAt, hasSourceUrl, verificationStatus),
    notes: [
      ...(mapSnapshotQuality.notes ?? []),
      lastPlayedAt ? `Last map sample captured around ${lastPlayedAt}.` : "No last played date.",
      hasSourceUrl ? "Liquipedia team/source URL stored." : "Missing source URL.",
      `Verification status: ${verificationStatus}.`
    ]
  };
}

function mapDataQualityScore(sampleSize: number, lastPlayedAt?: string, hasSourceUrl = true, verificationStatus: "verified" | "manual" | "unverified" = "manual") {
  const sampleScore = sampleSize >= 18 ? 34 : sampleSize >= 12 ? 28 : sampleSize >= 8 ? 22 : 12;
  const freshnessScore = freshnessDays(lastPlayedAt) <= 21 ? 22 : freshnessDays(lastPlayedAt) <= 45 ? 16 : 8;
  const sourceScore = hasSourceUrl ? 16 : 0;
  const completenessScore = 14;
  const verificationScore = verificationStatus === "verified" ? 8 : verificationStatus === "manual" ? 4 : 0;
  const missingVetoPenalty = 8;
  return Math.max(20, Math.min(82, sampleScore + freshnessScore + sourceScore + completenessScore + verificationScore - missingVetoPenalty));
}

function freshnessDays(value?: string) {
  if (!value) return 999;
  const captured = new Date(source.capturedAt).getTime();
  const played = new Date(value).getTime();
  return Math.max(0, Math.round((captured - played) / (24 * 60 * 60 * 1000)));
}

function frequencyForTeam(teamName: string, sampleSize: number) {
  const total = mapSnapshotRows
    .filter((row) => matchesTeamName(row.teamName, teamName))
    .reduce((sum, row) => sum + row.matchesPlayed, 0);
  return total ? Math.round((sampleSize / total) * 100) : 0;
}

function recentMapsByTeam(teamName: string, context?: ProviderContext): NormalizedMapResult[] {
  if (context?.game && context.game !== "cs2") return [];
  const canonicalTeamName = resolveTeamAlias(teamName);
  const rows = mapSnapshotRows
    .filter((row) => matchesTeamName(row.teamName, canonicalTeamName))
    .flatMap((row) => row.recentResults.map((result, index) => syntheticRecentMap(row, result, index)))
    .sort((a, b) => String(b.playedAt).localeCompare(String(a.playedAt)));
  return rows.slice(0, context?.limit ?? rows.length);
}

function syntheticRecentMap(row: (typeof mapSnapshotRows)[number], result: "W" | "L", index: number): NormalizedMapResult {
  const playedAt = shiftDate(row.lastPlayedAt, index * 5);
  return {
    id: `liquipedia-recent-map:${normalize(row.teamName)}:${normalize(row.mapName)}:${playedAt}:${index}`,
    game: "cs2",
    mapName: row.mapName,
    teamAName: row.teamName,
    teamBName: "Recent opponent snapshot",
    winnerName: result === "W" ? row.teamName : "Recent opponent snapshot",
    score: result === "W" ? "W" : "L",
    playedAt,
    tournamentName: "Liquipedia recent results snapshot",
    matchFormat: "BO3",
    externalIds: { liquipediaUrl: row.sourceUrl },
    source: { ...source, sourceUrl: row.sourceUrl, sourceLabel: `${row.teamName} Liquipedia recent maps snapshot` },
    quality: qualityForSample(1, playedAt, Boolean(row.sourceUrl), row.verificationStatus)
  };
}

function shiftDate(value: string, daysBack: number) {
  const date = new Date(value);
  date.setUTCDate(date.getUTCDate() - daysBack);
  return date.toISOString().slice(0, 10);
}

function normalizeLegacyMap(map: NormalizedTeamMapStats): NormalizedMap {
  return {
    id: map.id,
    mapName: map.mapName,
    mapsPlayed: map.mapsPlayed,
    teamAName: map.teamName,
    teamAWinrate: map.winrate,
    externalIds: map.externalIds,
    source: map.source,
    quality: map.quality
  };
}

function resultToNormalizedMap(map: NormalizedMapResult): NormalizedMap {
  return {
    id: map.id,
    mapName: map.mapName,
    teamAName: map.teamAName,
    teamBName: map.teamBName,
    externalIds: map.externalIds,
    source: map.source,
    quality: map.quality
  };
}

function filterMapResults(results: NormalizedMapResult[], context?: ProviderContext) {
  if (context?.game && context.game !== "cs2") return [];
  return results.slice(0, context?.limit ?? results.length);
}

function teamMatches(map: NormalizedMapResult, teamName: string) {
  return matchesTeamName(map.teamAName, teamName) || matchesTeamName(map.teamBName, teamName);
}

function headToHeadMatches(map: NormalizedMapResult, teamAName: string, teamBName: string) {
  return (matchesTeamName(map.teamAName, teamAName) && matchesTeamName(map.teamBName, teamBName)) || (matchesTeamName(map.teamAName, teamBName) && matchesTeamName(map.teamBName, teamAName));
}
