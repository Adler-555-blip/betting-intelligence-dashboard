import type {
  DataSourceReference,
  GameDiscipline,
  NormalizedMap,
  NormalizedMatch,
  NormalizedOddsSnapshot,
  NormalizedPlayer,
  NormalizedTeam,
  NormalizedTournament,
  ProviderName,
  ProviderQuality
} from "./normalized";

export type ProviderCapability =
  | "teams"
  | "players"
  | "matches"
  | "maps"
  | "odds"
  | "tournaments"
  | "rankings"
  | "rosters"
  | "h2h"
  | "veto";

export type ProviderContext = {
  game?: GameDiscipline;
  asOf?: Date;
  limit?: number;
};

export type ProviderResult<T> = {
  data: T;
  source: DataSourceReference;
  quality: ProviderQuality;
  warnings: string[];
};

export type TeamProvider = {
  providerName: ProviderName;
  listTeams(context?: ProviderContext): Promise<ProviderResult<NormalizedTeam[]>>;
  findTeam(name: string, context?: ProviderContext): Promise<ProviderResult<NormalizedTeam | null>>;
};

export type PlayerProvider = {
  providerName: ProviderName;
  listPlayersByTeam(teamName: string, context?: ProviderContext): Promise<ProviderResult<NormalizedPlayer[]>>;
};

export type MatchProvider = {
  providerName: ProviderName;
  listMatches(context?: ProviderContext): Promise<ProviderResult<NormalizedMatch[]>>;
  getMatch(matchId: string, context?: ProviderContext): Promise<ProviderResult<NormalizedMatch | null>>;
};

export type MapProvider = {
  providerName: ProviderName;
  getTeamMapPool(teamName: string, context?: ProviderContext): Promise<ProviderResult<NormalizedMap[]>>;
  getMatchMaps(matchId: string, context?: ProviderContext): Promise<ProviderResult<NormalizedMap[]>>;
};

export type OddsProvider = {
  providerName: ProviderName;
  getOddsSnapshots(matchId: string, context?: ProviderContext): Promise<ProviderResult<NormalizedOddsSnapshot[]>>;
};

export type TournamentProvider = {
  providerName: ProviderName;
  listTournaments(context?: ProviderContext): Promise<ProviderResult<NormalizedTournament[]>>;
  getTournamentContext(name: string, context?: ProviderContext): Promise<ProviderResult<NormalizedTournament | null>>;
};

export type ProviderBundle = Partial<TeamProvider & PlayerProvider & MatchProvider & MapProvider & OddsProvider & TournamentProvider> & {
  providerName: ProviderName;
  capabilities: ProviderCapability[];
};
