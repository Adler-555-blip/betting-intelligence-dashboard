import { cs2FoundationSources, realCs2Matches, realCs2Teams } from "../cs2RealData";
import type { ProviderBundle, ProviderContext, ProviderResult } from "./contracts";
import type { NormalizedMatch, NormalizedPlayer, NormalizedTeam } from "./normalized";

const source = {
  providerName: "HLTV Snapshot" as const,
  sourceType: "manual_snapshot" as const,
  sourceUrl: cs2FoundationSources.ranking,
  sourceLabel: "HLTV Ranking and match center snapshot",
  capturedAt: "2026-06-01",
  freshness: "snapshot" as const,
  reliabilityScore: 86
};

const quality = {
  dataKind: "real" as const,
  reliabilityScore: 86,
  freshness: "snapshot" as const,
  coverage: 62,
  notes: ["Ручной snapshot: рейтинг, составы и часть матчей; карты/player logs не входят."]
};

export const hltvSnapshotProvider: ProviderBundle = {
  providerName: "HLTV Snapshot",
  capabilities: ["teams", "players", "matches", "rankings", "rosters"],
  listTeams: async (context?: ProviderContext) => result(filterByGame(realCs2Teams.map(normalizeTeam), context)),
  findTeam: async (name: string, context?: ProviderContext) => {
    const teams = filterByGame(realCs2Teams.map(normalizeTeam), context);
    return result(teams.find((team) => matchesTeamName(team, name)) ?? null);
  },
  listPlayersByTeam: async (teamName: string, context?: ProviderContext) => {
    const team = filterByGame(realCs2Teams.map(normalizeTeam), context).find((item) => matchesTeamName(item, teamName));
    return result(team ? playersForTeam(team.name) : []);
  },
  listMatches: async (context?: ProviderContext) => result(filterMatchesByGame(realCs2Matches.map(normalizeMatch), context)),
  getMatch: async (matchId: string, context?: ProviderContext) => {
    const matches = filterMatchesByGame(realCs2Matches.map(normalizeMatch), context);
    return result(matches.find((match) => match.id === matchId || match.externalIds.hltv === matchId) ?? null);
  }
};

export async function hltvProvider() {
  return {
    enabled: true,
    source: "HLTV Snapshot",
    mode: "manual_snapshot",
    reason: "Используются текущие сохраненные данные проекта, без внешних запросов."
  };
}

function result<T>(data: T): ProviderResult<T> {
  return {
    data,
    source,
    quality,
    warnings: ["Нет live-запросов к HLTV; это snapshot foundation для provider layer."]
  };
}

function normalizeTeam(team: (typeof realCs2Teams)[number]): NormalizedTeam {
  return {
    id: `hltv:${team.hltvName.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
    name: team.name,
    game: "cs2",
    aliases: [team.hltvName, team.name].filter((value, index, values) => values.indexOf(value) === index),
    externalIds: {
      hltvName: team.hltvName,
      hltvTeamUrl: team.sources.team ?? ""
    },
    ranking: {
      rank: team.rank,
      points: team.points,
      rankingName: "HLTV Ranking",
      rankingDate: "2026-06-01"
    },
    source,
    quality: {
      ...quality,
      coverage: team.rank && team.points ? 70 : 45,
      notes: team.rank ? ["Рейтинг и состав доступны из snapshot."] : ["Состав доступен, но команда вне top-rank snapshot."]
    }
  };
}

function normalizeMatch(match: (typeof realCs2Matches)[number], index: number): NormalizedMatch {
  return {
    id: `hltv-match-snapshot:${index + 1}`,
    game: "cs2",
    teamAName: match.teamA,
    teamBName: match.teamB,
    tournamentName: match.source.replace("HLTV matches / ", "").replace("HLTV results / ", ""),
    status: match.status,
    format: match.format,
    importanceScore: match.importanceScore,
    startTime: new Date(Date.now() + match.startOffsetHours * 60 * 60 * 1000).toISOString(),
    externalIds: {
      sourceUrl: match.sourceUrl,
      source: match.source
    },
    source: {
      ...source,
      sourceUrl: match.sourceUrl,
      sourceLabel: match.source
    },
    quality: {
      ...quality,
      coverage: 52,
      notes: [match.officialContext]
    }
  };
}

function playersForTeam(teamName: string): NormalizedPlayer[] {
  const team = realCs2Teams.find((item) => item.name === teamName || item.hltvName === teamName);
  if (!team) return [];

  return team.roster.map((player) => ({
    id: `hltv-player:${team.hltvName}:${player.nickname}`,
    nickname: player.nickname,
    teamId: `hltv:${team.hltvName.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
    teamName: team.name,
    game: "cs2",
    role: player.role,
    externalIds: {
      hltvTeamUrl: team.sources.team ?? ""
    },
    source: {
      ...source,
      sourceUrl: team.sources.team
    },
    quality: {
      ...quality,
      coverage: 48,
      notes: ["Состав real snapshot; player match logs, K/D, ADR и kills не входят."]
    }
  }));
}

function filterByGame(teams: NormalizedTeam[], context?: ProviderContext) {
  if (context?.game && context.game !== "cs2") return [];
  return teams.slice(0, context?.limit ?? teams.length);
}

function filterMatchesByGame(matches: NormalizedMatch[], context?: ProviderContext) {
  if (context?.game && context.game !== "cs2") return [];
  return matches.slice(0, context?.limit ?? matches.length);
}

function matchesTeamName(team: NormalizedTeam, name: string) {
  const target = normalize(name);
  return [team.name, ...team.aliases].some((value) => normalize(value) === target);
}

function normalize(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}
