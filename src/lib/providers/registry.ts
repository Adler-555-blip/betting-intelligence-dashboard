import type { CostTier, Freshness, ProviderName, SourceType } from "./normalized";
import type { ProviderCapability } from "./contracts";

export type DataSourceRegistryEntry = {
  providerName: ProviderName;
  reliabilityScore: number;
  freshness: Freshness;
  coverage: number;
  costTier: CostTier;
  sourceType: SourceType;
  capabilities: ProviderCapability[];
  productionReady: boolean;
  notes: string;
};

export const dataSourceRegistry: DataSourceRegistryEntry[] = [
  {
    providerName: "Liquipedia",
    reliabilityScore: 82,
    freshness: "snapshot",
    coverage: 58,
    costTier: "free_with_limits",
    sourceType: "manual_snapshot",
    capabilities: ["matches", "tournaments", "rosters"],
    productionReady: true,
    notes: "Подходит для ручного tournament/schedule snapshot и проверки контекста без платного API."
  },
  {
    providerName: "HLTV Snapshot",
    reliabilityScore: 86,
    freshness: "snapshot",
    coverage: 62,
    costTier: "free_with_limits",
    sourceType: "manual_snapshot",
    capabilities: ["teams", "players", "matches", "rankings", "rosters"],
    productionReady: true,
    notes: "Текущий CS2 foundation хранит ручной snapshot рейтинга, матчей и составов."
  },
  {
    providerName: "GRID",
    reliabilityScore: 94,
    freshness: "live",
    coverage: 92,
    costTier: "enterprise",
    sourceType: "api",
    capabilities: ["matches", "maps", "players", "tournaments", "h2h", "veto"],
    productionReady: false,
    notes: "Кандидат для production-grade CS2 telemetry, но сейчас не подключен."
  },
  {
    providerName: "PandaScore",
    reliabilityScore: 78,
    freshness: "daily",
    coverage: 74,
    costTier: "paid",
    sourceType: "api",
    capabilities: ["teams", "players", "matches", "tournaments", "rosters"],
    productionReady: false,
    notes: "Уже есть placeholder, но продукт не должен зависеть от него напрямую."
  },
  {
    providerName: "BALLDONTLIE",
    reliabilityScore: 72,
    freshness: "daily",
    coverage: 46,
    costTier: "paid",
    sourceType: "api",
    capabilities: ["teams", "players", "matches", "maps", "rankings", "rosters"],
    productionReady: false,
    notes: "Trial показал, что teams/players доступны, а ключевые CS2 endpoint'ы могут быть закрыты тарифом."
  },
  {
    providerName: "Demo",
    reliabilityScore: 25,
    freshness: "unknown",
    coverage: 100,
    costTier: "internal",
    sourceType: "demo",
    capabilities: ["teams", "players", "matches", "maps", "odds", "tournaments", "h2h"],
    productionReady: false,
    notes: "Нужен для демонстрации интерфейса, но не для реального betting edge."
  },
  {
    providerName: "Fallback",
    reliabilityScore: 10,
    freshness: "unknown",
    coverage: 100,
    costTier: "internal",
    sourceType: "fallback",
    capabilities: ["teams", "players", "matches", "maps", "odds", "tournaments"],
    productionReady: false,
    notes: "Страховочный слой, который должен явно снижать Data Quality Score."
  }
];

export function getDataSource(providerName: ProviderName) {
  return dataSourceRegistry.find((source) => source.providerName === providerName) ?? null;
}

export function listDataSourcesByCapability(capability: ProviderCapability) {
  return dataSourceRegistry.filter((source) => source.capabilities.includes(capability));
}
