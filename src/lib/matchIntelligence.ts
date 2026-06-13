import type { Match, OddsSnapshot, Team } from "@prisma/client";
import { cs2FoundationSources } from "./cs2RealData";
import { buildTeamMapProfile, type TeamMapProfile } from "./mapIntelligence";
import { hltvSnapshotProvider } from "./providers/hltvProvider";
import { liquipediaSnapshotProvider } from "./providers/liquipediaProvider";
import { getOpenDotaTeamFactors } from "./providers/opendotaProvider";
import type { NormalizedPlayer, NormalizedTeam } from "./providers/normalized";

export type DataBadge = "real" | "partial" | "snapshot" | "demo" | "missing" | "insufficient";

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
  teamACTWinrate: number;
  teamATWinrate: number;
  teamBPlayed: number;
  teamBWinrate: number;
  teamBCTWinrate: number;
  teamBTWinrate: number;
  strongerSide: "CT" | "T" | "Balanced";
  sideProfile: "CT-sided" | "T-sided" | "Balanced";
  advantage: "teamA" | "teamB" | "even";
  source: string;
  badge: DataBadge;
  sampleSize?: number;
  missing?: string[];
  frequency?: number;
  recentResults?: string[];
  dataQualityScore?: number;
};

export type TeamRatingFactor = {
  teamName: string;
  rating: number;
  rank: number;
  ratingDiff: number;
  trend: string;
  source: string;
  badge: DataBadge;
};

export type PlayerKillFactor = {
  teamName: string;
  nickname: string;
  avgKillsLast5: number;
  avgKillsLast10: number;
  kd: number;
  adr: number;
  stability: string;
  bestMaps: string[];
  weakMaps: string[];
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

export type FootballFactor = {
  label: string;
  teamA: string;
  teamB: string;
  source: string;
  badge: DataBadge;
};

export type FootballContext = {
  group: string;
  venue: string;
  officialDate: string;
  tournamentWindow: string;
  source: string;
  badge: DataBadge;
  factors: FootballFactor[];
  checklist: string[];
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
  teamRatings: TeamRatingFactor[];
  playerKills: PlayerKillFactor[];
  footballContext?: FootballContext;
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

const footballRankings: Record<string, number> = {
  Argentina: 1,
  France: 2,
  Spain: 3,
  England: 4,
  Portugal: 5,
  Brazil: 6,
  Germany: 9,
  Morocco: 12,
  Mexico: 15,
  Switzerland: 17,
  Canada: 26,
  Scotland: 38,
  "South Africa": 57,
  Haiti: 86,
  "Korea Republic": 24,
  Czechia: 36
};

const footballVenues: Record<string, string> = {
  Mexico: "Mexico City, Estadio Azteca",
  Canada: "Toronto, BMO Field",
  Brazil: "MetLife Stadium, New Jersey",
  Morocco: "Miami, Hard Rock Stadium",
  Germany: "Dallas, AT&T Stadium",
  Argentina: "Los Angeles, SoFi Stadium",
  Spain: "Kansas City, Arrowhead Stadium"
};

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
  const maps = match.game === "cs2" ? await providerCs2Maps(match.teamA.name, match.teamB.name) : [];
  const teamRatings = match.game === "cs2" ? await realCs2TeamRatings(match.teamA.name, match.teamB.name) : [];
  const footballContext = match.game === "football" ? fallbackFootballContext(match) : undefined;
  const h2h = fallbackH2H(match.teamA.name, match.teamB.name, match.game);
  const [teamARoster, teamBRoster] = match.game === "cs2"
    ? await Promise.all([providerCs2Roster(match.teamA.name), providerCs2Roster(match.teamB.name)])
    : [rosterFallback[match.teamA.name] ?? [], rosterFallback[match.teamB.name] ?? []];
  const playerKills = match.game === "cs2" ? fallbackPlayerKills(match.teamA.name, teamARoster).concat(fallbackPlayerKills(match.teamB.name, teamBRoster)) : [];
  const factorsFor = match.game === "football" && footballContext
    ? buildFootballPositiveFactors(match.teamA.name, match.teamB.name, footballContext)
    : buildPositiveFactors(teamA, teamB, maps, h2h, match.teamA.name, match.teamB.name);
  const factorsAgainst = match.game === "football" && footballContext
    ? buildFootballNegativeFactors(match.teamA.name, match.teamB.name, footballContext)
    : buildNegativeFactors(teamA, teamB, maps, h2h, teamARoster, teamBRoster, match.teamA.name, match.teamB.name);
  const score = buildScore(match, teamA, teamB, maps, h2h, teamARoster, teamBRoster, teamRatings, playerKills);

  return {
    teamA,
    teamB,
    teamARoster,
    teamBRoster,
    rosterBadge: match.game === "cs2" && teamARoster.length >= 5 && teamBRoster.length >= 5 ? "real" : "demo",
    maps,
    teamRatings,
    playerKills,
    footballContext,
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
      real: [
        teamA.badge === "real" ? `Форма ${teamA.teamName}: OpenDota` : "",
        teamB.badge === "real" ? `Форма ${teamB.teamName}: OpenDota` : "",
        match.game === "cs2" ? `HLTV ranking snapshot: ${cs2FoundationSources.ranking}` : "",
        match.game === "cs2" ? `CS2 rosters: HLTV Snapshot Provider (${cs2FoundationSources.matches})` : "",
        match.game === "cs2" ? `Tournament context: Liquipedia Snapshot Provider (${cs2FoundationSources.event})` : "",
        match.game === "football" && footballContext?.badge === "real" ? "Турнирный контекст FIFA World Cup 2026" : ""
      ].filter(Boolean),
      demo: [
        teamA.badge === "demo" ? `Форма ${teamA.teamName}` : "",
        teamB.badge === "demo" ? `Форма ${teamB.teamName}` : "",
        match.game === "dota2" ? "Контекст патча" : "",
        match.game === "cs2" ? "Киллы игроков" : "",
        match.game === "cs2" ? "CT/T стороны" : "",
        match.game === "cs2" ? "Коэффициенты и движение линии" : "",
        match.game === "football" ? "Рейтинг сборных" : "",
        match.game === "football" ? "Форма сборных" : "",
        match.game === "football" ? "Коэффициенты 1X2" : "",
        match.game === "football" ? "Календарь и логистика" : "",
        match.game === "football" && footballContext?.badge === "demo" ? "Демо-пара внутри окна FIFA World Cup 2026" : "",
        match.game === "cs2" ? "Veto" : ""
      ].filter(Boolean),
      insufficient: match.game === "football"
        ? ["Нет подтвержденных составов и травм", "Нет реальных новостей по сборным", "Нет реальных market signals"]
        : [
            teamARoster.length && teamBRoster.length ? "" : "Недостаточно данных по составу одной из команд",
            match.game === "cs2" && maps.some((map) => map.badge === "snapshot" || map.badge === "partial") ? "Map Edge: Snapshot/Partial, нет veto и live map history" : "",
            h2h.length === 0 ? "Очные встречи: нет real provider data, fake demo H2H отключен" : ""
          ].filter(Boolean)
    }
  };
}

async function providerCs2Maps(teamA: string, teamB: string): Promise<MapFactor[]> {
  const [teamAProfile, teamBProfile, h2hMaps] = await Promise.all([
    buildTeamMapProfile(teamA),
    buildTeamMapProfile(teamB),
    liquipediaSnapshotProvider.getHeadToHeadMaps?.(teamA, teamB, { game: "cs2" })
  ]);
  const maps = buildProviderMapFactors(teamAProfile, teamBProfile, h2hMaps?.data.length ?? 0);
  return maps.length ? maps : fallbackMaps(teamA, teamB);
}

function buildProviderMapFactors(teamAProfile: TeamMapProfile, teamBProfile: TeamMapProfile, h2hSampleSize: number): MapFactor[] {
  const mapNames = new Set([...teamAProfile.maps.map((item) => item.mapName), ...teamBProfile.maps.map((item) => item.mapName)]);
  return [...mapNames].map((mapName) => {
    const teamA = teamAProfile.maps.find((item) => item.mapName === mapName);
    const teamB = teamBProfile.maps.find((item) => item.mapName === mapName);
    const teamAWinrate = teamA?.winrate ?? 0;
    const teamBWinrate = teamB?.winrate ?? 0;
    const teamAPlayed = teamA?.matchesPlayed ?? 0;
    const teamBPlayed = teamB?.matchesPlayed ?? 0;
    const sampleSize = teamAPlayed + teamBPlayed;
    const averageQuality = Math.round(((teamA?.dataQualityScore ?? 0) + (teamB?.dataQualityScore ?? 0)) / (teamA && teamB ? 2 : 1));
    const badge: DataBadge = sampleSize >= 18 && averageQuality >= 70 && teamA && teamB ? "partial" : "snapshot";
    const missing = ["veto", "CT/T", "live recent maps"].concat(h2hSampleSize ? [] : ["H2H map history"]);

    return {
      map: mapName,
      teamAPlayed,
      teamAWinrate,
      teamACTWinrate: 0,
      teamATWinrate: 0,
      teamBPlayed,
      teamBWinrate,
      teamBCTWinrate: 0,
      teamBTWinrate: 0,
      strongerSide: "Balanced",
      sideProfile: "Balanced",
      advantage: Math.abs(teamAWinrate - teamBWinrate) < 5 ? "even" : teamAWinrate > teamBWinrate ? "teamA" : "teamB",
      source: `Liquipedia Snapshot Provider: ${teamA?.sourceUrl ?? teamB?.sourceUrl ?? cs2FoundationSources.event}`,
      badge,
      sampleSize,
      missing,
      frequency: Math.max(teamA?.frequency ?? 0, teamB?.frequency ?? 0),
      recentResults: [
        `${teamAProfile.teamName}: ${teamA?.recentResults.join("-") || "нет данных"}`,
        `${teamBProfile.teamName}: ${teamB?.recentResults.join("-") || "нет данных"}`
      ],
      dataQualityScore: averageQuality
    };
  });
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
    const teamACTWinrate = 45 + ((teamA.length * 5 + index * 4) % 33);
    const teamATWinrate = 39 + ((teamA.length * 6 + index * 7) % 35);
    const teamBCTWinrate = 43 + ((teamB.length * 4 + index * 5) % 35);
    const teamBTWinrate = 41 + ((teamB.length * 8 + index * 3) % 33);
    const avgCt = (teamACTWinrate + teamBCTWinrate) / 2;
    const avgT = (teamATWinrate + teamBTWinrate) / 2;
    return {
      map,
      teamAPlayed: 8 + ((teamA.length + index) % 12),
      teamAWinrate,
      teamACTWinrate,
      teamATWinrate,
      teamBPlayed: 7 + ((teamB.length + index * 2) % 12),
      teamBWinrate,
      teamBCTWinrate,
      teamBTWinrate,
      strongerSide: Math.abs(avgCt - avgT) < 4 ? "Balanced" : avgCt > avgT ? "CT" : "T",
      sideProfile: Math.abs(avgCt - avgT) < 4 ? "Balanced" : avgCt > avgT ? "CT-sided" : "T-sided",
      advantage: Math.abs(teamAWinrate - teamBWinrate) < 5 ? "even" : teamAWinrate > teamBWinrate ? "teamA" : "teamB",
      source: "Демо-статистика карт",
      badge: "demo"
    };
  });
}

function fallbackTeamRatings(teamA: string, teamB: string): TeamRatingFactor[] {
  const ratingA = ratingSeed(teamA);
  const ratingB = ratingSeed(teamB);
  return [
    {
      teamName: teamA,
      rating: ratingA,
      rank: Math.max(1, Math.round(24 - ratingA * 9)),
      ratingDiff: Number((ratingA - ratingB).toFixed(2)),
      trend: ratingA >= ratingB ? "рост относительно соперника" : "ниже соперника",
      source: "Демо-рейтинг команд",
      badge: "demo"
    },
    {
      teamName: teamB,
      rating: ratingB,
      rank: Math.max(1, Math.round(24 - ratingB * 9)),
      ratingDiff: Number((ratingB - ratingA).toFixed(2)),
      trend: ratingB >= ratingA ? "рост относительно соперника" : "ниже соперника",
      source: "Демо-рейтинг команд",
      badge: "demo"
    }
  ];
}

async function realCs2TeamRatings(teamA: string, teamB: string): Promise<TeamRatingFactor[]> {
  const [teamAResult, teamBResult] = await Promise.all([
    hltvSnapshotProvider.findTeam?.(teamA, { game: "cs2" }),
    hltvSnapshotProvider.findTeam?.(teamB, { game: "cs2" })
  ]);
  const realA = teamAResult?.data ?? null;
  const realB = teamBResult?.data ?? null;
  const ratingA = realA?.ranking?.points ? Number((realA.ranking.points / 1000).toFixed(2)) : ratingSeed(teamA);
  const ratingB = realB?.ranking?.points ? Number((realB.ranking.points / 1000).toFixed(2)) : ratingSeed(teamB);
  return [
    buildRealCs2Rating(teamA, ratingA, ratingB, realA),
    buildRealCs2Rating(teamB, ratingB, ratingA, realB)
  ];
}

function buildRealCs2Rating(teamName: string, rating: number, opponentRating: number, realTeam: NormalizedTeam | null): TeamRatingFactor {
  const hasRanking = Boolean(realTeam?.ranking?.rank && realTeam.ranking.points);
  return {
    teamName,
    rating,
    rank: realTeam?.ranking?.rank ?? Math.max(1, Math.round(24 - rating * 9)),
    ratingDiff: Number((rating - opponentRating).toFixed(2)),
    trend: hasRanking ? `HLTV #${realTeam?.ranking?.rank}, ${realTeam?.ranking?.points} points` : "нет в HLTV top snapshot, используется fallback",
    source: hasRanking
      ? `${realTeam?.source.providerName}: ${realTeam?.source.sourceUrl ?? cs2FoundationSources.ranking}`
      : `${realTeam?.source.providerName ?? "HLTV Snapshot"} без top-rank snapshot: ${realTeam?.source.sourceUrl ?? "нет источника"}`,
    badge: hasRanking ? "real" : "insufficient"
  };
}

async function providerCs2Roster(teamName: string): Promise<PlayerInfo[]> {
  const result = await hltvSnapshotProvider.listPlayersByTeam?.(teamName, { game: "cs2" });
  return (result?.data ?? []).map(playerFromProvider);
}

function playerFromProvider(player: NormalizedPlayer): PlayerInfo {
  return {
    nickname: player.nickname,
    role: player.role ?? "player"
  };
}

function fallbackFootballContext(match: MatchWithTeams): FootballContext {
  const externalIds = parseExternalIds(match.externalIds);
  const officialDate = externalIds.officialDate ?? "Официальное окно турнира: 11 июня - 19 июля 2026";
  const venue = externalIds.venue ?? footballVenues[match.teamA.name] ?? "Площадка будет уточнена в демо-наборе";
  const group = match.format || "Group stage";
  const hasOfficialSchedule = externalIds.scheduleKind === "official";
  const rankingA = footballRankings[match.teamA.name] ?? 45;
  const rankingB = footballRankings[match.teamB.name] ?? 45;
  const rankingDiff = Math.abs(rankingA - rankingB);
  const higherRankedTeam = rankingA < rankingB ? match.teamA.name : rankingB < rankingA ? match.teamB.name : "Рейтинг близкий";

  return {
    group,
    venue,
    officialDate,
    tournamentWindow: "FIFA World Cup 2026: 11 июня - 19 июля 2026",
    source: hasOfficialSchedule ? "FIFA schedule context, добавлено вручную в seed" : "Demo fixture внутри официального окна турнира",
    badge: hasOfficialSchedule ? "real" : "demo",
    factors: [
      {
        label: "Рейтинг сборных",
        teamA: `Демо-рейтинг FIFA: #${rankingA}`,
        teamB: `Демо-рейтинг FIFA: #${rankingB}`,
        source: "Демо-ранжирование для MVP",
        badge: "demo"
      },
      {
        label: "Форма сборных",
        teamA: "Последние матчи смоделированы по демо-форме",
        teamB: "Последние матчи смоделированы по демо-форме",
        source: "Демо-форма",
        badge: "demo"
      },
      {
        label: "Контекст группы",
        teamA: `${group}. Матч относится к первому этапу ЧМ-2026.`,
        teamB: `Разница рейтинга сборных: ${rankingDiff} позиций. Выше в демо-рейтинге: ${higherRankedTeam}.`,
        source: hasOfficialSchedule ? "FIFA World Cup 2026 schedule context" : "Demo fixture внутри официального окна турнира",
        badge: hasOfficialSchedule ? "real" : "demo"
      },
      {
        label: "Состав и потери",
        teamA: "Подтвержденные составы, травмы и дисквалификации не подключены",
        teamB: "Подтвержденные составы, травмы и дисквалификации не подключены",
        source: "Нет live-новостей",
        badge: "insufficient"
      },
      {
        label: "Календарь и логистика",
        teamA: `Демо-логистика: ${venue}`,
        teamB: `Официальный контекст: ${officialDate}`,
        source: "FIFA schedule context + demo logistics",
        badge: "demo"
      },
      {
        label: "Движение линии 1X2",
        teamA: "Коэффициент на исход команды сгенерирован для демо",
        teamB: "Ничья и второй исход показаны как рынок 1X2",
        source: "Демо-коэффициенты",
        badge: "demo"
      },
      {
        label: "Турнирная мотивация",
        teamA: "Первый этап турнира: важны очки и разница мячей",
        teamB: "Первый этап турнира: риск осторожного темпа выше в стартовых турах",
        source: "Турнирный контекст",
        badge: hasOfficialSchedule ? "real" : "demo"
      }
    ],
    checklist: [
      "Проверить подтвержденные стартовые составы",
      "Проверить травмы и дисквалификации",
      "Проверить последние новости сборных",
      "Сравнить форму в официальных матчах",
      "Проверить мотивацию в группе",
      "Проверить движение линии 1X2 ближе к матчу"
    ]
  };
}

function parseExternalIds(value: string | null): Record<string, string> {
  if (!value) return {};
  try {
    return JSON.parse(value) as Record<string, string>;
  } catch {
    return {};
  }
}

function ratingSeed(teamName: string) {
  const seed = teamName.split("").reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return Number((1.02 + (seed % 42) / 100).toFixed(2));
}

function fallbackPlayerKills(teamName: string, roster: PlayerInfo[]): PlayerKillFactor[] {
  return roster.map((player, index) => {
    const seed = player.nickname.split("").reduce((sum, char) => sum + char.charCodeAt(0), 0) + teamName.length + index;
    const bestMap = cs2Maps[seed % cs2Maps.length];
    const secondBest = cs2Maps[(seed + 2) % cs2Maps.length];
    const weakMap = cs2Maps[(seed + 4) % cs2Maps.length];
    return {
      teamName,
      nickname: player.nickname,
      avgKillsLast5: Number((14 + (seed % 11) + index * 0.4).toFixed(1)),
      avgKillsLast10: Number((13 + (seed % 10) + index * 0.3).toFixed(1)),
      kd: Number((0.92 + (seed % 35) / 100).toFixed(2)),
      adr: Number((64 + (seed % 28) + index * 1.6).toFixed(1)),
      stability: seed % 3 === 0 ? "высокая" : seed % 3 === 1 ? "средняя" : "низкая",
      bestMaps: [bestMap, secondBest],
      weakMaps: [weakMap],
      source: "Демо-статистика игроков",
      badge: "demo"
    };
  });
}

function fallbackH2H(_teamA: string, _teamB: string, _game: string): H2HFactor[] {
  return [];
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

function buildFootballPositiveFactors(teamAName: string, teamBName: string, context: FootballContext) {
  const rating = context.factors.find((item) => item.label === "Рейтинг сборных");
  const logistics = context.factors.find((item) => item.label === "Календарь и логистика");
  const motivation = context.factors.find((item) => item.label === "Турнирная мотивация");
  return [
    rating ? `${teamAName} и ${teamBName}: рейтинг сборных вынесен отдельно для быстрого сравнения силы.` : "",
    `${context.group}: официальный турнирный контекст уже известен и не является прогнозом.`,
    motivation ? `${teamAName} и ${teamBName}: ${motivation.teamA.toLowerCase()}.` : "",
    logistics ? `Логистика матча отмечена отдельно: ${context.venue}.` : ""
  ].filter(Boolean);
}

function buildFootballNegativeFactors(teamAName: string, teamBName: string, context: FootballContext) {
  return [
    `По ${teamAName} и ${teamBName} нет подтвержденных составов, травм и дисквалификаций.`,
    "Форма сборных и рейтинги пока являются демо-данными, их нельзя воспринимать как реальный источник.",
    "Движение линии 1X2 сгенерировано для демонстрации интерфейса.",
    `${context.officialDate}: реальная дата известна, но время в демо может быть сдвинуто, чтобы матч попадал в витрину Dashboard.`
  ];
}

function buildScore(match: MatchWithTeams, teamA: TeamFormFactor, teamB: TeamFormFactor, maps: MapFactor[], h2h: H2HFactor[], rosterA: PlayerInfo[], rosterB: PlayerInfo[], ratings: TeamRatingFactor[], playerKills: PlayerKillFactor[]) {
  const line = lineScore(match.oddsSnapshots);
  const h2hA = h2h.length ? h2h.filter((item) => item.winner === match.teamA.name).length / h2h.length : 0.5;
  const h2hB = h2h.length ? h2h.filter((item) => item.winner === match.teamB.name).length / h2h.length : 0.5;
  const mapA = maps.length ? maps.filter((item) => item.advantage === "teamA").length / maps.length : 0.5;
  const mapB = maps.length ? maps.filter((item) => item.advantage === "teamB").length / maps.length : 0.5;
  const ctA = maps.length ? maps.filter((item) => item.teamACTWinrate > item.teamBCTWinrate || item.teamATWinrate > item.teamBTWinrate).length / maps.length : 0.5;
  const ctB = maps.length ? maps.filter((item) => item.teamBCTWinrate > item.teamACTWinrate || item.teamBTWinrate > item.teamATWinrate).length / maps.length : 0.5;
  const ratingA = ratings[0]?.rating ?? 1.1;
  const ratingB = ratings[1]?.rating ?? 1.1;
  const ratingTotal = ratingA + ratingB;
  const killsA = playerKillScore(playerKills.filter((item) => item.teamName === match.teamA.name));
  const killsB = playerKillScore(playerKills.filter((item) => item.teamName === match.teamB.name));
  const killsTotal = killsA + killsB || 1;
  const rosterScoreA = rosterA.length >= 5 ? 8 : 4;
  const rosterScoreB = rosterB.length >= 5 ? 8 : 4;

  let breakdown: ScoreBreakdown[];

  if (match.game === "cs2") {
    breakdown = [
          { label: "Форма команды", teamA: Math.round(((teamA.winrate ?? 50) / 100) * 18), teamB: Math.round(((teamB.winrate ?? 50) / 100) * 18), note: "Вес 18%" },
          { label: "Рейтинг команды", teamA: Math.round((ratingA / ratingTotal) * 14), teamB: Math.round((ratingB / ratingTotal) * 14), note: "Вес 14%" },
          { label: "Map pool", teamA: Math.round(mapA * 16), teamB: Math.round(mapB * 16), note: "Вес 16%" },
          { label: "CT/T преимущество", teamA: Math.round(ctA * 12), teamB: Math.round(ctB * 12), note: "Вес 12%" },
          { label: "Игроки и киллы", teamA: Math.round((killsA / killsTotal) * 14), teamB: Math.round((killsB / killsTotal) * 14), note: "Вес 14%" },
          { label: "Очные встречи", teamA: Math.round(h2hA * 12), teamB: Math.round(h2hB * 12), note: "Вес 12%" },
          { label: "Движение линии", teamA: Math.round(line.teamA * 0.93), teamB: Math.round(line.teamB * 0.93), note: "Вес 14%" }
        ];
  } else if (match.game === "football") {
    const footballRankA = footballRankings[match.teamA.name] ?? 45;
    const footballRankB = footballRankings[match.teamB.name] ?? 45;
    const ratingWeightA = 120 - footballRankA;
    const ratingWeightB = 120 - footballRankB;
    const ratingWeightTotal = ratingWeightA + ratingWeightB;
    breakdown = [
      { label: "Рейтинг сборных", teamA: Math.round((ratingWeightA / ratingWeightTotal) * 22), teamB: Math.round((ratingWeightB / ratingWeightTotal) * 22), note: "Вес 22%" },
      { label: "Форма сборных", teamA: Math.round(((teamA.winrate ?? 50) / 100) * 20), teamB: Math.round(((teamB.winrate ?? 50) / 100) * 20), note: "Вес 20%" },
      { label: "Контекст группы", teamA: 8, teamB: 8, note: "Вес 16%" },
      { label: "Состав и потери", teamA: 6, teamB: 6, note: "Вес 12%" },
      { label: "Календарь и логистика", teamA: 5, teamB: 5, note: "Вес 10%" },
      { label: "Очные встречи", teamA: Math.round(h2hA * 8), teamB: Math.round(h2hB * 8), note: "Вес 8%" },
      { label: "Движение линии 1X2", teamA: Math.round(line.teamA * 0.8), teamB: Math.round(line.teamB * 0.8), note: "Вес 12%" }
    ];
  } else {
    breakdown = [
          { label: "Форма", teamA: Math.round(((teamA.winrate ?? 50) / 100) * 30), teamB: Math.round(((teamB.winrate ?? 50) / 100) * 30), note: "Вес 30%" },
          { label: "Очные встречи", teamA: Math.round(h2hA * 20), teamB: Math.round(h2hB * 20), note: "Вес 20%" },
          { label: "Дисциплинный фактор", teamA: 10, teamB: 10, note: "Вес 20%" },
          { label: "Состав", teamA: rosterScoreA + 7, teamB: rosterScoreB + 7, note: "Вес 15%" },
          { label: "Линия", teamA: line.teamA, teamB: line.teamB, note: "Вес 15%" }
        ];
  }
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

function playerKillScore(players: PlayerKillFactor[]) {
  return players.reduce((sum, player) => sum + player.avgKillsLast10 + player.kd * 8 + player.adr / 10, 0);
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
