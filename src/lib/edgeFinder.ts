import type { Bookmaker, Match, OddsSnapshot, Team, Tournament } from "@prisma/client";
import { calculateDataQualityScore, type EdgeFeature, type EdgeFeatureSource } from "./dataQuality";
import type { MatchIntelligence, MapFactor, PlayerKillFactor } from "./matchIntelligence";
import {
  calculateEdgePercent,
  calculateExpectedValue,
  decimalOddsToImpliedProbability,
  normalizeScoreToProbability,
  round1
} from "./probabilityCore";
import { liquipediaSnapshotProvider } from "./providers/liquipediaProvider";
import { buildTournamentFeatureSnapshot, sourceFromQuality } from "./providers/probabilityCompatibility";

export type EdgeType = "Map Edge" | "Player Edge" | "CT/T Edge" | "Tournament Edge" | "Line Movement Edge";
export type EdgeSource = "Real" | "Partial" | "Snapshot" | "Demo" | "Fallback" | "Missing";
export type EdgeConfidence = "высокий" | "средний" | "низкий";
export type { EdgeFeature };

const MODEL_VERSION = "rule-based-v0.9";

export type EdgeDetail = {
  factor: string;
  teamA: string;
  teamB: string;
  impact: string;
  source: EdgeSource;
};

export type OddsComparison = {
  market: string;
  odds: number;
  systemProbability: number;
  impliedProbability: number;
  edgePercent: number;
  expectedValue: number;
  dataQualityScore: number;
  edgeStrength: number;
  divergence: number;
  status: EdgeSource;
};

export type BettingEdge = {
  id: string;
  title: string;
  type: EdgeType;
  signalStrength: number;
  systemProbability: number;
  impliedProbability: number;
  edgePercent: number;
  dataQualityScore: number;
  modelVersion: string;
  featureSnapshot: EdgeFeature[];
  predictedOutcome: string;
  shortSummary: string;
  why: string;
  factorsFor: string[];
  factorsAgainst: string[];
  source: EdgeSource;
  confidence: EdgeConfidence;
  details: EdgeDetail[];
  oddsComparison: OddsComparison;
};

type MatchForEdges = Match & {
  teamA: Team;
  teamB: Team;
  tournament: Tournament;
  oddsSnapshots: (OddsSnapshot & { bookmaker: Bookmaker })[];
};

export async function findBettingEdges(match: MatchForEdges, intelligence: MatchIntelligence): Promise<BettingEdge[]> {
  const tournamentEdge = await buildTournamentEdge(match, intelligence);
  return [
    buildMapEdge(match, intelligence),
    buildPlayerEdge(match, intelligence),
    buildCtTEdge(match, intelligence),
    tournamentEdge,
    buildLineMovementEdge(match, intelligence)
  ].sort((a, b) => b.signalStrength - a.signalStrength);
}

function buildMapEdge(match: MatchForEdges, intelligence: MatchIntelligence): BettingEdge {
  const bestMap = strongestMap(intelligence.maps);
  if (!bestMap) {
    const leader = scoreLeader(match, intelligence);
    const strength = clamp(52 + Math.abs(intelligence.score.teamA - intelligence.score.teamB));
    return createEdge({
      match,
      id: "map-fallback",
      title: `Fallback Map Edge: ${leader.name}`,
      type: "Map Edge",
      signalStrength: strength,
      why: "Для этой дисциплины нет подключенной статистики карт, поэтому система использует общий профиль матча как fallback.",
      factorsFor: [`${leader.name}: выше общий профиль по доступным факторам`, `${match.format}: формат влияет на надежность закономерности`],
      factorsAgainst: ["Нет реального map pool", "Нет veto", "Данные fallback"],
      source: "Fallback",
      confidence: "низкий",
      details: [
        row("Общий профиль", `${intelligence.score.teamA}%`, `${intelligence.score.teamB}%`, "fallback вместо map pool", "Fallback"),
        row("Формат", match.format, match.format, "BO1/BO3/BO5 влияет на устойчивость сигнала", "Demo"),
        row("Вероятность появления карты", "нет данных", "нет данных", "требуется реальный veto/map pool", "Fallback")
      ],
      featureSnapshot: [
        feature("Общий профиль", Math.max(intelligence.score.teamA, intelligence.score.teamB), 25, "Fallback", "positive", "fallback вместо реального map pool"),
        feature("Формат матча", match.format, 15, "Demo", "neutral", "формат влияет на дисперсию"),
        feature("Map pool", "нет данных", 25, "Missing", "negative", "нужен реальный источник карт"),
        feature("Veto probability", "нет данных", 25, "Missing", "negative", "нужна история veto")
      ]
    });
  }

  const leader = bestMap.advantage === "teamB" ? match.teamB.name : match.teamA.name;
  const diff = Math.abs(bestMap.teamAWinrate - bestMap.teamBWinrate);
  const formatBonus = match.format === "BO3" ? 8 : match.format === "BO5" ? 10 : 3;
  const source = mapEdgeSource(bestMap);
  const sampleSize = bestMap.sampleSize ?? bestMap.teamAPlayed + bestMap.teamBPlayed;
  const missing = bestMap.missing ?? ["veto"];
  const mapQuality = bestMap.dataQualityScore ?? 0;
  const strength = clamp(45 + diff * 0.55 + formatBonus + Math.min(sampleSize, 24) * 0.45);

  return createEdge({
    match,
    id: `map-${bestMap.map}`,
    title: `Преимущество ${leader} на ${bestMap.map}`,
    type: "Map Edge",
    signalStrength: strength,
    why: `${leader} имеет более сильный ${source === "Demo" ? "demo" : "snapshot"}-профиль на ${bestMap.map}. Это Partial Map Edge: он учитывает историю карт, winrate, sample size и рейтинг, но не содержит veto, CT/T и player stats.`,
    factorsFor: [
      `${match.teamA.name} winrate ${bestMap.map}: ${bestMap.teamAWinrate}%`,
      `${match.teamB.name} winrate ${bestMap.map}: ${bestMap.teamBWinrate}%`,
      `Разница winrate: ${diff}%`,
      `Sample size: ${sampleSize} карт`,
      `Data Quality: ${mapQuality}/100`,
      `Формат матча: ${match.format}`,
      `Источник: ${bestMap.source}`
    ],
    factorsAgainst: [`Не хватает: ${missing.join(", ")}`, "Нет подтвержденного veto", "Нет live map history"],
    source,
    confidence: strength >= 72 ? "средний" : "низкий",
    details: [
      row("Winrate на карте", `${bestMap.teamAWinrate}%`, `${bestMap.teamBWinrate}%`, `разница ${diff}%`, source),
      row("Сыграно карт", String(bestMap.teamAPlayed), String(bestMap.teamBPlayed), `sample size ${sampleSize}`, source),
      row("Частота карты", `${bestMap.frequency ?? 0}%`, `${bestMap.frequency ?? 0}%`, "доля карты в provider snapshot", source),
      row("Последние результаты", bestMap.recentResults?.[0] ?? "нет данных", bestMap.recentResults?.[1] ?? "нет данных", "последние карты из Liquipedia snapshot", source),
      row("Data Quality", `${mapQuality}/100`, `${mapQuality}/100`, "source + sample size + freshness, capped by missing veto", source),
      row("Источник данных", bestMap.source, bestMap.source, "manual snapshot, не live API", source),
      row("Недостающие данные", missing.join(", "), missing.join(", "), "ограничивает качество Map Edge", "Missing"),
      row("Вероятность появления карты", probabilityByFormat(match.format), probabilityByFormat(match.format), "нет реального veto", "Fallback")
    ],
    featureSnapshot: [
      feature("Map winrate diff", diff, 28, edgeFeatureSource(source), diff >= 8 ? "positive" : "neutral", bestMap.source),
      feature("Sample size", sampleSize, 22, edgeFeatureSource(source), sampleSize >= 18 ? "positive" : "neutral", `${bestMap.teamAPlayed}/${bestMap.teamBPlayed} сыграно карт`),
      feature("Map Data Quality", mapQuality, 18, edgeFeatureSource(source), mapQuality >= 70 ? "positive" : "neutral", "Liquipedia profile quality"),
      feature("Recent map form", bestMap.recentResults?.join(" | ") ?? "нет данных", 12, edgeFeatureSource(source), "neutral", "последние результаты по карте"),
      feature("Match format", match.format, 10, "Demo", "neutral", "формат матча"),
      feature("Source URL", bestMap.source, 10, edgeFeatureSource(source), "neutral", "provider provenance"),
      feature("Map pool", bestMap.map, 10, edgeFeatureSource(source), "neutral", "manual snapshot map pool"),
      feature("Veto probability", probabilityByFormat(match.format), 20, "Fallback", "negative", "нет реальной истории veto"),
      feature("H2H map history", missing.includes("H2H map history") ? "нет данных" : "частично", 10, missing.includes("H2H map history") ? "Missing" : edgeFeatureSource(source), "neutral", "ограниченный snapshot H2H")
    ],
    marketName: `${leader} сильнее на ${bestMap.map}`,
    dataQualityCap: missing.includes("veto") ? 80 : undefined
  });
}

function buildPlayerEdge(match: MatchForEdges, intelligence: MatchIntelligence): BettingEdge {
  const players = intelligence.playerKills;
  const top = players.length ? [...players].sort((a, b) => playerScore(b) - playerScore(a))[0] : null;
  if (!top) {
    const leader = scoreLeader(match, intelligence);
    const strength = clamp(46 + Math.abs(intelligence.score.teamA - intelligence.score.teamB) * 0.7);
    return createEdge({
      match,
      id: "player-fallback",
      title: `Fallback Player Edge: ${leader.name}`,
      type: "Player Edge",
      signalStrength: strength,
      why: "Статистика игроков для этой дисциплины пока не подключена, поэтому система показывает только структуру будущего player edge.",
      factorsFor: [`${leader.name}: общий профиль выше`, "Блок готов для K/D, ADR и средних киллов"],
      factorsAgainst: ["Нет реальных игроков", "Нет индивидуальных линий", "Fallback-оценка"],
      source: "Fallback",
      confidence: "низкий",
      details: [
        row("Средние киллы", "нет данных", "нет данных", "нужно подключить игроков", "Fallback"),
        row("K/D", "нет данных", "нет данных", "нужно подключить игроков", "Fallback"),
        row("ADR", "нет данных", "нет данных", "нужно подключить игроков", "Fallback"),
        row("Отклонение от линии", "нет линии", "нет линии", "будущий рынок player props", "Fallback")
      ],
      featureSnapshot: [
        feature("Общий профиль команды", leader.score, 20, "Fallback", "neutral", "fallback вместо player logs"),
        feature("Average kills", "нет данных", 25, "Missing", "negative", "нужны player match logs"),
        feature("K/D", "нет данных", 20, "Missing", "negative"),
        feature("ADR", "нет данных", 20, "Missing", "negative"),
        feature("Market line", "нет данных", 15, "Missing", "negative", "нужна линия игрока")
      ]
    });
  }

  const strength = clamp(42 + top.avgKillsLast10 * 1.25 + top.kd * 8 + top.adr / 5 + stabilityBonus(top.stability));
  return createEdge({
    match,
    id: `player-${top.nickname}`,
    title: `Player Edge: ${top.nickname}`,
    type: "Player Edge",
    signalStrength: strength,
    why: `${top.nickname} выделяется по средним киллам, K/D и ADR в demo-данных. Это не прогноз, а повод проверить индивидуальные рынки.`,
    factorsFor: [
      `${top.nickname}: ${top.avgKillsLast10} средних киллов за 10 карт`,
      `K/D: ${top.kd.toFixed(2)}`,
      `ADR: ${top.adr.toFixed(1)}`,
      `Стабильность: ${top.stability}`
    ],
    factorsAgainst: ["Нет реальной линии по киллам", "Нет подтвержденного veto", "Данные демо"],
    source: "Demo",
    confidence: strength >= 75 ? "средний" : "низкий",
    details: [
      row("Средние киллы 5 карт", playerMetric(top, match.teamA.name, "avgKillsLast5"), playerMetric(top, match.teamB.name, "avgKillsLast5"), "форма игрока", "Demo"),
      row("Средние киллы 10 карт", playerMetric(top, match.teamA.name, "avgKillsLast10"), playerMetric(top, match.teamB.name, "avgKillsLast10"), "устойчивость объема", "Demo"),
      row("K/D", playerMetric(top, match.teamA.name, "kd"), playerMetric(top, match.teamB.name, "kd"), "качество дуэлей", "Demo"),
      row("ADR", playerMetric(top, match.teamA.name, "adr"), playerMetric(top, match.teamB.name, "adr"), "урон за раунд", "Demo"),
      row("Отклонение от условной линии", "+1.8 kills", "нет данных", "линия пока условная", "Fallback")
    ],
    featureSnapshot: [
      feature("Average kills last 10", top.avgKillsLast10, 25, "Demo", "positive", "demo player kills"),
      feature("K/D", round1(top.kd), 20, "Demo", top.kd >= 1.1 ? "positive" : "neutral", "demo K/D"),
      feature("ADR", round1(top.adr), 20, "Demo", top.adr >= 75 ? "positive" : "neutral", "demo ADR"),
      feature("Stability", top.stability, 15, "Demo", top.stability === "высокая" ? "positive" : "neutral"),
      feature("Expected rounds", "нет данных", 10, "Missing", "negative", "нужен прогноз карты/раундов"),
      feature("Market line", "условная", 10, "Fallback", "negative", "реальной линии игрока нет")
    ],
    marketName: `${top.nickname}: индивидуальный рынок`
  });
}

function buildCtTEdge(match: MatchForEdges, intelligence: MatchIntelligence): BettingEdge {
  const bestMap = strongestSideMap(intelligence.maps);
  if (!bestMap) {
    return createEdge({
      match,
      id: "ctt-fallback",
      title: "Fallback CT/T Edge",
      type: "CT/T Edge",
      signalStrength: 44,
      why: "CT/T статистика доступна только для CS2 demo-карт. Для этого матча блок показывает будущую структуру проверки.",
      factorsFor: ["Структура CT/T edge готова", "Можно будет сравнивать стороны по картам"],
      factorsAgainst: ["Нет CT/T данных", "Нет карты", "Fallback-оценка"],
      source: "Fallback",
      confidence: "низкий",
      details: [
        row("CT round winrate", "нет данных", "нет данных", "нужно подключить карту", "Fallback"),
        row("T round winrate", "нет данных", "нет данных", "нужно подключить карту", "Fallback"),
        row("Профиль карты", "нет данных", "нет данных", "CT-sided / T-sided / Balanced", "Fallback")
      ],
      featureSnapshot: [
        feature("CT round winrate", "нет данных", 30, "Missing", "negative"),
        feature("T round winrate", "нет данных", 30, "Missing", "negative"),
        feature("Map side profile", "нет данных", 20, "Missing", "negative"),
        feature("Starting side", "нет данных", 20, "Missing", "negative")
      ]
    });
  }

  const teamASideGap = Math.abs(bestMap.teamACTWinrate - bestMap.teamATWinrate);
  const teamBSideGap = Math.abs(bestMap.teamBCTWinrate - bestMap.teamBTWinrate);
  const strength = clamp(45 + (teamASideGap + teamBSideGap) * 0.65 + (bestMap.sideProfile === "Balanced" ? 0 : 10));

  return createEdge({
    match,
    id: `ctt-${bestMap.map}`,
    title: `CT/T Edge на ${bestMap.map}`,
    type: "CT/T Edge",
    signalStrength: strength,
    why: `${bestMap.map} отмечена как ${bestMap.sideProfile}. Разница CT/T winrate помогает понять, где команда может получить структурное преимущество.`,
    factorsFor: [
      `${match.teamA.name}: CT/T ${bestMap.teamACTWinrate}% / ${bestMap.teamATWinrate}%`,
      `${match.teamB.name}: CT/T ${bestMap.teamBCTWinrate}% / ${bestMap.teamBTWinrate}%`,
      `Профиль карты: ${bestMap.sideProfile}`,
      `Сильнее сторона: ${bestMap.strongerSide}`
    ],
    factorsAgainst: ["Нет реального veto", "Нет live-стороны старта", "Данные демо"],
    source: "Demo",
    confidence: strength >= 70 ? "средний" : "низкий",
    details: [
      row("CT round winrate", `${bestMap.teamACTWinrate}%`, `${bestMap.teamBCTWinrate}%`, "сила CT-стороны", "Demo"),
      row("T round winrate", `${bestMap.teamATWinrate}%`, `${bestMap.teamBTWinrate}%`, "сила T-стороны", "Demo"),
      row("Среднее число раундов за сторону", "12.4", "12.1", "demo-объем", "Demo"),
      row("CT/T баланс карты", bestMap.sideProfile, bestMap.sideProfile, "профиль карты", "Demo")
    ],
    featureSnapshot: [
      feature("CT side gap", teamASideGap + teamBSideGap, 25, "Demo", "positive", "demo разница CT/T"),
      feature("CT round winrate", `${bestMap.teamACTWinrate}/${bestMap.teamBCTWinrate}`, 20, "Demo", "neutral"),
      feature("T round winrate", `${bestMap.teamATWinrate}/${bestMap.teamBTWinrate}`, 20, "Demo", "neutral"),
      feature("Map side profile", bestMap.sideProfile, 20, "Demo", bestMap.sideProfile === "Balanced" ? "neutral" : "positive"),
      feature("Starting side", "нет данных", 15, "Missing", "negative", "нужен live/fixture источник")
    ],
    marketName: `CT/T профиль ${bestMap.map}`
  });
}

async function buildTournamentEdge(match: MatchForEdges, intelligence: MatchIntelligence): Promise<BettingEdge> {
  const providerTournamentResult = match.game === "cs2"
    ? await liquipediaSnapshotProvider.getTournamentContext?.(match.tournament.name, { game: "cs2" })
    : null;
  const providerContext = providerTournamentResult?.data ?? null;
  const providerFeatureSnapshot = buildTournamentFeatureSnapshot(providerContext);
  const providerFeatureSource = providerContext ? sourceFromQuality(providerContext.quality) : "Missing";
  const providerEdgeSource = edgeSourceFromFeatureSource(providerFeatureSource);
  const stage = match.format.toLowerCase().includes("group") ? "group" : match.format;
  const formatWeight = match.format === "BO5" ? 14 : match.format === "BO3" ? 10 : match.format === "BO1" ? 4 : 8;
  const importanceWeight = Math.round(match.importanceScore / 10);
  const strength = clamp(42 + formatWeight + importanceWeight + (match.status === "prematch" ? 4 : 0) + (providerContext ? 5 : 0));
  const realFootballContext = match.game === "football" && intelligence.footballContext?.badge === "real";
  const realTournamentContext = Boolean(providerContext || realFootballContext);
  const tournamentEdgeSource: EdgeSource = providerContext ? providerEdgeSource : realFootballContext ? "Real" : "Demo";
  const providerLabel = providerContext?.source.providerName ?? "Demo";
  const providerQuality = providerContext?.quality.reliabilityScore ?? null;
  const sourceUrl = providerContext?.source.sourceUrl ?? null;
  const tournamentFeatures: EdgeFeature[] = [
    ...providerFeatureSnapshot.features,
    feature("Stage", stage, 15, realTournamentContext ? "Real" : "Demo", "neutral", providerContext ? "provider tournament context" : "нет provider match context"),
    feature("Live news", "нет данных", 10, "Missing", "negative")
  ];

  return createEdge({
    match,
    id: "tournament",
    title: `Tournament Edge: ${match.tournament.name}`,
    type: "Tournament Edge",
    signalStrength: strength,
    why: `Турнирный контекст учитывает стадию, формат ${match.format}, важность ${match.importanceScore}/100 и надежность доступной статистики.`,
    factorsFor: [
      `Турнир: ${match.tournament.name}`,
      `Формат: ${match.format}`,
      `Важность: ${match.importanceScore}/100`,
      `Стадия/контекст: ${stage}`,
      realTournamentContext ? `Provider: ${providerLabel}` : "Provider context не найден"
    ],
    factorsAgainst: ["Нет реальной турнирной мотивации по всем дисциплинам", "Нет live-новостей", realTournamentContext ? "Нет live-синхронизации provider snapshot" : "Часть данных demo/fallback"],
    source: tournamentEdgeSource,
    confidence: realTournamentContext ? "средний" : "низкий",
    details: [
      row("Источник турнира", providerLabel, providerLabel, sourceUrl ?? "snapshot без live API", realTournamentContext ? "Real" : "Demo"),
      row("Provider quality", providerQuality ? `${providerQuality}/100` : "нет данных", providerQuality ? `${providerQuality}/100` : "нет данных", "качество источника", realTournamentContext ? "Real" : "Demo"),
      row("Стадия турнира", stage, stage, "контекст мотивации", realTournamentContext ? "Real" : "Demo"),
      row("Формат", match.format, match.format, "BO1/BO3/BO5 меняет дисперсию", "Demo"),
      row("Надежность статистики", reliabilityLabel(match, intelligence), reliabilityLabel(match, intelligence), "больше real-данных — выше доверие", realTournamentContext ? "Real" : "Demo"),
      row("Важность", `${match.importanceScore}/100`, `${match.importanceScore}/100`, "приоритет проверки матча", "Demo")
    ],
    featureSnapshot: tournamentFeatures,
    marketName: `Контекст ${match.tournament.name}`
  });
}

function buildLineMovementEdge(match: MatchForEdges, intelligence: MatchIntelligence): BettingEdge {
  const movement = lineMovement(match.oddsSnapshots);
  const leader = movement.deltaA <= movement.deltaB ? match.teamA.name : match.teamB.name;
  const strength = clamp(44 + Math.abs(movement.deltaA - movement.deltaB) * 180 + Math.max(0, movement.snapshotCount - 4) * 2);

  return createEdge({
    match,
    id: "line-movement",
    title: `Line Movement Edge: ${leader}`,
    type: "Line Movement Edge",
    signalStrength: strength,
    why: "Система сравнивает изменение коэффициентов по времени и показывает, где есть заметное движение рынка.",
    factorsFor: [
      `${match.teamA.name}: изменение ${formatDelta(movement.deltaA)}`,
      `${match.teamB.name}: изменение ${formatDelta(movement.deltaB)}`,
      `Снимков линии: ${movement.snapshotCount}`,
      `Направление: ${leader}`
    ],
    factorsAgainst: ["Коэффициенты demo", "Нет реального объема рынка", "Нет подтверждения причины движения"],
    source: "Demo",
    confidence: strength >= 68 ? "средний" : "низкий",
    details: [
      row("Изменение коэффициента", formatDelta(movement.deltaA), formatDelta(movement.deltaB), "направление рынка", "Demo"),
      row("Сила движения", `${Math.round(Math.abs(movement.deltaA) * 100)}%`, `${Math.round(Math.abs(movement.deltaB) * 100)}%`, "чем резче движение, тем выше сигнал", "Demo"),
      row("Количество снимков", String(movement.snapshotCount), String(movement.snapshotCount), "надежность ряда", "Demo"),
      row("Мнение системы", `${intelligence.score.teamA}%`, `${intelligence.score.teamB}%`, "сравнение с общей оценкой", "Demo")
    ],
    featureSnapshot: [
      feature("Opening/current delta A", formatDelta(movement.deltaA), 25, "Demo", "neutral", "demo odds snapshots"),
      feature("Opening/current delta B", formatDelta(movement.deltaB), 25, "Demo", "neutral", "demo odds snapshots"),
      feature("Movement direction", leader, 15, "Demo", "positive"),
      feature("Number of snapshots", movement.snapshotCount, 15, "Demo", movement.snapshotCount >= 4 ? "positive" : "neutral"),
      feature("Market liquidity", "нет данных", 10, "Missing", "negative"),
      feature("Closing line", "нет данных", 10, "Missing", "negative")
    ],
    marketName: `${leader}: движение линии`
  });
}

function createEdge(input: {
  match: MatchForEdges;
  id: string;
  title: string;
  type: EdgeType;
  signalStrength: number;
  why: string;
  factorsFor: string[];
  factorsAgainst: string[];
  source: EdgeSource;
  confidence: EdgeConfidence;
  details: EdgeDetail[];
  featureSnapshot: EdgeFeature[];
  marketName?: string;
  dataQualityCap?: number;
}): BettingEdge {
  const odds = bestAvailableOdds(input.match.oddsSnapshots);
  const impliedProbability = odds ? Math.round(decimalOddsToImpliedProbability(odds)) : 0;
  const signalStrength = Math.round(input.signalStrength);
  const dataQualityScore = Math.min(calculateDataQualityScore(input.featureSnapshot), input.dataQualityCap ?? 100);
  const systemProbability = calculateSystemProbability(signalStrength, dataQualityScore, input.source);
  const edgePercent = calculateEdgePercent(systemProbability, impliedProbability);
  const expectedValue = calculateExpectedValue(systemProbability, odds);
  return {
    id: input.id,
    title: input.title,
    type: input.type,
    signalStrength,
    systemProbability,
    impliedProbability,
    edgePercent,
    dataQualityScore,
    modelVersion: MODEL_VERSION,
    featureSnapshot: input.featureSnapshot,
    predictedOutcome: input.marketName ?? input.title,
    shortSummary: `${input.title} — сигнал ${signalStrength}%, вероятность ${systemProbability}%`,
    why: input.why,
    factorsFor: input.factorsFor,
    factorsAgainst: input.factorsAgainst,
    source: input.source,
    confidence: input.confidence,
    details: input.details,
    oddsComparison: {
      market: input.marketName ?? input.title,
      odds: odds ?? 0,
      systemProbability,
      impliedProbability,
      edgePercent,
      expectedValue,
      dataQualityScore,
      edgeStrength: systemProbability,
      divergence: Math.abs(edgePercent),
      status: odds ? "Demo" : "Fallback"
    }
  };
}

function calculateSystemProbability(signalStrength: number, dataQualityScore: number, source: EdgeSource) {
  const rawProbability = normalizeScoreToProbability(signalStrength, 49, source === "Real" ? 68 : 62);
  const qualityFactor = dataQualityScore / 100;
  const conservativeProbability = 50 + (rawProbability - 50) * (0.28 + qualityFactor * 0.62);
  const maxByQuality = dataQualityScore < 25 ? 56 : dataQualityScore < 50 ? 60 : dataQualityScore < 75 ? 65 : 72;
  return round1(Math.min(conservativeProbability, maxByQuality));
}

function row(factor: string, teamA: string, teamB: string, impact: string, source: EdgeSource): EdgeDetail {
  return { factor, teamA, teamB, impact, source };
}

function feature(name: string, value: string | number, weight: number, source: EdgeFeatureSource, impact: EdgeFeature["impact"], note?: string): EdgeFeature {
  return { name, value, weight, source, impact, note };
}

function edgeSourceFromFeatureSource(source: EdgeFeatureSource): EdgeSource {
  if (source === "Real") return "Real";
  if (source === "Partial") return "Partial";
  if (source === "Snapshot") return "Snapshot";
  if (source === "Demo") return "Demo";
  if (source === "Missing") return "Missing";
  return "Fallback";
}

function mapEdgeSource(map: MapFactor): EdgeSource {
  if (map.badge === "real") return "Real";
  if (map.badge === "partial") return "Partial";
  if (map.badge === "snapshot") return "Snapshot";
  if (map.badge === "missing" || map.badge === "insufficient") return "Missing";
  return "Demo";
}

function edgeFeatureSource(source: EdgeSource): EdgeFeatureSource {
  if (source === "Real") return "Real";
  if (source === "Partial") return "Partial";
  if (source === "Snapshot") return "Snapshot";
  if (source === "Demo") return "Demo";
  if (source === "Missing") return "Missing";
  return "Fallback";
}

function strongestMap(maps: MapFactor[]) {
  return [...maps]
    .filter((map) => map.advantage !== "even")
    .sort((a, b) => Math.abs(b.teamAWinrate - b.teamBWinrate) - Math.abs(a.teamAWinrate - a.teamBWinrate))[0];
}

function strongestSideMap(maps: MapFactor[]) {
  return [...maps].sort((a, b) => sideGap(b) - sideGap(a))[0];
}

function sideGap(map: MapFactor) {
  return Math.abs(map.teamACTWinrate - map.teamATWinrate) + Math.abs(map.teamBCTWinrate - map.teamBTWinrate);
}

function scoreLeader(match: MatchForEdges, intelligence: MatchIntelligence) {
  return intelligence.score.teamA >= intelligence.score.teamB
    ? { name: match.teamA.name, score: intelligence.score.teamA }
    : { name: match.teamB.name, score: intelligence.score.teamB };
}

function playerScore(player: PlayerKillFactor) {
  return player.avgKillsLast10 + player.kd * 8 + player.adr / 10 + stabilityBonus(player.stability);
}

function playerMetric(player: PlayerKillFactor, teamName: string, metric: "avgKillsLast5" | "avgKillsLast10" | "kd" | "adr") {
  if (player.teamName !== teamName) return "нет данных";
  return metric === "kd" ? player[metric].toFixed(2) : metric === "adr" ? player[metric].toFixed(1) : String(player[metric]);
}

function stabilityBonus(value: string) {
  if (value === "высокая") return 8;
  if (value === "средняя") return 4;
  return 0;
}

function probabilityByFormat(format: string) {
  if (format === "BO1") return "высокая";
  if (format === "BO3") return "средняя";
  if (format === "BO5") return "ниже средней";
  return "нет данных";
}

function reliabilityLabel(match: MatchForEdges, intelligence: MatchIntelligence) {
  if (match.game === "football" && intelligence.footballContext?.badge === "real") return "частично real";
  if (!intelligence.score.partial) return "выше средней";
  return "низкая";
}

function lineMovement(snapshots: OddsSnapshot[]) {
  const teamA = sortedOdds(snapshots, "teamA");
  const teamB = sortedOdds(snapshots, "teamB");
  return {
    deltaA: relativeDelta(teamA),
    deltaB: relativeDelta(teamB),
    snapshotCount: Math.max(teamA.length, teamB.length)
  };
}

function sortedOdds(snapshots: OddsSnapshot[], selection: string) {
  return snapshots
    .filter((item) => item.selection === selection)
    .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
    .map((item) => item.odds);
}

function relativeDelta(values: number[]) {
  if (values.length < 2) return 0;
  const first = values[0];
  const last = values[values.length - 1];
  return (last - first) / first;
}

function formatDelta(value: number) {
  return `${value >= 0 ? "+" : ""}${Math.round(value * 100)}%`;
}

function bestAvailableOdds(snapshots: (OddsSnapshot & { bookmaker?: Bookmaker })[]) {
  const latest = new Map<string, number>();
  for (const snapshot of [...snapshots].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())) {
    const key = `${snapshot.bookmakerId}:${snapshot.selection}`;
    if (!latest.has(key)) latest.set(key, snapshot.odds);
  }
  const values = Array.from(latest.values());
  return values.length ? Math.max(...values) : null;
}

function clamp(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}
