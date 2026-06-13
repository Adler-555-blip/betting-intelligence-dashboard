import { cs2FoundationSources, realCs2Matches } from "../cs2RealData";
import type { ProviderBundle, ProviderContext, ProviderResult } from "./contracts";
import type { NormalizedMatch, NormalizedTournament } from "./normalized";

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

export const liquipediaSnapshotProvider: ProviderBundle = {
  providerName: "Liquipedia",
  capabilities: ["matches", "tournaments", "rosters"],
  listTournaments: async (context?: ProviderContext) => result(filterByGame([normalizeTournament()], context)),
  getTournamentContext: async (name: string, context?: ProviderContext) => {
    const tournaments = filterByGame([normalizeTournament()], context);
    return result(tournaments.find((tournament) => normalize(tournament.name).includes(normalize(name))) ?? null);
  },
  listMatches: async (context?: ProviderContext) => result(filterByGame(realCs2Matches.map(normalizeMatch), context)),
  getMatch: async (matchId: string, context?: ProviderContext) => {
    const matches = filterByGame(realCs2Matches.map(normalizeMatch), context);
    return result(matches.find((match) => match.id === matchId || match.externalIds.liquipedia === matchId) ?? null);
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
