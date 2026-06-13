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
};

const mapSnapshotRows: MapSnapshotRow[] = [
  mapRow("Team Spirit", "Ancient", 8, 3, "2026-06-01"),
  mapRow("Team Spirit", "Mirage", 7, 4, "2026-05-28"),
  mapRow("Team Spirit", "Nuke", 6, 5, "2026-05-20"),
  mapRow("Team Spirit", "Dust2", 5, 4, "2026-05-18"),
  mapRow("NAVI", "Mirage", 7, 5, "2026-05-30"),
  mapRow("NAVI", "Ancient", 6, 5, "2026-05-26"),
  mapRow("NAVI", "Nuke", 5, 6, "2026-05-22"),
  mapRow("NAVI", "Inferno", 6, 4, "2026-05-18"),
  mapRow("Vitality", "Inferno", 9, 3, "2026-05-31"),
  mapRow("Vitality", "Mirage", 8, 3, "2026-05-29"),
  mapRow("Vitality", "Nuke", 7, 4, "2026-05-21"),
  mapRow("MOUZ", "Nuke", 8, 4, "2026-05-30"),
  mapRow("MOUZ", "Ancient", 7, 4, "2026-05-25"),
  mapRow("MOUZ", "Inferno", 5, 6, "2026-05-19"),
  mapRow("FaZe Clan", "Mirage", 6, 6, "2026-05-27"),
  mapRow("FaZe Clan", "Inferno", 7, 5, "2026-05-24"),
  mapRow("FaZe Clan", "Nuke", 5, 7, "2026-05-17"),
  mapRow("TYLOO", "Inferno", 6, 5, "2026-05-29"),
  mapRow("TYLOO", "Ancient", 5, 5, "2026-05-22"),
  mapRow("TYLOO", "Dust2", 7, 4, "2026-05-20"),
  mapRow("9z", "Dust2", 6, 4, "2026-05-28"),
  mapRow("9z", "Ancient", 5, 6, "2026-05-24"),
  mapRow("9z", "Inferno", 4, 6, "2026-05-17"),
  mapRow("MIBR", "Mirage", 5, 6, "2026-05-26"),
  mapRow("MIBR", "Ancient", 4, 7, "2026-05-22"),
  mapRow("MIBR", "Nuke", 5, 5, "2026-05-18"),
  mapRow("B8", "Ancient", 6, 5, "2026-05-25"),
  mapRow("B8", "Mirage", 5, 5, "2026-05-20"),
  mapRow("M80", "Nuke", 6, 4, "2026-05-24"),
  mapRow("M80", "Inferno", 5, 6, "2026-05-18"),
  mapRow("BetBoom Team", "Ancient", 5, 5, "2026-05-21"),
  mapRow("BetBoom Team", "Mirage", 4, 6, "2026-05-16"),
  mapRow("GamerLegion", "Inferno", 5, 5, "2026-05-23"),
  mapRow("GamerLegion", "Nuke", 4, 6, "2026-05-17")
];

const h2hMapResults: NormalizedMapResult[] = [
  mapResult("TYLOO", "9z", "Dust2", "9z", "13:10", "2026-05-12"),
  mapResult("TYLOO", "9z", "Inferno", "TYLOO", "13:9", "2026-05-12"),
  mapResult("Vitality", "NAVI", "Mirage", "Vitality", "13:8", "2026-05-03"),
  mapResult("Vitality", "NAVI", "Inferno", "NAVI", "16:14", "2026-05-03"),
  mapResult("Team Spirit", "MIBR", "Ancient", "Team Spirit", "13:7", "2026-04-28")
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
  listRecentMapsByTeam: async (teamName: string, context?: ProviderContext) => mapResultWrapper(filterMapResults(h2hMapResults, context).filter((map) => teamMatches(map, teamName))),
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

function mapRow(teamName: string, mapName: string, wins: number, losses: number, lastPlayedAt: string): MapSnapshotRow {
  return { teamName, mapName, wins, losses, lastPlayedAt };
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
        externalIds: { liquipediaUrl: cs2FoundationSources.event },
        source,
        quality: qualityForSample(sampleSize)
      };
    })
    .slice(0, context?.limit ?? mapSnapshotRows.length);
}

function qualityForSample(sampleSize: number): ProviderQuality {
  return {
    ...mapSnapshotQuality,
    sampleSize,
    coverage: sampleSize >= 20 ? 56 : sampleSize >= 10 ? 48 : 36,
    reliabilityScore: sampleSize >= 10 ? 66 : 58
  };
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
