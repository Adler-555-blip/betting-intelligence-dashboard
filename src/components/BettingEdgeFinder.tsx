"use client";

import { useEffect, useMemo, useState } from "react";
import type { BettingEdge, EdgeSource } from "@/src/lib/edgeFinder";
import type { EdgeFeatureSource } from "@/src/lib/dataQuality";

type UserOpinion = "Согласен с системой" | "Частично согласен" | "Не согласен";

type OpinionState = {
  opinion: UserOpinion;
  comment: string;
};

const opinionOptions: UserOpinion[] = ["Согласен с системой", "Частично согласен", "Не согласен"];

const checklist = [
  "подтвержден ли veto",
  "известны ли составы",
  "матч BO1/BO3/BO5",
  "стадия турнира",
  "есть ли live-данные",
  "не демо ли данные",
  "есть ли движение линии"
];

export function BettingEdgeFinder({ matchId, edges }: { matchId: string; edges: BettingEdge[] }) {
  const topEdge = edges[0];
  const storageKey = useMemo(() => `betting-edge-opinion:${matchId}`, [matchId]);
  const [opinion, setOpinion] = useState<OpinionState>({ opinion: "Частично согласен", comment: "" });
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const saved = window.localStorage.getItem(storageKey);
    if (!saved) {
      setHydrated(true);
      return;
    }
    try {
      setOpinion(JSON.parse(saved) as OpinionState);
    } catch {
      setOpinion({ opinion: "Частично согласен", comment: "" });
    } finally {
      setHydrated(true);
    }
  }, [storageKey]);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(storageKey, JSON.stringify(opinion));
  }, [hydrated, opinion, storageKey]);

  useEffect(() => {
    if (!edges.length) return;
    const controller = new AbortController();
    fetch("/api/edge-tracking", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify({
        edges: edges.map((edge) => ({
          matchId,
          edgeType: edge.type,
          signalStrength: edge.signalStrength,
          systemProbability: edge.systemProbability,
          predictedOutcome: edge.predictedOutcome,
          relatedMarket: edge.oddsComparison.market,
          bookmakerOdds: edge.oddsComparison.odds || null,
          impliedProbability: edge.oddsComparison.impliedProbability || null,
          edgePercent: edge.edgePercent,
          dataQualityScore: edge.dataQualityScore,
          modelVersion: edge.modelVersion,
          featureSnapshot: JSON.stringify(edge.featureSnapshot)
        }))
      })
    }).catch(() => {
      // Tracking is helpful for validation, but the match page should stay usable if persistence fails.
    });
    return () => controller.abort();
  }, [edges, matchId]);

  const disagreement = buildDisagreement(topEdge, opinion);

  return (
    <section className="space-y-5">
      <section className="terminal-card border-terminal-green/50 p-5 shadow-[0_18px_70px_rgba(34,197,94,0.12)]">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="metric-label">Betting Edge Finder v0.9</p>
            <h2 className="mt-1 text-3xl font-semibold">Найденные закономерности</h2>
            <p className="mt-2 max-w-3xl text-sm text-terminal-muted">
              Система ищет потенциальные преимущества в матче, отдельно показывает силу сигнала, вероятность модели и качество данных.
              Это не прогноз и не рекомендация к ставке. Найденные закономерности автоматически попадают в трекинг результатов.
            </p>
          </div>
          {topEdge && (
            <div className="min-w-[240px] rounded border border-terminal-green/30 bg-terminal-bg p-4">
              <p className="metric-label">Главный сигнал</p>
              <p className="mt-2 text-lg font-semibold">{topEdge.shortSummary}</p>
              <p className="mt-1 text-sm text-terminal-muted">Качество данных: {topEdge.dataQualityScore}/100</p>
              <div className="mt-3 h-3 rounded bg-white/10">
                <div className="h-3 rounded bg-terminal-green" style={{ width: `${topEdge.signalStrength}%` }} />
              </div>
            </div>
          )}
        </div>

        <div className="mt-5 grid gap-4 xl:grid-cols-5">
          {edges.map((edge) => (
            <div key={edge.id} className="rounded border border-terminal-border bg-terminal-bg p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="metric-label">{edge.type}</p>
                  <h3 className="mt-1 font-semibold">{edge.title}</h3>
                </div>
                <SourceBadge value={edge.source} />
              </div>
              <div className="mt-4 flex items-end justify-between gap-3">
                <div>
                  <p className="metric-label">Сила сигнала</p>
                  <p className="text-4xl font-semibold text-terminal-green">{edge.signalStrength}%</p>
                </div>
                <span className="rounded border border-terminal-border px-2 py-1 text-xs text-terminal-muted">уверенность: {edge.confidence}</span>
              </div>
              <div className="mt-3 h-2 rounded bg-white/10">
                <div className="h-2 rounded bg-terminal-green" style={{ width: `${edge.signalStrength}%` }} />
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                <MetricMini label="Вероятность системы" value={`${edge.systemProbability}%`} tone="green" />
                <MetricMini label="Качество данных" value={`${edge.dataQualityScore}/100`} tone={edge.dataQualityScore >= 50 ? "green" : "yellow"} />
                <MetricMini label="Вероятность рынка" value={edge.impliedProbability ? `${edge.impliedProbability}%` : "нет"} />
                <MetricMini label="Преимущество" value={`${edge.edgePercent > 0 ? "+" : ""}${edge.edgePercent}%`} tone={edge.edgePercent > 0 ? "green" : "yellow"} />
              </div>
              <p className="mt-3 text-sm text-terminal-muted">{edge.why}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="terminal-card overflow-hidden">
        <div className="border-b border-terminal-border p-5">
          <p className="metric-label">Почему система так считает</p>
          <h2 className="mt-1 text-2xl font-semibold">Подробная карта факторов</h2>
        </div>
        <div className="space-y-5 p-5">
          {edges.map((edge) => (
            <div key={`${edge.id}-details`} className="rounded border border-terminal-border bg-terminal-bg">
              <div className="grid gap-4 border-b border-terminal-border p-4 lg:grid-cols-[1fr_1fr]">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-lg font-semibold">{edge.shortSummary}</h3>
                    <SourceBadge value={edge.source} />
                  </div>
                  <p className="mt-2 text-sm text-terminal-muted">{edge.why}</p>
                </div>
                <div className="grid gap-3 text-sm md:grid-cols-2">
                  <MiniList title="Факторы за" items={edge.factorsFor} tone="positive" />
                  <MiniList title="Факторы против" items={edge.factorsAgainst} tone="risk" />
                </div>
              </div>
              <div className="grid gap-3 border-b border-terminal-border p-4 text-sm md:grid-cols-5">
                <MetricMini label="Сила сигнала" value={`${edge.signalStrength}%`} tone="green" />
                <MetricMini label="Вероятность системы" value={`${edge.systemProbability}%`} tone="green" />
                <MetricMini label="Вероятность рынка" value={edge.impliedProbability ? `${edge.impliedProbability}%` : "нет"} />
                <MetricMini label="Преимущество" value={`${edge.edgePercent > 0 ? "+" : ""}${edge.edgePercent}%`} tone={edge.edgePercent > 0 ? "green" : "yellow"} />
                <MetricMini label="Качество данных" value={`${edge.dataQualityScore}/100`} tone={edge.dataQualityScore >= 50 ? "green" : "yellow"} />
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[860px] text-left text-sm">
                  <thead className="text-xs uppercase text-terminal-muted">
                    <tr>
                      <th className="px-4 py-3">Фактор</th>
                      <th className="px-4 py-3">Team A</th>
                      <th className="px-4 py-3">Team B</th>
                      <th className="px-4 py-3">Влияние</th>
                      <th className="px-4 py-3">Источник</th>
                    </tr>
                  </thead>
                  <tbody>
                    {edge.details.map((detail) => (
                      <tr key={`${edge.id}-${detail.factor}`} className="border-t border-terminal-border">
                        <td className="px-4 py-3 font-medium">{detail.factor}</td>
                        <td className="px-4 py-3">{detail.teamA}</td>
                        <td className="px-4 py-3">{detail.teamB}</td>
                        <td className="px-4 py-3 text-terminal-muted">{detail.impact}</td>
                        <td className="px-4 py-3"><SourceBadge value={detail.source} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="border-t border-terminal-border p-4">
                <p className="metric-label">Feature Snapshot · {edge.modelVersion}</p>
                <div className="mt-3 grid gap-2 md:grid-cols-2 xl:grid-cols-3">
                  {edge.featureSnapshot.map((feature) => (
                    <div key={`${edge.id}-${feature.name}`} className="rounded border border-terminal-border bg-terminal-bg p-3 text-sm">
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-medium">{feature.name}</p>
                        <SourceBadge value={feature.source} />
                      </div>
                      <p className="mt-2 text-terminal-muted">Значение: {feature.value}</p>
                      <p className="mt-1 text-xs text-terminal-muted">Вес: {feature.weight} · влияние: {impactLabel(feature.impact)}</p>
                      {feature.note && <p className="mt-1 text-xs text-terminal-muted">{feature.note}</p>}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
        <section className="terminal-card overflow-hidden">
          <div className="border-b border-terminal-border p-5">
            <p className="metric-label">Подготовка к будущим коэффициентам</p>
            <h2 className="mt-1 text-2xl font-semibold">Сравнение с коэффициентами букмекеров</h2>
            <p className="mt-2 text-sm text-terminal-muted">Теперь рынок сравнивается с вероятностью системы, а не с силой сигнала. Это база для будущей калибровки и backtesting.</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[780px] text-left text-sm">
              <thead className="text-xs uppercase text-terminal-muted">
                <tr>
                  <th className="px-4 py-3">Рынок</th>
                  <th className="px-4 py-3">Коэффициент</th>
                  <th className="px-4 py-3">Вероятность рынка</th>
                  <th className="px-4 py-3">Вероятность системы</th>
                  <th className="px-4 py-3">Преимущество</th>
                  <th className="px-4 py-3">EV</th>
                  <th className="px-4 py-3">Качество</th>
                  <th className="px-4 py-3">Статус</th>
                </tr>
              </thead>
              <tbody>
                {edges.map((edge) => (
                  <tr key={`${edge.id}-odds`} className="border-t border-terminal-border">
                    <td className="px-4 py-3 font-medium">{edge.oddsComparison.market}</td>
                    <td className="px-4 py-3">{edge.oddsComparison.odds ? edge.oddsComparison.odds.toFixed(2) : "нет данных"}</td>
                    <td className="px-4 py-3">{edge.oddsComparison.impliedProbability}%</td>
                    <td className="px-4 py-3 text-terminal-green">{edge.oddsComparison.systemProbability}%</td>
                    <td className={edge.oddsComparison.edgePercent > 0 ? "px-4 py-3 text-terminal-green" : "px-4 py-3 text-terminal-yellow"}>
                      {edge.oddsComparison.edgePercent > 0 ? "+" : ""}{edge.oddsComparison.edgePercent}%
                    </td>
                    <td className={edge.oddsComparison.expectedValue > 0 ? "px-4 py-3 text-terminal-green" : "px-4 py-3 text-terminal-yellow"}>
                      {edge.oddsComparison.expectedValue > 0 ? "+" : ""}{edge.oddsComparison.expectedValue}%
                    </td>
                    <td className="px-4 py-3">{edge.oddsComparison.dataQualityScore}/100</td>
                    <td className="px-4 py-3"><SourceBadge value={edge.oddsComparison.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="terminal-card p-5">
          <p className="metric-label">User Validation</p>
          <h2 className="mt-1 text-2xl font-semibold">Мое мнение vs система</h2>
          <div className="mt-4 rounded border border-terminal-border bg-terminal-bg p-4">
            <p className="metric-label">Система</p>
            <p className="mt-1 font-semibold">{topEdge?.shortSummary ?? "Сильная закономерность не найдена"}</p>
            <p className="mt-2 text-sm text-terminal-muted">{topEdge?.why ?? "Недостаточно данных."}</p>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {opinionOptions.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setOpinion((current) => ({ ...current, opinion: option }))}
                className={`rounded border px-3 py-2 text-sm ${
                  opinion.opinion === option
                    ? "border-terminal-green bg-terminal-green/15 text-terminal-green"
                    : "border-terminal-border text-terminal-muted hover:text-terminal-text"
                }`}
              >
                {option}
              </button>
            ))}
          </div>
          <label className="mt-4 block">
            <span className="metric-label">Я думаю иначе, потому что...</span>
            <textarea
              value={opinion.comment}
              onChange={(event) => setOpinion((current) => ({ ...current, comment: event.target.value }))}
              rows={4}
              className="mt-2 w-full rounded border border-terminal-border bg-terminal-bg p-3 text-sm outline-none focus:border-terminal-green"
              placeholder="Например: соперник может забанить карту, состав не подтвержден, линия уже ушла..."
            />
          </label>
          <div className="mt-4 rounded border border-terminal-border bg-terminal-bg p-4 text-sm">
            <p className="metric-label">Сравнение мнений</p>
            <p className="mt-2"><span className="text-terminal-muted">Пользователь:</span> {opinion.opinion}</p>
            <p className="mt-2 text-terminal-muted">{disagreement}</p>
            {opinion.comment && <p className="mt-2 text-terminal-text">Комментарий: {opinion.comment}</p>}
          </div>
        </section>
      </section>

      <section className="terminal-card p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="metric-label">Контроль перед решением</p>
            <h2 className="mt-1 text-2xl font-semibold">Что проверить перед ставкой</h2>
            <p className="mt-2 max-w-3xl text-sm text-terminal-muted">Этот чек-лист нужен, чтобы закономерность не воспринималась как прямой совет.</p>
          </div>
          <SourceBadge value="Fallback" />
        </div>
        <div className="mt-4 grid gap-3 text-sm text-terminal-muted md:grid-cols-2 lg:grid-cols-4">
          {checklist.map((item) => (
            <div key={item} className="rounded border border-terminal-border bg-terminal-bg p-3">□ {item}</div>
          ))}
        </div>
      </section>
    </section>
  );
}

function MiniList({ title, items, tone }: { title: string; items: string[]; tone: "positive" | "risk" }) {
  return (
    <div>
      <h4 className={tone === "positive" ? "font-semibold text-terminal-green" : "font-semibold text-terminal-yellow"}>{title}</h4>
      <ul className="mt-2 space-y-1 text-terminal-muted">
        {items.map((item) => <li key={item}>• {item}</li>)}
      </ul>
    </div>
  );
}

function MetricMini({ label, value, tone = "muted" }: { label: string; value: string; tone?: "green" | "yellow" | "muted" }) {
  const valueClass = tone === "green" ? "text-terminal-green" : tone === "yellow" ? "text-terminal-yellow" : "text-terminal-text";
  return (
    <div className="rounded border border-terminal-border bg-terminal-bg p-3">
      <p className="metric-label">{label}</p>
      <p className={`mt-1 font-semibold ${valueClass}`}>{value}</p>
    </div>
  );
}

function SourceBadge({ value }: { value: EdgeSource | EdgeFeatureSource }) {
  const className =
    value === "Real"
      ? "border-terminal-green/40 bg-terminal-green/10 text-terminal-green"
      : value === "Demo"
        ? "border-terminal-yellow/40 bg-terminal-yellow/10 text-terminal-yellow"
        : value === "Fallback"
          ? "border-terminal-red/40 bg-terminal-red/10 text-terminal-red"
          : "border-terminal-red/40 bg-terminal-red/10 text-terminal-red";
  const label = value === "Real" ? "Реальные данные" : value === "Demo" ? "Демо-данные" : value === "Fallback" ? "Fallback" : "Недостаточно данных";
  return <span className={`inline-flex rounded border px-2 py-1 text-xs font-medium ${className}`}>{label}</span>;
}

function impactLabel(value: "positive" | "negative" | "neutral") {
  if (value === "positive") return "за";
  if (value === "negative") return "против";
  return "нейтрально";
}

function buildDisagreement(edge: BettingEdge | undefined, opinion: OpinionState) {
  if (!edge) return "Система не выделила сильную закономерность, поэтому сравнивать пока нечего.";
  if (opinion.opinion === "Согласен с системой") return "Расхождения нет: пользователь принимает главный сигнал системы как гипотезу для проверки.";
  if (opinion.opinion === "Частично согласен") return `Есть частичное расхождение: система выделяет ${edge.title}, но пользователь хочет проверить дополнительные условия.`;
  return `Есть расхождение: система выделяет ${edge.title}, а пользователь не согласен с этой гипотезой.`;
}
