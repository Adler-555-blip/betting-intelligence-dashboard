import { hltvSnapshotProvider } from "./hltvProvider";
import { liquipediaSnapshotProvider } from "./liquipediaProvider";
import { dataSourceRegistry } from "./registry";
import type { ProviderBundle, ProviderCapability } from "./contracts";

export const providerLayer: ProviderBundle[] = [
  hltvSnapshotProvider,
  liquipediaSnapshotProvider
];

export function listProvidersForCapability(capability: ProviderCapability) {
  return providerLayer.filter((provider) => provider.capabilities.includes(capability));
}

export function getProviderReadinessReport() {
  return dataSourceRegistry.map((source) => ({
    providerName: source.providerName,
    sourceType: source.sourceType,
    reliabilityScore: source.reliabilityScore,
    freshness: source.freshness,
    coverage: source.coverage,
    costTier: source.costTier,
    capabilities: source.capabilities,
    implementedInProviderLayer: providerLayer.some((provider) => provider.providerName === source.providerName),
    productionReady: source.productionReady
  }));
}

export type {
  MapProvider,
  MatchProvider,
  OddsProvider,
  PlayerProvider,
  ProviderBundle,
  ProviderCapability,
  ProviderContext,
  ProviderResult,
  TeamProvider,
  TournamentProvider
} from "./contracts";

export type {
  DataKind,
  DataSourceReference,
  GameDiscipline,
  NormalizedMap,
  NormalizedMapPool,
  NormalizedMapResult,
  NormalizedMatch,
  NormalizedOddsSnapshot,
  NormalizedPlayer,
  NormalizedTeam,
  NormalizedTeamMapStats,
  NormalizedTournament,
  ProviderName,
  ProviderQuality
} from "./normalized";
