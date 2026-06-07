import { cached, fetchWithTimeout } from "./cache";
import type { TeamFormFactor } from "../matchIntelligence";

type OpenDotaTeam = {
  team_id: number;
  name: string;
  tag?: string;
  rating?: number;
  wins?: number;
  losses?: number;
};

type OpenDotaTeamMatch = {
  match_id: number;
  radiant: boolean;
  radiant_win: boolean;
  start_time: number;
};

const baseUrl = process.env.OPENDOTA_API_BASE_URL ?? "https://api.opendota.com/api";

export async function opendotaProvider() {
  return {
    enabled: true,
    source: "OpenDota",
    baseUrl
  };
}

export async function getOpenDotaTeamFactors(teamName: string): Promise<TeamFormFactor | null> {
  return cached(`opendota:team-factor:${teamName}`, async () => {
    const teams = await fetchWithTimeout<OpenDotaTeam[]>(`${baseUrl}/teams`);
    const team = findTeam(teams, teamName);
    if (!team) return null;

    const matches = await fetchWithTimeout<OpenDotaTeamMatch[]>(`${baseUrl}/teams/${team.team_id}/matches`);
    const recent = matches
      .filter((match) => typeof match.radiant === "boolean" && typeof match.radiant_win === "boolean")
      .slice(0, 10);
    if (recent.length < 5) return null;

    const wins = recent.map((match) => match.radiant === match.radiant_win);
    const wins5 = wins.slice(0, 5).filter(Boolean).length;
    const wins10 = wins.filter(Boolean).length;
    const firstResult = wins[0];
    const streakCount = wins.findIndex((item) => item !== firstResult);
    const normalizedStreak = streakCount === -1 ? wins.length : streakCount;
    const totalWins = team.wins ?? wins10;
    const totalLosses = team.losses ?? recent.length - wins10;
    const total = totalWins + totalLosses;

    return {
      teamName,
      last5: `${wins5}-П / ${5 - wins5}-Пор`,
      last10: `${wins10}-П / ${recent.length - wins10}-Пор`,
      winrate: total ? Math.round((totalWins / total) * 100) : Math.round((wins10 / recent.length) * 100),
      streak: firstResult ? `${normalizedStreak} победы подряд` : `${normalizedStreak} поражения подряд`,
      streakKind: firstResult ? "wins" : "losses",
      streakCount: normalizedStreak,
      lastMatchDate: recent[0]?.start_time ? new Date(recent[0].start_time * 1000).toISOString() : null,
      source: "OpenDota API",
      badge: "real"
    };
  });
}

function findTeam(teams: OpenDotaTeam[], teamName: string) {
  const normalized = normalize(teamName);
  return (
    teams.find((team) => normalize(team.name) === normalized) ??
    teams.find((team) => normalize(team.name).includes(normalized) || normalized.includes(normalize(team.name))) ??
    teams.find((team) => team.tag && normalize(team.tag) === normalized)
  );
}

function normalize(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}
