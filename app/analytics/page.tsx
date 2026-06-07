import { getAnalytics } from "@/src/lib/data";
import { gameLabel, tagLabel } from "@/src/lib/display";

export default async function AnalyticsPage() {
  const entries = await getAnalytics();
  const settled = entries.filter((entry) => entry.result === "won" || entry.result === "lost");
  const wins = entries.filter((entry) => entry.result === "won").length;
  const stake = entries.reduce((sum, entry) => sum + (entry.stake ?? 0), 0);
  const profit = entries.reduce((sum, entry) => sum + (entry.profitLoss ?? 0), 0);
  const winrate = settled.length ? (wins / settled.length) * 100 : 0;
  const roi = stake ? (profit / stake) * 100 : 0;

  const byGame = group(entries, (entry) => gameLabel(entry.match.game));
  const byBookmaker = group(entries, (entry) => entry.bookmaker?.name ?? "Ручной ввод");
  const byTag = new Map<string, number>();
  for (const entry of entries) {
    const tags = parseTags(entry.tags);
    for (const tag of tags) byTag.set(tagLabel(String(tag)), (byTag.get(tagLabel(String(tag))) ?? 0) + 1);
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="metric-label">Сводка по журналу решений</p>
        <h1 className="text-3xl font-semibold">Аналитика</h1>
      </div>
      <section className="grid gap-4 md:grid-cols-4">
        <Metric label="Записей" value={entries.length.toString()} />
        <Metric label="Доля выигрышей" value={`${winrate.toFixed(1)}%`} />
        <Metric label="ROI" value={`${roi.toFixed(1)}%`} />
        <Metric label="Финансовый итог" value={profit.toFixed(2)} />
      </section>
      <section className="grid gap-6 lg:grid-cols-3">
        <Breakdown title="По дисциплинам" rows={Array.from(byGame.entries())} />
        <Breakdown title="По букмекерам" rows={Array.from(byBookmaker.entries())} />
        <Breakdown title="По тегам" rows={Array.from(byTag.entries())} />
      </section>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="terminal-card p-5">
      <p className="metric-label">{label}</p>
      <p className="mt-2 text-3xl font-semibold">{value}</p>
    </div>
  );
}

function Breakdown({ title, rows }: { title: string; rows: [string, number][] }) {
  return (
    <div className="terminal-card p-5">
      <h2 className="text-xl font-semibold">{title}</h2>
      <div className="mt-4 space-y-3">
        {rows.length === 0 && <div className="text-sm text-terminal-muted">Данных пока нет.</div>}
        {rows.map(([label, count]) => (
          <div key={label} className="flex justify-between border-b border-terminal-border pb-2 text-sm last:border-0">
            <span>{label}</span>
            <span className="text-terminal-muted">{count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function group<T>(items: T[], keyFn: (item: T) => string) {
  const map = new Map<string, number>();
  for (const item of items) map.set(keyFn(item), (map.get(keyFn(item)) ?? 0) + 1);
  return map;
}

function parseTags(value: string) {
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}
