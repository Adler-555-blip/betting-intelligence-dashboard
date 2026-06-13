export type GameDiscipline = "cs2" | "dota2" | "football";

export type ProviderName =
  | "Liquipedia"
  | "HLTV Snapshot"
  | "GRID"
  | "PandaScore"
  | "BALLDONTLIE"
  | "OpenDota"
  | "Demo"
  | "Fallback";

export type SourceType = "manual_snapshot" | "api" | "demo" | "fallback";
export type Freshness = "live" | "daily" | "weekly" | "snapshot" | "stale" | "unknown";
export type CostTier = "free" | "free_with_limits" | "paid" | "enterprise" | "internal";
export type DataKind = "real" | "demo" | "fallback" | "missing";

export type DataSourceReference = {
  providerName: ProviderName;
  sourceType: SourceType;
  sourceUrl?: string;
  sourceLabel?: string;
  capturedAt?: string;
  freshness: Freshness;
  reliabilityScore: number;
};

export type ProviderQuality = {
  dataKind: DataKind;
  reliabilityScore: number;
  freshness: Freshness;
  coverage: number;
  sampleSize?: number;
  notes?: string[];
};

export type ProviderEntityBase = {
  id: string;
  externalIds: Record<string, string>;
  source: DataSourceReference;
  quality: ProviderQuality;
};

export type NormalizedTeam = ProviderEntityBase & {
  name: string;
  game: GameDiscipline;
  aliases: string[];
  country?: string;
  ranking?: {
    rank: number | null;
    points: number | null;
    rankingName: string;
    rankingDate?: string;
  };
};

export type NormalizedPlayer = ProviderEntityBase & {
  nickname: string;
  teamId?: string;
  teamName?: string;
  game: GameDiscipline;
  role?: string;
  stats?: {
    kd?: number;
    adr?: number;
    averageKills?: number;
    mapsPlayed?: number;
  };
};

export type NormalizedTournament = ProviderEntityBase & {
  name: string;
  game: GameDiscipline;
  tier?: string;
  startDate?: string;
  endDate?: string;
  location?: string;
};

export type NormalizedMatch = ProviderEntityBase & {
  game: GameDiscipline;
  teamAName: string;
  teamBName: string;
  tournamentName: string;
  startTime?: string;
  status: "prematch" | "live" | "finished" | "unknown";
  format: string;
  importanceScore?: number;
};

export type NormalizedMap = ProviderEntityBase & {
  mapName: string;
  matchId?: string;
  teamAName?: string;
  teamBName?: string;
  teamAWinrate?: number;
  teamBWinrate?: number;
  teamACTWinrate?: number;
  teamATWinrate?: number;
  teamBCTWinrate?: number;
  teamBTWinrate?: number;
  mapsPlayed?: number;
};

export type NormalizedOddsSnapshot = ProviderEntityBase & {
  matchId: string;
  bookmaker: string;
  market: string;
  selection: string;
  odds: number;
  timestamp: string;
};
