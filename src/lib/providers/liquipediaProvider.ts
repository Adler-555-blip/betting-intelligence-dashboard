import { cs2FoundationSources, realCs2Matches } from "../cs2RealData";
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

type MapSnapshotRow = {
  teamName: string;
  mapName: string;
  wins: number;
  losses: number;
  lastPlayedAt: string;
  recentResults: Array<"W" | "L">;
  sourceUrl: string;
};

const mapSnapshotRows: MapSnapshotRow[] = [
  mapRow("NAVI", "Mirage", 8, 4, "2026-05-30", ["W", "L", "W", "W", "L"]),
  mapRow("NAVI", "Ancient", 7, 5, "2026-05-26", ["L", "W", "W", "L", "W"]),
  mapRow("NAVI", "Nuke", 5, 6, "2026-05-22", ["L", "L", "W", "W", "L"]),
  mapRow("NAVI", "Inferno", 6, 4, "2026-05-18", ["W", "W", "L", "W", "L"]),
  mapRow("NAVI", "Anubis", 3, 4, "2026-05-10", ["L", "W", "L", "W", "L"]),
  mapRow("Team Spirit", "Ancient", 9, 3, "2026-06-01", ["W", "W", "L", "W", "W"]),
  mapRow("Team Spirit", "Mirage", 7, 4, "2026-05-28", ["W", "L", "W", "W", "L"]),
  mapRow("Team Spirit", "Nuke", 6, 5, "2026-05-20", ["L", "W", "L", "W", "W"]),
  mapRow("Team Spirit", "Dust2", 5, 4, "2026-05-18", ["W", "L", "W", "L", "W"]),
  mapRow("Team Spirit", "Anubis", 4, 3, "2026-05-11", ["W", "W", "L", "L", "W"]),
  mapRow("Vitality", "Inferno", 10, 3, "2026-05-31", ["W", "W", "W", "L", "W"]),
  mapRow("Vitality", "Mirage", 8, 3, "2026-05-29", ["W", "L", "W", "W", "W"]),
  mapRow("Vitality", "Nuke", 7, 4, "2026-05-21", ["L", "W", "W", "L", "W"]),
  mapRow("Vitality", "Dust2", 5, 4, "2026-05-16", ["W", "L", "W", "L", "W"]),
  mapRow("Vitality", "Anubis", 6, 3, "2026-05-12", ["W", "W", "L", "W", "L"]),
  mapRow("MOUZ", "Nuke", 8, 4, "2026-05-30", ["W", "W", "L", "W", "L"]),
  mapRow("MOUZ", "Ancient", 7, 4, "2026-05-25", ["W", "L", "W", "W", "L"]),
  mapRow("MOUZ", "Inferno", 5, 6, "2026-05-19", ["L", "W", "L", "L", "W"]),
  mapRow("MOUZ", "Mirage", 5, 5, "2026-05-14", ["W", "L", "W", "L", "W"]),
  mapRow("MOUZ", "Vertigo", 4, 5, "2026-05-08", ["L", "L", "W", "W", "L"]),
  mapRow("FaZe Clan", "Mirage", 6, 6, "2026-05-27", ["W", "L", "L", "W", "W"]),
  mapRow("FaZe Clan", "Inferno", 7, 5, "2026-05-24", ["W", "W", "L", "L", "W"]),
  mapRow("FaZe Clan", "Nuke", 5, 7, "2026-05-17", ["L", "W", "L", "L", "W"]),
  mapRow("FaZe Clan", "Ancient", 4, 5, "2026-05-13", ["L", "W", "L", "W", "L"]),
  mapRow("FaZe Clan", "Dust2", 5, 4, "2026-05-09", ["W", "L", "W", "L", "W"]),
  mapRow("G2", "Mirage", 8, 4, "2026-05-29", ["W", "W", "L", "W", "L"]),
  mapRow("G2", "Inferno", 7, 5, "2026-05-25", ["L", "W", "W", "L", "W"]),
  mapRow("G2", "Ancient", 6, 5, "2026-05-20", ["W", "L", "W", "L", "W"]),
  mapRow("G2", "Anubis", 5, 5, "2026-05-14", ["L", "W", "L", "W", "W"]),
  mapRow("G2", "Nuke", 4, 6, "2026-05-09", ["L", "L", "W", "L", "W"]),
  mapRow("Team Falcons", "Nuke", 8, 4, "2026-05-28", ["W", "L", "W", "W", "L"]),
  mapRow("Team Falcons", "Ancient", 7, 5, "2026-05-24", ["W", "W", "L", "L", "W"]),
  mapRow("Team Falcons", "Mirage", 6, 5, "2026-05-19", ["L", "W", "W", "L", "W"]),
  mapRow("Team Falcons", "Inferno", 5, 5, "2026-05-13", ["W", "L", "L", "W", "W"]),
  mapRow("Team Falcons", "Dust2", 4, 5, "2026-05-08", ["L", "W", "L", "W", "L"]),
  mapRow("TYLOO", "Inferno", 6, 5, "2026-05-29", ["W", "L", "W", "L", "W"]),
  mapRow("TYLOO", "Ancient", 5, 5, "2026-05-22", ["L", "W", "L", "W", "W"]),
  mapRow("TYLOO", "Dust2", 7, 4, "2026-05-20", ["W", "W", "L", "W", "L"]),
  mapRow("TYLOO", "Mirage", 4, 6, "2026-05-14", ["L", "L", "W", "L", "W"]),
  mapRow("TYLOO", "Nuke", 3, 5, "2026-05-08", ["L", "W", "L", "L", "W"]),
  mapRow("9z", "Dust2", 6, 4, "2026-05-28", ["W", "L", "W", "W", "L"]),
  mapRow("9z", "Ancient", 5, 6, "2026-05-24", ["L", "W", "L", "W", "L"]),
  mapRow("9z", "Inferno", 4, 6, "2026-05-17", ["L", "L", "W", "L", "W"]),
  mapRow("9z", "Mirage", 5, 5, "2026-05-11", ["W", "L", "W", "L", "L"]),
  mapRow("9z", "Nuke", 3, 5, "2026-05-07", ["L", "W", "L", "L", "W"]),
  mapRow("MIBR", "Mirage", 5, 6, "2026-05-26", ["L", "W", "L", "W", "L"]),
  mapRow("MIBR", "Ancient", 4, 7, "2026-05-22", ["L", "L", "W", "L", "W"]),
  mapRow("MIBR", "Nuke", 5, 5, "2026-05-18", ["W", "L", "W", "L", "W"]),
  mapRow("B8", "Ancient", 6, 5, "2026-05-25", ["W", "L", "W", "L", "W"]),
  mapRow("B8", "Mirage", 5, 5, "2026-05-20", ["L", "W", "W", "L", "L"]),
  mapRow("M80", "Nuke", 6, 4, "2026-05-24", ["W", "L", "W", "W", "L"]),
  mapRow("M80", "Inferno", 5, 6, "2026-05-18", ["L", "W", "L", "W", "L"]),
  mapRow("BetBoom Team", "Ancient", 5, 5, "2026-05-21", ["W", "L", "W", "L", "L"]),
  mapRow("BetBoom Team", "Mirage", 4, 6, "2026-05-16", ["L", "W", "L", "L", "W"]),
  mapRow("GamerLegion", "Inferno", 5, 5, "2026-05-23", ["W", "L", "W", "L", "L"]),
  mapRow("GamerLegion", "Nuke", 4, 6, "2026-05-17", ["L", "W", "L", "W", "L"])
];

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
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function matchesName(sourceName: string, targetName: string) {
  const source = normalize(sourceName);
  const target = normalize(targetName);
  return source.includes(target) || target.includes(source);
}

function teamLiquipediaUrl(teamName: string) {
  const pages: Record<string, string> = {
    NAVI: "https://liquipedia.net/counterstrike/Natus_Vincere",
    "Team Spirit": "https://liquipedia.net/counterstrike/Team_Spirit",
    Vitality: "https://liquipedia.net/counterstrike/Team_Vitality",
    MOUZ: "https://liquipedia.net/counterstrike/MOUZ",
    "FaZe Clan": "https://liquipedia.net/counterstrike/FaZe_Clan",
    G2: "https://liquipedia.net/counterstrike/G2_Esports",
    "Team Falcons": "https://liquipedia.net/counterstrike/Team_Falcons",
    TYLOO: "https://liquipedia.net/counterstrike/TYLOO",
    "9z": "https://liquipedia.net/counterstrike/9z_Team"
  };
  return pages[teamName] ?? cs2FoundationSources.event;
}

function mapRow(teamName: string, mapName: string, wins: number, losses: number, lastPlayedAt: string, recentResults: Array<"W" | "L">): MapSnapshotRow {
  return { teamName, mapName, wins, losses, lastPlayedAt, recentResults, sourceUrl: teamLiquipediaUrl(teamName) };
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
  return mapSnapshotRows
    .filter((row) => normalize(row.teamName) === normalize(teamName))
    .map((row) => {
      const sampleSize = row.wins + row.losses;
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
        dataQualityScore: mapDataQualityScore(sampleSize, row.lastPlayedAt, Boolean(row.sourceUrl)),
        externalIds: { liquipediaUrl: row.sourceUrl },
        source: { ...source, sourceUrl: row.sourceUrl, sourceLabel: `${row.teamName} Liquipedia snapshot` },
        quality: qualityForSample(sampleSize, row.lastPlayedAt, Boolean(row.sourceUrl))
      };
    })
    .slice(0, context?.limit ?? mapSnapshotRows.length);
}

function qualityForSample(sampleSize: number, lastPlayedAt?: string, hasSourceUrl = true): ProviderQuality {
  return {
    ...mapSnapshotQuality,
    sampleSize,
    coverage: sampleSize >= 20 ? 64 : sampleSize >= 12 ? 56 : sampleSize >= 8 ? 48 : 36,
    reliabilityScore: mapDataQualityScore(sampleSize, lastPlayedAt, hasSourceUrl),
    notes: [
      ...(mapSnapshotQuality.notes ?? []),
      lastPlayedAt ? `Last map sample captured around ${lastPlayedAt}.` : "No last played date.",
      hasSourceUrl ? "Liquipedia team/source URL stored." : "Missing source URL."
    ]
  };
}

function mapDataQualityScore(sampleSize: number, lastPlayedAt?: string, hasSourceUrl = true) {
  const sampleScore = sampleSize >= 18 ? 34 : sampleSize >= 12 ? 28 : sampleSize >= 8 ? 22 : 12;
  const freshnessScore = freshnessDays(lastPlayedAt) <= 21 ? 22 : freshnessDays(lastPlayedAt) <= 45 ? 16 : 8;
  const sourceScore = hasSourceUrl ? 16 : 0;
  const completenessScore = 14;
  const missingVetoPenalty = 8;
  return Math.max(20, Math.min(82, sampleScore + freshnessScore + sourceScore + completenessScore - missingVetoPenalty));
}

function freshnessDays(value?: string) {
  if (!value) return 999;
  const captured = new Date(source.capturedAt).getTime();
  const played = new Date(value).getTime();
  return Math.max(0, Math.round((captured - played) / (24 * 60 * 60 * 1000)));
}

function frequencyForTeam(teamName: string, sampleSize: number) {
  const total = mapSnapshotRows
    .filter((row) => normalize(row.teamName) === normalize(teamName))
    .reduce((sum, row) => sum + row.wins + row.losses, 0);
  return total ? Math.round((sampleSize / total) * 100) : 0;
}

function recentMapsByTeam(teamName: string, context?: ProviderContext): NormalizedMapResult[] {
  if (context?.game && context.game !== "cs2") return [];
  const rows = mapSnapshotRows
    .filter((row) => normalize(row.teamName) === normalize(teamName))
    .flatMap((row) => row.recentResults.map((result, index) => syntheticRecentMap(row, result, index)))
    .sort((a, b) => String(b.playedAt).localeCompare(String(a.playedAt)));
  return rows.slice(0, context?.limit ?? rows.length);
}

function syntheticRecentMap(row: MapSnapshotRow, result: "W" | "L", index: number): NormalizedMapResult {
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
    quality: qualityForSample(1, playedAt, Boolean(row.sourceUrl))
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
  const team = normalize(teamName);
  return normalize(map.teamAName) === team || normalize(map.teamBName) === team;
}

function headToHeadMatches(map: NormalizedMapResult, teamAName: string, teamBName: string) {
  const a = normalize(teamAName);
  const b = normalize(teamBName);
  return (normalize(map.teamAName) === a && normalize(map.teamBName) === b) || (normalize(map.teamAName) === b && normalize(map.teamBName) === a);
}
