"use client";

import { useMemo, useState } from "react";
import type { EdgeStatus, RateSummary } from "@/src/lib/edgeTracking";

type EdgeTrackingViewEntry = {
  id: string;
  matchId: string;
  edgeType: string;
  signalStrength: number;
  predictedOutcome: string;
  relatedMarket: string;
  bookmakerOdds: number | null;
  impliedProbability: number | null;
  actualOutcome: string | null;
  status: EdgeStatus;
  profitLoss: number | null;
  createdAt: string;
  resolvedAt: string | null;
  match: {
    game: string;
    teamA: string;
    teamB: string;
    tournament: string;
  };
};

type EdgeTrackingViewStats = {
  entries: EdgeTrackingViewEntry[];
  overall: RateSummary;
  byType: RateSummary[];
  byStrengthRange: RateSummary[];
  bestTypes: RateSummary[];
  weakestTypes: RateSummary[];
};

const statusLabels: Record<EdgeStatus, string> = {
  pending: "Ожидает результата",
  hit: "Hit",
  miss: "Miss",
  void: "Void"
};

const statuses: EdgeStatus[] = ["pending", "hit", "miss", "void"];

export function EdgeTrackingDashboard({ stats }: { stats: EdgeTrackingViewStats }) {
  const [entries, setEntries] = useState(stats.entries);
  const [savingId, setSavingId] = useState<string | null>(null);

  const liveStats = useMemo(() => buildStats(entries), [entries]);

  async function updateEntry(id: string, patch: Partial<EdgeTrackingViewEntry>) {
    const nextEntries = entries.map((entry) => entry.id === id ? { ...entry, ...patch } : entry);
    setEntries(nextEntries);
    const changed = nextEntries.find((entry) => entry.id === id);
    if (!changed) return;

    setSavingId(id);
    await fetch("/api/edge-tracking", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id,
        status: changed.status,
        actualOutcome: changed.actualOutcome,
        profitLoss: changed.profitLoss
      })
    }).finally(() => setSavingId(null));
  }

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-2">
        <p className="metric-label">Трекинг закономерностей v0.7</p>
        <h1 className="text-3xl font-semibold">Учет закономерностей и результатов</h1>
        <p className="max-w-3xl text-sm text-terminal-muted">
          Здесь видно, какие закономерности система находила, чем они закончились и какие типы сигналов реально подтверждаются чаще.
          Pending-записи создаются автоматически при открытии Match Page.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard title="Общий hit rate" value={`${liveStats.overall.hitRate}%`} caption={`${liveStats.overall.hits}/${liveStats.overall.resolved} resolved`} />
        <MetricCard title="Всего edges" value={String(liveStats.overall.total)} caption="включая pending и void" />
        <MetricCard title="Pending" value={String(entries.filter((entry) => entry.status === "pending").length)} caption="ждут результата" />
        <MetricCard title="Void" value={String(liveStats.overall.voids)} caption="исключены из hit rate" />
      </section>

      <section className="grid gap-5 lg:grid-cols-3">
        <SummaryPanel title="Hit rate по типам" items={liveStats.byType} />
        <SummaryPanel title="Hit rate по силе сигнала" items={liveStats.byStrengthRange} />
        <section className="terminal-card p-5">
          <p className="metric-label">Рейтинг типов</p>
          <h2 className="mt-1 text-xl font-semibold">Сильные и слабые edges</h2>
          <div className="mt-4 grid gap-4">
            <MiniRanking title="Самые успешные" items={liveStats.bestTypes} tone="positive" />
            <MiniRanking title="Самые слабые" items={liveStats.weakestTypes} tone="risk" />
          </div>
        </section>
      </section>

      <section className="terminal-card overflow-hidden">
        <div className="border-b border-terminal-border p-5">
          <p className="metric-label">Журнал edges</p>
          <h2 className="mt-1 text-2xl font-semibold">Найденные закономерности</h2>
          <p className="mt-2 text-sm text-terminal-muted">
            Обновляй фактический исход и статус после матча. Hit rate пересчитывается сразу на странице и сохраняется в SQLite.
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1180px] text-left text-sm">
            <thead className="text-xs uppercase text-terminal-muted">
              <tr>
                <th className="px-4 py-3">Матч</th>
                <th className="px-4 py-3">Edge</th>
                <th className="px-4 py-3">Сила</th>
                <th className="px-4 py-3">Ожидание</th>
                <th className="px-4 py-3">Рынок</th>
                <th className="px-4 py-3">Кэф / вероятность</th>
                <th className="px-4 py-3">Факт</th>
                <th className="px-4 py-3">Статус</th>
                <th className="px-4 py-3">P/L</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => (
                <tr key={entry.id} className="border-t border-terminal-border align-top">
                  <td className="px-4 py-3">
                    <p className="font-medium">{entry.match.teamA} против {entry.match.teamB}</p>
                    <p className="mt-1 text-xs text-terminal-muted">{entry.match.tournament} · {gameLabel(entry.match.game)}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium">{entry.edgeType}</p>
                    <p className="mt-1 text-xs text-terminal-muted">создано {formatDate(entry.createdAt)}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-terminal-green">{entry.signalStrength}%</span>
                    <div className="mt-2 h-2 w-20 rounded bg-white/10">
                      <div className="h-2 rounded bg-terminal-green" style={{ width: `${entry.signalStrength}%` }} />
                    </div>
                  </td>
                  <td className="px-4 py-3 max-w-[210px] text-terminal-muted">{entry.predictedOutcome}</td>
                  <td className="px-4 py-3">{entry.relatedMarket}</td>
                  <td className="px-4 py-3 text-terminal-muted">
                    {entry.bookmakerOdds ? entry.bookmakerOdds.toFixed(2) : "нет"}
                    <br />
                    {entry.impliedProbability ? `${entry.impliedProbability}%` : "нет"}
                  </td>
                  <td className="px-4 py-3">
                    <textarea
                      value={entry.actualOutcome ?? ""}
                      onChange={(event) => updateEntry(entry.id, { actualOutcome: event.target.value })}
                      rows={2}
                      className="w-56 rounded border border-terminal-border bg-terminal-bg p-2 text-xs outline-none focus:border-terminal-green"
                      placeholder="Что произошло по факту?"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={entry.status}
                      onChange={(event) => updateEntry(entry.id, { status: event.target.value as EdgeStatus, resolvedAt: event.target.value === "pending" ? null : new Date().toISOString() })}
                      className="rounded border border-terminal-border bg-terminal-bg p-2 text-xs outline-none focus:border-terminal-green"
                    >
                      {statuses.map((status) => <option key={status} value={status}>{statusLabels[status]}</option>)}
                    </select>
                    {savingId === entry.id && <p className="mt-1 text-xs text-terminal-muted">сохранение...</p>}
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="number"
                      value={entry.profitLoss ?? ""}
                      onChange={(event) => updateEntry(entry.id, { profitLoss: event.target.value === "" ? null : Number(event.target.value) })}
                      className="w-24 rounded border border-terminal-border bg-terminal-bg p-2 text-xs outline-none focus:border-terminal-green"
                      placeholder="0"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function MetricCard({ title, value, caption }: { title: string; value: string; caption: string }) {
  return (
    <section className="terminal-card p-5">
      <p className="metric-label">{title}</p>
      <p className="mt-2 text-4xl font-semibold text-terminal-green">{value}</p>
      <p className="mt-2 text-sm text-terminal-muted">{caption}</p>
    </section>
  );
}

function SummaryPanel({ title, items }: { title: string; items: RateSummary[] }) {
  return (
    <section className="terminal-card p-5">
      <p className="metric-label">Агрегация</p>
      <h2 className="mt-1 text-xl font-semibold">{title}</h2>
      <div className="mt-4 space-y-3">
        {items.length ? items.map((item) => (
          <RateRow key={item.label} item={item} />
        )) : <p className="text-sm text-terminal-muted">Недостаточно данных.</p>}
      </div>
    </section>
  );
}

function RateRow({ item }: { item: RateSummary }) {
  return (
    <div className="rounded border border-terminal-border bg-terminal-bg p-3">
      <div className="flex items-center justify-between gap-3">
        <p className="font-medium">{item.label}</p>
        <p className="text-terminal-green">{item.hitRate}%</p>
      </div>
      <div className="mt-2 h-2 rounded bg-white/10">
        <div className="h-2 rounded bg-terminal-green" style={{ width: `${item.hitRate}%` }} />
      </div>
      <p className="mt-2 text-xs text-terminal-muted">
        hit {item.hits} · miss {item.misses} · void {item.voids} · всего {item.total}
      </p>
    </div>
  );
}

function MiniRanking({ title, items, tone }: { title: string; items: RateSummary[]; tone: "positive" | "risk" }) {
  return (
    <div>
      <h3 className={tone === "positive" ? "font-semibold text-terminal-green" : "font-semibold text-terminal-yellow"}>{title}</h3>
      <div className="mt-2 space-y-2">
        {items.length ? items.map((item) => (
          <div key={`${title}-${item.label}`} className="flex items-center justify-between rounded border border-terminal-border bg-terminal-bg px-3 py-2 text-sm">
            <span>{item.label}</span>
            <span>{item.hitRate}%</span>
          </div>
        )) : <p className="text-sm text-terminal-muted">Пока нет resolved-записей.</p>}
      </div>
    </div>
  );
}

function buildStats(entries: EdgeTrackingViewEntry[]): EdgeTrackingViewStats {
  const byType = summarizeGroups(groupBy(entries, (entry) => entry.edgeType));
  const byStrengthRange = sortStrengthRanges(summarizeGroups(groupBy(entries, (entry) => strengthRange(entry.signalStrength))));
  const rankedTypes = byType.filter((item) => item.resolved > 0).sort((a, b) => b.hitRate - a.hitRate || b.resolved - a.resolved);
  return {
    entries,
    overall: summarize("Все закономерности", entries),
    byType,
    byStrengthRange,
    bestTypes: rankedTypes.slice(0, 3),
    weakestTypes: [...rankedTypes].reverse().slice(0, 3)
  };
}

function groupBy<T>(items: T[], keyGetter: (item: T) => string) {
  const groups = new Map<string, T[]>();
  for (const item of items) {
    const key = keyGetter(item);
    groups.set(key, [...(groups.get(key) ?? []), item]);
  }
  return groups;
}

function summarizeGroups(groups: Map<string, EdgeTrackingViewEntry[]>) {
  return Array.from(groups.entries()).map(([label, items]) => summarize(label, items));
}

function summarize(label: string, entries: EdgeTrackingViewEntry[]) {
  const hits = entries.filter((entry) => entry.status === "hit").length;
  const misses = entries.filter((entry) => entry.status === "miss").length;
  const voids = entries.filter((entry) => entry.status === "void").length;
  const resolved = hits + misses;
  return {
    label,
    total: entries.length,
    resolved,
    hits,
    misses,
    voids,
    hitRate: resolved ? Math.round((hits / resolved) * 100) : 0
  };
}

function strengthRange(value: number) {
  if (value >= 80) return "80-100";
  if (value >= 65) return "65-79";
  if (value >= 50) return "50-64";
  return "0-49";
}

function sortStrengthRanges(items: RateSummary[]) {
  const order = ["80-100", "65-79", "50-64", "0-49"];
  return [...items].sort((a, b) => order.indexOf(a.label) - order.indexOf(b.label));
}

function gameLabel(value: string) {
  if (value === "cs2") return "CS2";
  if (value === "dota2") return "Dota 2";
  if (value === "football") return "Футбол";
  return value;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("ru-RU", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }).format(new Date(value));
}
