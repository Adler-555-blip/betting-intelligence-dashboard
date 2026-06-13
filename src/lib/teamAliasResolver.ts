export const teamAliases: Record<string, string> = {
  spirit: "Team Spirit",
  teamspirit: "Team Spirit",
  faze: "FaZe Clan",
  fazeclan: "FaZe Clan",
  falcons: "Team Falcons",
  teamfalcons: "Team Falcons",
  liquid: "Team Liquid",
  teamliquid: "Team Liquid",
  betboom: "BetBoom Team",
  betboomteam: "BetBoom Team",
  nip: "Ninjas in Pyjamas",
  ninjasinpyjamas: "Ninjas in Pyjamas",
  vp: "Virtus.pro",
  virtuspro: "Virtus.pro",
  mongolz: "The MongolZ",
  themongolz: "The MongolZ",
  g2: "G2",
  g2esports: "G2",
  vitality: "Vitality",
  teamvitality: "Vitality",
  navi: "NAVI",
  natusvincere: "NAVI",
  saw: "SAW",
  pain: "paiN",
  painmax: "paiN",
  heroic: "HEROIC",
  tyloo: "TYLOO",
  "9z": "9z",
  "9zteam": "9z"
};

export function normalizeTeamName(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

export function resolveTeamAlias(teamName: string) {
  const normalized = normalizeTeamName(teamName);
  return teamAliases[normalized] ?? teamName;
}

export function matchesTeamName(candidate: string, query: string) {
  return normalizeTeamName(resolveTeamAlias(candidate)) === normalizeTeamName(resolveTeamAlias(query));
}
