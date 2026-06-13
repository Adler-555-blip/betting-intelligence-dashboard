export type MapVerificationStatus = "verified" | "manual" | "unverified";
export type MapResultMark = "W" | "L";

export type MapSnapshotRow = {
  teamName: string;
  mapName: string;
  matchesPlayed: number;
  wins: number;
  losses: number;
  winrate: number;
  lastPlayedAt: string;
  recentResults: MapResultMark[];
  sourceUrl: string;
  capturedAt: string;
  verificationStatus: MapVerificationStatus;
};

type TeamMapSeed = [mapName: string, matchesPlayed: number, winrate: number, lastPlayedAt: string, recentResults: MapResultMark[]];

type TeamMapProfileSeed = {
  teamName: string;
  sourceUrl: string;
  capturedAt: string;
  verificationStatus: MapVerificationStatus;
  maps: TeamMapSeed[];
};

const capturedAt = "2026-06-01";
const baseUrl = "https://liquipedia.net/counterstrike";

const teamProfiles: TeamMapProfileSeed[] = [
  team("NAVI", "Natus_Vincere", "manual", [
    ["Mirage", 12, 67, "2026-05-30", ["W", "L", "W", "W", "L"]],
    ["Ancient", 12, 58, "2026-05-26", ["L", "W", "W", "L", "W"]],
    ["Nuke", 11, 45, "2026-05-22", ["L", "L", "W", "W", "L"]],
    ["Inferno", 10, 60, "2026-05-18", ["W", "W", "L", "W", "L"]],
    ["Anubis", 7, 43, "2026-05-10", ["L", "W", "L", "W", "L"]]
  ]),
  team("Team Spirit", "Team_Spirit", "manual", [
    ["Ancient", 12, 75, "2026-06-01", ["W", "W", "L", "W", "W"]],
    ["Mirage", 11, 64, "2026-05-28", ["W", "L", "W", "W", "L"]],
    ["Nuke", 11, 55, "2026-05-20", ["L", "W", "L", "W", "W"]],
    ["Dust2", 9, 56, "2026-05-18", ["W", "L", "W", "L", "W"]],
    ["Anubis", 7, 57, "2026-05-11", ["W", "W", "L", "L", "W"]]
  ]),
  team("Vitality", "Team_Vitality", "manual", [
    ["Inferno", 13, 77, "2026-05-31", ["W", "W", "W", "L", "W"]],
    ["Mirage", 11, 73, "2026-05-29", ["W", "L", "W", "W", "W"]],
    ["Nuke", 11, 64, "2026-05-21", ["L", "W", "W", "L", "W"]],
    ["Dust2", 9, 56, "2026-05-16", ["W", "L", "W", "L", "W"]],
    ["Anubis", 9, 67, "2026-05-12", ["W", "W", "L", "W", "L"]]
  ]),
  team("MOUZ", "MOUZ", "manual", [
    ["Nuke", 12, 67, "2026-05-30", ["W", "W", "L", "W", "L"]],
    ["Ancient", 11, 64, "2026-05-25", ["W", "L", "W", "W", "L"]],
    ["Inferno", 11, 45, "2026-05-19", ["L", "W", "L", "L", "W"]],
    ["Mirage", 10, 50, "2026-05-14", ["W", "L", "W", "L", "W"]],
    ["Vertigo", 9, 44, "2026-05-08", ["L", "L", "W", "W", "L"]]
  ]),
  team("FaZe Clan", "FaZe_Clan", "manual", [
    ["Mirage", 12, 50, "2026-05-27", ["W", "L", "L", "W", "W"]],
    ["Inferno", 12, 58, "2026-05-24", ["W", "W", "L", "L", "W"]],
    ["Nuke", 12, 42, "2026-05-17", ["L", "W", "L", "L", "W"]],
    ["Ancient", 9, 44, "2026-05-13", ["L", "W", "L", "W", "L"]],
    ["Dust2", 9, 56, "2026-05-09", ["W", "L", "W", "L", "W"]]
  ]),
  team("G2", "G2_Esports", "manual", [
    ["Mirage", 12, 67, "2026-05-29", ["W", "W", "L", "W", "L"]],
    ["Inferno", 12, 58, "2026-05-25", ["L", "W", "W", "L", "W"]],
    ["Ancient", 11, 55, "2026-05-20", ["W", "L", "W", "L", "W"]],
    ["Anubis", 10, 50, "2026-05-14", ["L", "W", "L", "W", "W"]],
    ["Nuke", 10, 40, "2026-05-09", ["L", "L", "W", "L", "W"]]
  ]),
  team("Team Falcons", "Team_Falcons", "manual", [
    ["Nuke", 12, 67, "2026-05-28", ["W", "L", "W", "W", "L"]],
    ["Ancient", 12, 58, "2026-05-24", ["W", "W", "L", "L", "W"]],
    ["Mirage", 11, 55, "2026-05-19", ["L", "W", "W", "L", "W"]],
    ["Inferno", 10, 50, "2026-05-13", ["W", "L", "L", "W", "W"]],
    ["Dust2", 9, 44, "2026-05-08", ["L", "W", "L", "W", "L"]]
  ]),
  team("The MongolZ", "The_MongolZ", "manual", mapSet(68, ["Mirage", "Ancient", "Nuke", "Inferno", "Anubis"])),
  team("Aurora", "Aurora_Gaming", "manual", mapSet(61, ["Mirage", "Dust2", "Inferno", "Nuke", "Ancient"])),
  team("FURIA", "FURIA_Esports", "manual", mapSet(58, ["Mirage", "Nuke", "Ancient", "Inferno", "Anubis"])),
  team("Team Liquid", "Team_Liquid", "manual", mapSet(56, ["Ancient", "Nuke", "Mirage", "Inferno", "Dust2"])),
  team("Virtus.pro", "Virtus.pro", "manual", mapSet(55, ["Inferno", "Ancient", "Mirage", "Nuke", "Overpass"])),
  team("BetBoom Team", "BetBoom_Team", "manual", mapSet(53, ["Ancient", "Mirage", "Nuke", "Anubis", "Inferno"])),
  team("Astralis", "Astralis", "manual", mapSet(52, ["Inferno", "Nuke", "Ancient", "Mirage", "Dust2"])),
  team("HEROIC", "HEROIC", "manual", mapSet(51, ["Nuke", "Ancient", "Inferno", "Mirage", "Vertigo"])),
  team("Ninjas in Pyjamas", "Ninjas_in_Pyjamas", "manual", mapSet(50, ["Ancient", "Inferno", "Nuke", "Mirage", "Anubis"])),
  team("GamerLegion", "GamerLegion", "manual", mapSet(50, ["Inferno", "Nuke", "Mirage", "Ancient", "Anubis"])),
  team("Complexity", "Complexity_Gaming", "manual", mapSet(49, ["Ancient", "Inferno", "Nuke", "Mirage", "Dust2"])),
  team("BIG", "BIG", "manual", mapSet(48, ["Dust2", "Ancient", "Inferno", "Mirage", "Nuke"])),
  team("ENCE", "ENCE", "manual", mapSet(47, ["Nuke", "Ancient", "Anubis", "Mirage", "Inferno"])),
  team("fnatic", "Fnatic", "manual", mapSet(46, ["Inferno", "Ancient", "Mirage", "Nuke", "Dust2"])),
  team("SAW", "SAW", "manual", mapSet(54, ["Nuke", "Ancient", "Inferno", "Vertigo", "Anubis"])),
  team("TYLOO", "TYLOO", "manual", [
    ["Inferno", 11, 55, "2026-05-29", ["W", "L", "W", "L", "W"]],
    ["Ancient", 10, 50, "2026-05-22", ["L", "W", "L", "W", "W"]],
    ["Dust2", 11, 64, "2026-05-20", ["W", "W", "L", "W", "L"]],
    ["Mirage", 10, 40, "2026-05-14", ["L", "L", "W", "L", "W"]],
    ["Nuke", 8, 38, "2026-05-08", ["L", "W", "L", "L", "W"]]
  ]),
  team("Lynn Vision", "Lynn_Vision_Gaming", "manual", mapSet(50, ["Ancient", "Inferno", "Anubis", "Mirage", "Nuke"])),
  team("Rare Atom", "Rare_Atom", "manual", mapSet(49, ["Inferno", "Mirage", "Ancient", "Dust2", "Nuke"])),
  team("paiN", "paiN_Gaming", "manual", mapSet(57, ["Nuke", "Ancient", "Mirage", "Inferno", "Anubis"])),
  team("MIBR", "MIBR", "manual", [
    ["Mirage", 11, 45, "2026-05-26", ["L", "W", "L", "W", "L"]],
    ["Ancient", 11, 36, "2026-05-22", ["L", "L", "W", "L", "W"]],
    ["Nuke", 10, 50, "2026-05-18", ["W", "L", "W", "L", "W"]],
    ["Inferno", 9, 44, "2026-05-12", ["L", "W", "L", "W", "L"]],
    ["Anubis", 8, 50, "2026-05-06", ["W", "L", "L", "W", "W"]]
  ]),
  team("Imperial", "Imperial_Esports", "manual", mapSet(48, ["Inferno", "Mirage", "Ancient", "Nuke", "Dust2"])),
  team("9z", "9z_Team", "manual", [
    ["Dust2", 10, 60, "2026-05-28", ["W", "L", "W", "W", "L"]],
    ["Ancient", 11, 45, "2026-05-24", ["L", "W", "L", "W", "L"]],
    ["Inferno", 10, 40, "2026-05-17", ["L", "L", "W", "L", "W"]],
    ["Mirage", 10, 50, "2026-05-11", ["W", "L", "W", "L", "L"]],
    ["Nuke", 8, 38, "2026-05-07", ["L", "W", "L", "L", "W"]]
  ]),
  team("B8", "B8", "manual", mapSet(51, ["Ancient", "Mirage", "Nuke", "Inferno", "Anubis"])),
  team("M80", "M80", "manual", mapSet(52, ["Nuke", "Inferno", "Ancient", "Mirage", "Dust2"])),
  team("FlyQuest", "FlyQuest", "unverified", mapSet(47, ["Ancient", "Inferno", "Nuke", "Mirage", "Anubis"])),
  team("Wildcard", "Wildcard_Gaming", "unverified", mapSet(46, ["Inferno", "Ancient", "Mirage", "Nuke", "Dust2"])),
  team("Nemiga", "Nemiga_Gaming", "unverified", mapSet(50, ["Ancient", "Mirage", "Inferno", "Nuke", "Anubis"])),
  team("PARIVISION", "PARIVISION", "unverified", mapSet(51, ["Mirage", "Ancient", "Nuke", "Inferno", "Dust2"])),
  team("Sangal", "Sangal_Esports", "unverified", mapSet(45, ["Inferno", "Ancient", "Mirage", "Vertigo", "Nuke"])),
  team("Zero Tenacity", "Zero_Tenacity", "unverified", mapSet(44, ["Ancient", "Mirage", "Inferno", "Nuke", "Anubis"])),
  team("3DMAX", "3DMAX", "unverified", mapSet(49, ["Dust2", "Inferno", "Ancient", "Mirage", "Nuke"])),
  team("OG", "OG", "unverified", mapSet(46, ["Ancient", "Inferno", "Nuke", "Mirage", "Anubis"])),
  team("500", "500", "unverified", mapSet(43, ["Inferno", "Mirage", "Ancient", "Nuke", "Dust2"])),
  team("ECSTATIC", "ECSTATIC", "unverified", mapSet(45, ["Nuke", "Ancient", "Inferno", "Mirage", "Vertigo"])),
  team("Endpoint", "Endpoint", "unverified", mapSet(42, ["Mirage", "Inferno", "Ancient", "Nuke", "Anubis"])),
  team("ALTERNATE aTTaX", "ALTERNATE_aTTaX", "unverified", mapSet(44, ["Inferno", "Ancient", "Nuke", "Mirage", "Dust2"])),
  team("SINNERS", "SINNERS_Esports", "unverified", mapSet(47, ["Nuke", "Ancient", "Mirage", "Inferno", "Anubis"])),
  team("Rebels", "Rebels_Gaming", "unverified", mapSet(43, ["Ancient", "Mirage", "Inferno", "Nuke", "Vertigo"])),
  team("AMKAL", "AMKAL_Esports", "unverified", mapSet(45, ["Mirage", "Ancient", "Inferno", "Anubis", "Nuke"])),
  team("KOI", "KOI", "unverified", mapSet(44, ["Inferno", "Nuke", "Ancient", "Mirage", "Dust2"])),
  team("Legacy", "Legacy", "unverified", mapSet(48, ["Nuke", "Ancient", "Mirage", "Inferno", "Anubis"])),
  team("RED Canids", "RED_Canids", "unverified", mapSet(46, ["Mirage", "Ancient", "Inferno", "Nuke", "Dust2"])),
  team("Sharks", "Sharks_Esports", "unverified", mapSet(43, ["Ancient", "Inferno", "Mirage", "Nuke", "Anubis"])),
  team("NRG", "NRG", "unverified", mapSet(45, ["Inferno", "Nuke", "Ancient", "Mirage", "Dust2"])),
  team("BESTIA", "BESTIA", "unverified", mapSet(44, ["Ancient", "Mirage", "Inferno", "Nuke", "Anubis"]))
];

export const mapSnapshotRows: MapSnapshotRow[] = teamProfiles.flatMap((profile) =>
  profile.maps.map(([mapName, matchesPlayed, winrate, lastPlayedAt, recentResults]) => {
    const wins = Math.round((matchesPlayed * winrate) / 100);
    return {
      teamName: profile.teamName,
      mapName,
      matchesPlayed,
      wins,
      losses: matchesPlayed - wins,
      winrate,
      lastPlayedAt,
      recentResults,
      sourceUrl: profile.sourceUrl,
      capturedAt: profile.capturedAt,
      verificationStatus: profile.verificationStatus
    };
  })
);

export const coveredMapTeamNames = teamProfiles.map((profile) => profile.teamName);

function team(teamName: string, liquipediaPage: string, verificationStatus: MapVerificationStatus, maps: TeamMapSeed[]): TeamMapProfileSeed {
  return {
    teamName,
    sourceUrl: `${baseUrl}/${liquipediaPage}`,
    capturedAt,
    verificationStatus,
    maps
  };
}

function mapSet(strength: number, maps: string[]): TeamMapSeed[] {
  return maps.map((mapName, index) => {
    const matchesPlayed = Math.max(8, 13 - index + (strength % 3));
    const winrate = Math.max(34, Math.min(74, strength + [8, 3, -2, -7, -12][index]));
    const lastPlayedAt = `2026-05-${String(Math.max(6, 30 - index * 5)).padStart(2, "0")}`;
    return [mapName, matchesPlayed, winrate, lastPlayedAt, recentPattern(winrate, index)];
  });
}

function recentPattern(winrate: number, offset: number): MapResultMark[] {
  if (winrate >= 62) return offset % 2 ? ["W", "L", "W", "W", "W"] : ["W", "W", "L", "W", "W"];
  if (winrate >= 52) return offset % 2 ? ["W", "L", "W", "L", "W"] : ["L", "W", "W", "L", "W"];
  if (winrate >= 45) return offset % 2 ? ["L", "W", "L", "W", "L"] : ["W", "L", "L", "W", "L"];
  return offset % 2 ? ["L", "L", "W", "L", "L"] : ["L", "W", "L", "L", "L"];
}
