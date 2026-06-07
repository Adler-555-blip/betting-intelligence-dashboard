import type { Match, OddsSnapshot, Team } from "@prisma/client";
import { getOpenDotaTeamFactors } from "./providers/opendotaProvider";

export type DataBadge = "real" | "demo" | "insufficient";

export type TeamFormFactor = {
  teamName: string;
  last5: string;
  last10: string;
  winrate: number | null;
  streak: string;
  streakKind: "wins" | "losses" | "mixed";
  streakCount: number;
  lastMatchDate: string | null;
  source: string;
  badge: DataBadge;
};

export type PlayerInfo = {
  nickname: string;
  role: string;
};

export type MapFactor = {
  map: string;
  teamAPlayed: number;
  teamAWinrate: number;
  teamBPlayed: number;
  teamBWinrate: number;
  advantage: "teamA" | "teamB" | "even";
  source: string;
  badge: DataBadge;
};

export type H2HFactor = {
  date: string;
  score: string;
  winner: string;
  source: string;
  badge: DataBadge;
};

export type ScoreBreakdown = {
  label: string;
  teamA: number;
  teamB: number;
  note: string;
};

export type MatchIntelligence = {
  teamA: TeamFormFactor;
  teamB: TeamFormFactor;
  teamARoster: PlayerInfo[];
  teamBRoster: PlayerInfo[];
  rosterBadge: DataBadge;
  maps: MapFactor[];
  h2h: H2HFactor[];
  patchContext?: {
    patch: string;
    note: string;
    badge: DataBadge;
  };
  factorsFor: string[];
  factorsAgainst: string[];
  score: {
    teamA: number;
    teamB: number;
    confidence: "low" | "medium" | "high";
    partial: boolean;
    breakdown: ScoreBreakdown[];
  };
  dataSummary: {
    real: string[];
    demo: string[];
    insufficient: string[];
  };
};

type MatchWithTeams = Match & {
  teamA: Team;
  teamB: Team;
  oddsSnapshots: OddsSnapshot[];
};

const cs2Maps = ["Mirage", "Inferno", "Nuke", "Ancient", "Dust2", "Anubis", "Vertigo"];

const rosterFallback: Record<string, PlayerInfo[]> = {
  "Team Spirit": [
    { nickname: "chopper", role: "IGL" },
    { nickname: "donk", role: "rifler" },
    { nickname: "sh1ro", role: "AWP" },
    { nickname: "zont1x", role: "rifler" },
    { nickname: "magixx", role: "support" }
  ],
  NAVI: [
    { nickname: "Aleksib", role: "IGL" },
    { nickname: "w0nderful", role: "AWP" },
    { nickname: "iM", role: "rifler" },
    { nickname: "b1t", role: "rifler" },
    { nickname: "jL", role: "rifler" }
  ],
  Vitality: [
    { nickname: "apEX", role: "IGL" },
    { nickname: "ZywOo", role: "AWP" },
    { nickname: "flameZ", role: "rifler" },
    { nickname: "ropz", role: "rifler" },
    { nickname: "mezii", role: "support" }
  ],
  MOUZ: [
    { nickname: "siuhy", role: "IGL" },
    { nickname: "torzsi", role: "AWP" },
    { nickname: "xertioN", role: "rifler" },
    { nickname: "Jimpphat", role: "rifler" },
    { nickname: "Brollan", role: "rifler" }
  ],
  "FaZe Clan": [
    { nickname: "karrigan", role: "IGL" },
    { nickname: "broky", role: "AWP" },
    { nickname: "rain", role: "rifler" },
    { nickname: "frozen", role: "rifler" },
    { nickname: "EliGE", role: "rifler" }
  ],
  "BetBoom Team": [
    { nickname: "Nightfall", role: "carry" },
    { nickname: "gpk", role: "mid" },
    { nickname: "MieRo", role: "offlane" },
    { nickname: "Save-", role: "support" },
    { nickname: "TORONTOTOKYO", role: "support" }
  ],
  Tundra: [
    { nickname: "skiter", role: "carry" },
    { nickname: "bzm", role: "mid" },
    { nickname: "33", role: "offlane" },
    { nickname: "Saksa", role: "support" },
    { nickname: "Whitemon", role: "support" }
  ],
  "Gaimin Gladiators": [
    { nickname: "dyrachyo", role: "carry" },
    { nickname: "Quinn", role: "mid" },
    { nickname: "Ace", role: "offlane" },
    { nickname: "tOfu", role: "support" },
    { nickname: "Seleri", role: "support" }
  ],
  "Team Falcons": [
    { nickname: "skiter", role: "carry" },
    { nickname: "Malr1ne", role: "mid" },
    { nickname: "ATF", role: "offlane" },
    { nickname: "Cr1t-", role: "support" },
    { nickname: "Sneyking", role: "support" }
  ]
};

export async function getMatchIntelligence(match: MatchWithTeams): Promise<MatchIntelligence> {
  const [teamAReal, teamBReal] =
    match.game === "dota2"
      ? await Promise.all([safeOpenDota(match.teamA.name), safeOpenDota(match.teamB.name)])
      : [null, null];

  const teamA = teamAReal ?? fallbackForm(match.teamA.name, match.importanceScore, "A", "Демо-данные");
  const teamB = teamBReal ?? fallbackForm(match.teamB.name, match.importanceScore, "B", "Демо-данные");
  const maps = match.game === "cs2" ? fallbackMaps(match.teamA.name, match.teamB.name) : [];
  const h2h = fallbackH2H(match.teamA.name, match.teamB.name, match.game);
  const teamARoster = rosterFallback[match.teamA.name] ?? [];
  const teamBRoster = rosterFallback[match.teamB.name] ?? [];
  const factorsFor = buildPositiveFactors(teamA, teamB, maps, h2h, match.teamA.name, match.teamB.name);
  const factorsAgainst = buildNegativeFactors(teamA, teamB, maps, h2h, teamARoster, teamBRoster, match.teamA.name, match.teamB.name);
  const score = buildScore(match, teamA, teamB, maps, h2h, teamARoster, teamBRoster);

  return {
    teamA,
    teamB,
    teamARoster,
    teamBRoster,
    rosterBadge: "demo",
    maps,
    h2h,
    patchContext:
      match.game === "dota2"
        ? {
            patch: "7.39",
            note: "Расширенный анализ патча будет добавлен позже.",
            badge: "demo"
          }
        : undefined,
    factorsFor,
    factorsAgainst,
    score,
    dataSummary: {
      real: [teamA.badge === "real" ? `Форма ${teamA.teamName}: OpenDota` : "", teamB.badge === "real" ? `Форма ${teamB.teamName}: OpenDota` : ""].filter(Boolean),
      demo: [
        teamA.badge === "demo" ? `Форма ${teamA.teamName}` : "",
        teamB.badge === "demo" ? `Форма ${teamB.teamName}` : "",
        "Составы",
        match.game === "cs2" ? "Статистика карт" : "Контекст патча",
        "Очные встречи"
      ].filter(Boolean),
      insufficient: teamARoster.length && teamBRoster.length ? [] : ["Недостаточно данных по составу одной из команд"]
    }
  };
}

async function safeOpenDota(teamName: string) {
  try {
    return await getOpenDotaTeamFactors(teamName);
  } catch {
    return null;
  }
}

function fallbackForm(teamName: string, importance: number, side: "A" | "B", source: string): TeamFormFactor {
  const seed = teamName.split("").reduce((sum, char) => sum + char.charCodeAt(0), 0) + importance + (side === "A" ? 7 : 13);
  const wins10 = 3 + (seed % 6);
  const wins5 = Math.max(1, Math.min(5, Math.round(wins10 / 2 + (seed % 2))));
  const streakCount = 1 + (seed % 4);
  const winning = wins10 >= 5;
  return {
    teamName,
    last5: `${wins5}-П / ${5 - wins5}-Пор`,
    last10: `${wins10}-П / ${10 - wins10}-Пор`,
    winrate: wins10 * 10,
    streak: winning ? `${streakCount} победы подряд` : `${streakCount} поражения подряд`,
    streakKind: winning ? "wins" : "losses",
    streakCount,
    lastMatchDate: new Date(Date.now() - (seed % 8) * 24 * 60 * 60 * 1000).toISOString(),
    source,
    badge: "demo"
  };
}

function fallbackMaps(teamA: string, teamB: string): MapFactor[] {
  return cs2Maps.map((map, index) => {
    const teamAWinrate = 42 + ((teamA.length * 7 + index * 5) % 37);
    const teamBWinrate = 40 + ((teamB.length * 9 + index * 6) % 39);
    return {
      map,
      teamAPlayed: 8 + ((teamA.length + index) % 12),
      teamAWinrate,
      teamBPlayed: 7 + ((teamB.length + index * 2) % 12),
      teamBWinrate,
      advantage: Math.abs(teamAWinrate - teamBWinrate) < 5 ? "even" : teamAWinrate > teamBWinrate ? "teamA" : "teamB",
      source: "Демо-статистика карт",
      badge: "demo"
    };
  });
}

function fallbackH2H(teamA: string, teamB: string, game: string): H2HFactor[] {
  return [0, 1, 2].map((index) => {
    const winner = index === 1 ? teamB : teamA;
    return {
      date: new Date(Date.now() - (index + 3) * 14 * 24 * 60 * 60 * 1000).toISOString(),
      score: game === "cs2" ? (winner === teamA ? "2:1" : "1:2") : winner === teamA ? "2:0" : "1:2",
      winner,
      source: "Демо-данные очных встреч",
      badge: "demo"
    };
  });
}

function buildPositiveFactors(teamA: TeamFormFactor, teamB: TeamFormFactor, maps: MapFactor[], h2h: H2HFactor[], teamAName: string, teamBName: string) {
  const factors: string[] = [];
  for (const team of [teamA, teamB]) {
    if ((team.winrate ?? 0) > 60) factors.push(`${team.teamName} имеет winrate последних 10 матчей выше 60%.`);
    if (team.streakKind === "wins" && team.streakCount >= 3) factors.push(`${team.teamName} имеет серию из ${team.streakCount} побед.`);
  }
  const h2hA = h2h.filter((item) => item.winner === teamAName).length;
  const h2hB = h2h.filter((item) => item.winner === teamBName).length;
  if (h2hA > h2hB) factors.push(`${teamAName} чаще выигрывал последние очные встречи.`);
  if (h2hB > h2hA) factors.push(`${teamBName} чаще выигрывал последние очные встречи.`);
  const mapAdvA = maps.filter((item) => item.advantage === "teamA").length;
  const mapAdvB = maps.filter((item) => item.advantage === "teamB").length;
  if (mapAdvA > mapAdvB) factors.push(`${teamAName} имеет преимущество на большем числе карт.`);
  if (mapAdvB > mapAdvA) factors.push(`${teamBName} имеет преимущество на большем числе карт.`);
  return factors.length ? factors : ["Сильных подтвержденных преимуществ пока не выделено."];
}

function buildNegativeFactors(teamA: TeamFormFactor, teamB: TeamFormFactor, maps: MapFactor[], h2h: H2HFactor[], rosterA: PlayerInfo[], rosterB: PlayerInfo[], teamAName: string, teamBName: string) {
  const factors: string[] = [];
  for (const team of [teamA, teamB]) {
    if ((team.winrate ?? 100) < 40) factors.push(`${team.teamName} имеет winrate последних 10 матчей ниже 40%.`);
    if (team.streakKind === "losses" && team.streakCount >= 3) factors.push(`${team.teamName} имеет серию из ${team.streakCount} поражений.`);
  }
  if (!rosterA.length) factors.push(`Нет подтвержденных данных по составу ${teamAName}.`);
  if (!rosterB.length) factors.push(`Нет подтвержденных данных по составу ${teamBName}.`);
  const weakMapsA = maps.filter((item) => item.teamAWinrate < 45).map((item) => item.map);
  const weakMapsB = maps.filter((item) => item.teamBWinrate < 45).map((item) => item.map);
  if (weakMapsA.length) factors.push(`У ${teamAName} слабые показатели на ${weakMapsA.slice(0, 2).join(", ")}.`);
  if (weakMapsB.length) factors.push(`У ${teamBName} слабые показатели на ${weakMapsB.slice(0, 2).join(", ")}.`);
  const lastH2H = h2h[0];
  if (lastH2H?.winner === teamAName) factors.push(`${teamBName} проиграл последнюю очную встречу.`);
  if (lastH2H?.winner === teamBName) factors.push(`${teamAName} проиграл последнюю очную встречу.`);
  return factors.length ? factors : ["Критичных негативных факторов в доступных данных не найдено."];
}

function buildScore(match: MatchWithTeams, teamA: TeamFormFactor, teamB: TeamFormFactor, maps: MapFactor[], h2h: H2HFactor[], rosterA: PlayerInfo[], rosterB: PlayerInfo[]) {
  const formA = ((teamA.winrate ?? 50) / 100) * 30;
  const formB = ((teamB.winrate ?? 50) / 100) * 30;
  const h2hA = h2h.length ? (h2h.filter((item) => item.winner === match.teamA.name).length / h2h.length) * 20 : 10;
  const h2hB = h2h.length ? (h2h.filter((item) => item.winner === match.teamB.name).length / h2h.length) * 20 : 10;
  const mapA = maps.length ? (maps.filter((item) => item.advantage === "teamA").length / maps.length) * 20 : 10;
  const mapB = maps.length ? (maps.filter((item) => item.advantage === "teamB").length / maps.length) * 20 : 10;
  const rosterScoreA = rosterA.length >= 5 ? 15 : 7;
  const rosterScoreB = rosterB.length >= 5 ? 15 : 7;
  const line = lineScore(match.oddsSnapshots);

  const breakdown = [
    { label: "Форма", teamA: Math.round(formA), teamB: Math.round(formB), note: "Вес 30%" },
    { label: "Очные встречи", teamA: Math.round(h2hA), teamB: Math.round(h2hB), note: "Вес 20%" },
    { label: match.game === "cs2" ? "Карты" : "Дисциплинный фактор", teamA: Math.round(mapA), teamB: Math.round(mapB), note: "Вес 20%" },
    { label: "Состав", teamA: rosterScoreA, teamB: rosterScoreB, note: "Вес 15%" },
    { label: "Линия", teamA: line.teamA, teamB: line.teamB, note: "Вес 15%" }
  ];
  const rawA = breakdown.reduce((sum, item) => sum + item.teamA, 0);
  const rawB = breakdown.reduce((sum, item) => sum + item.teamB, 0);
  const partial = teamA.badge !== "real" || teamB.badge !== "real" || !maps.length;
  const confidence: "low" | "medium" | "high" = partial ? "low" : Math.abs(rawA - rawB) > 15 ? "high" : "medium";
  return {
    teamA: Math.max(0, Math.min(100, rawA)),
    teamB: Math.max(0, Math.min(100, rawB)),
    confidence,
    partial,
    breakdown
  };
}

function lineScore(snapshots: OddsSnapshot[]) {
  const latestA = latestOdds(snapshots, "teamA");
  const latestB = latestOdds(snapshots, "teamB");
  if (!latestA || !latestB) return { teamA: 8, teamB: 8 };
  const inverseA = 1 / latestA;
  const inverseB = 1 / latestB;
  const total = inverseA + inverseB;
  return {
    teamA: Math.round((inverseA / total) * 15),
    teamB: Math.round((inverseB / total) * 15)
  };
}

function latestOdds(snapshots: OddsSnapshot[], selection: string) {
  return [...snapshots]
    .filter((item) => item.selection === selection)
    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())[0]?.odds;
}
