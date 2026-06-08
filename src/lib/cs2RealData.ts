export type Cs2RealPlayer = {
  nickname: string;
  role: string;
};

export type Cs2RealTeam = {
  name: string;
  hltvName: string;
  rank: number | null;
  points: number | null;
  roster: Cs2RealPlayer[];
  sources: {
    ranking?: string;
    team?: string;
  };
};

export type Cs2RealMatch = {
  teamA: string;
  teamB: string;
  startOffsetHours: number;
  status: "prematch" | "live" | "finished";
  format: string;
  importanceScore: number;
  source: string;
  sourceUrl: string;
  officialContext: string;
};

export const cs2FoundationSources = {
  ranking: "https://www.hltv.org/ranking/teams/2026/june/1",
  matches: "https://www.hltv.org/matches",
  event: "https://liquipedia.net/counterstrike/BLAST.tv/Major/2026/Cologne"
};

export const realCs2Teams: Cs2RealTeam[] = [
  team("Vitality", "Vitality", 1, 1000, ["apEX", "ZywOo", "flameZ", "ropz", "mezii"], "https://www.hltv.org/team/9565/vitality"),
  team("NAVI", "Natus Vincere", 2, 711, ["Aleksib", "w0nderful", "iM", "b1t", "jL"], "https://www.hltv.org/team/4608/natus-vincere"),
  team("Team Spirit", "Spirit", 3, 697, ["chopper", "donk", "sh1ro", "zont1x", "zweih"], "https://www.hltv.org/team/7020/spirit"),
  team("Team Falcons", "Falcons", 4, 686, ["NiKo", "Magisk", "m0NESY", "kyxsan", "TeSeS"], "https://www.hltv.org/team/11283/falcons"),
  team("FURIA", "FURIA", 5, 446, ["KSCERATO", "yuurih", "YEKINDAR", "molodoy", "FalleN"], "https://www.hltv.org/team/8297/furia"),
  team("MOUZ", "MOUZ", 8, 255, ["siuhy", "torzsi", "xertioN", "Jimpphat", "Brollan"], "https://www.hltv.org/team/4494/mouz"),
  team("GamerLegion", "GamerLegion", 10, 205, ["ztr", "PR", "REZ", "sl3nd", "Tauson"], "https://www.hltv.org/team/9928/gamerlegion"),
  team("FaZe Clan", "FaZe", 15, 159, ["karrigan", "broky", "rain", "frozen", "jcobbb"], "https://www.hltv.org/team/6667/faze"),
  team("B8", "B8", 16, 158, ["npl", "alex666", "kensizor", "esenthial", "headtr1ck"], "https://www.hltv.org/team/11241/b8"),
  team("MIBR", "MIBR", 19, 130, ["exit", "brnz4n", "insani", "saffee", "Lucaozy"], "https://www.hltv.org/team/9215/mibr"),
  team("9z", "9z", 20, 125, ["max", "dgt", "buda", "HUASOPEEK", "Luken"], "https://www.hltv.org/team/9996/9z"),
  team("BetBoom Team", "BetBoom", 21, 123, ["s1ren", "zorte", "nafany", "Magnojez", "KaiR0N-"], "https://www.hltv.org/team/12394/betboom"),
  team("TYLOO", "TYLOO", null, null, ["advent", "JamYoung", "Mercury", "Jee", "Attacker"], "https://www.hltv.org/team/4863/tyloo"),
  team("M80", "M80", null, null, ["slaxz-", "Swisher", "s1n", "reck", "Lake"], "https://www.hltv.org/team/12376/m80")
];

export const realCs2Matches: Cs2RealMatch[] = [
  {
    teamA: "Team Spirit",
    teamB: "MIBR",
    startOffsetHours: 2,
    status: "prematch",
    format: "BO3",
    importanceScore: 94,
    source: "HLTV matches / IEM Cologne Major 2026",
    sourceUrl: cs2FoundationSources.matches,
    officialContext: "Матч из витрины HLTV для IEM Cologne Major 2026. Время в seed сдвинуто, чтобы матч был виден в Dashboard."
  },
  {
    teamA: "TYLOO",
    teamB: "9z",
    startOffsetHours: -1,
    status: "live",
    format: "BO3",
    importanceScore: 78,
    source: "HLTV matches / IEM Cologne Major 2026",
    sourceUrl: cs2FoundationSources.matches,
    officialContext: "Реальная пара из HLTV match center; live-статус используется для демо-витрины."
  },
  {
    teamA: "B8",
    teamB: "M80",
    startOffsetHours: 4,
    status: "prematch",
    format: "BO3",
    importanceScore: 80,
    source: "HLTV matches / IEM Cologne Major 2026",
    sourceUrl: cs2FoundationSources.matches,
    officialContext: "Реальная пара из HLTV match center; время в seed адаптировано к текущему окну."
  },
  {
    teamA: "BetBoom Team",
    teamB: "GamerLegion",
    startOffsetHours: -8,
    status: "finished",
    format: "BO3",
    importanceScore: 72,
    source: "HLTV results / IEM Cologne Major 2026",
    sourceUrl: cs2FoundationSources.matches,
    officialContext: "Реальная пара из HLTV results context; результат не подключен автоматически."
  },
  {
    teamA: "Vitality",
    teamB: "NAVI",
    startOffsetHours: 20,
    status: "prematch",
    format: "BO3",
    importanceScore: 91,
    source: "HLTV ranking context",
    sourceUrl: cs2FoundationSources.ranking,
    officialContext: "Высокорейтинговая CS2-пара для проверки real ranking foundation."
  }
];

export function getRealCs2Team(name: string) {
  return realCs2Teams.find((team) => team.name === name || team.hltvName === name) ?? null;
}

export function getRealCs2Roster(name: string) {
  return getRealCs2Team(name)?.roster ?? [];
}

export function getRealCs2TeamNames() {
  return realCs2Teams.map((team) => team.name);
}

function team(name: string, hltvName: string, rank: number | null, points: number | null, roster: string[], teamUrl: string): Cs2RealTeam {
  return {
    name,
    hltvName,
    rank,
    points,
    roster: roster.map((nickname, index) => ({ nickname, role: roleFor(index) })),
    sources: {
      ranking: rank ? cs2FoundationSources.ranking : undefined,
      team: teamUrl
    }
  };
}

function roleFor(index: number) {
  if (index === 0) return "core";
  if (index === 1) return "core";
  if (index === 2) return "rifler";
  if (index === 3) return "rifler";
  return "support";
}
