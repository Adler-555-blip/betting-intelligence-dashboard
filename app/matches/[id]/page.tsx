import { notFound } from "next/navigation";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { getJournalData, getMatch } from "@/src/lib/data";
import { chartSeries, latestOddsRows } from "@/src/lib/odds";
import { gameLabel, severityLabel, signalTypeLabel } from "@/src/lib/display";
import { OddsChart } from "@/src/components/OddsChart";
import { StatusPill } from "@/src/components/StatusPill";
import { JournalForm } from "@/src/components/JournalForm";

export default async function MatchPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [match, journalData] = await Promise.all([getMatch(id), getJournalData()]);
  if (!match) notFound();

  const oddsRows = latestOddsRows(match.oddsSnapshots);
  const bookmakers = Array.from(new Set(match.oddsSnapshots.map((snapshot) => snapshot.bookmaker.name)));
  const series = chartSeries(match.oddsSnapshots);
  const matchOptions = journalData.matches.map((item) => ({ id: item.id, label: `${item.teamA.name} против ${item.teamB.name}` }));

  return (
    <div className="space-y-6">
      <section className="terminal-card p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="metric-label">{gameLabel(match.game)} / {match.tournament.name}</p>
            <h1 className="mt-2 text-3xl font-semibold">{match.teamA.name} против {match.teamB.name}</h1>
            <div className="mt-3 flex flex-wrap gap-3 text-sm text-terminal-muted">
              <span>{format(match.startTime, "d MMMM yyyy, HH:mm", { locale: ru })}</span>
              <span>{match.format}</span>
              <StatusPill value={match.status} />
              <span>Важность {match.importanceScore}/100</span>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="terminal-card p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold">Движение коэффициента</h2>
            <span className="metric-label">Рынок: победитель матча</span>
          </div>
          <OddsChart data={series} bookmakers={bookmakers} />
        </div>
        <div className="terminal-card p-5">
          <h2 className="text-xl font-semibold">Рыночные сигналы</h2>
          <div className="mt-4 space-y-3">
            {match.signals.length === 0 && (
              <div className="rounded border border-terminal-border bg-terminal-bg p-3 text-sm text-terminal-muted">
                Активных сигналов нет. Продолжайте следить за движением линии и новостным контекстом.
              </div>
            )}
            {match.signals.map((signal) => (
              <div key={signal.id} className="rounded border border-terminal-border bg-terminal-bg p-3">
                <div className="flex justify-between gap-3">
                  <strong>{signal.title || signalTypeLabel(signal.type)}</strong>
                  <span className="metric-label">важность: {severityLabel(signal.severity)}</span>
                </div>
                <p className="mt-2 text-sm text-terminal-muted">{signal.explanation}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="terminal-card overflow-hidden">
        <div className="border-b border-terminal-border p-5">
          <h2 className="text-xl font-semibold">Сравнение коэффициентов</h2>
        </div>
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="text-xs uppercase text-terminal-muted">
            <tr>
              <th className="px-4 py-3">Букмекер</th>
              <th className="px-4 py-3">{match.teamA.name}</th>
              <th className="px-4 py-3">{match.teamB.name}</th>
              <th className="px-4 py-3">Ничья</th>
              <th className="px-4 py-3">Обновлено</th>
              <th className="px-4 py-3">Изменение</th>
            </tr>
          </thead>
          <tbody>
            {oddsRows.map((row) => (
              <tr key={row.bookmakerSlug} className="border-t border-terminal-border">
                <td className="px-4 py-3">{row.bookmaker}</td>
                <td className="px-4 py-3 text-terminal-green">{row.teamA?.toFixed(2) ?? "-"}</td>
                <td className="px-4 py-3 text-terminal-green">{row.teamB?.toFixed(2) ?? "-"}</td>
                <td className="px-4 py-3 text-terminal-muted">-</td>
                <td className="px-4 py-3 text-terminal-muted">{row.lastUpdated ? format(row.lastUpdated, "HH:mm") : "-"}</td>
                <td className="px-4 py-3">{row.changeA >= 0 ? "+" : ""}{row.changeA.toFixed(2)} / {row.changeB >= 0 ? "+" : ""}{row.changeB.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        <div className="terminal-card p-5">
          <h2 className="text-xl font-semibold">Заметки по командам</h2>
          <p className="mt-3 text-sm text-terminal-muted">
            Составы стабильны, критичных замен в демо-данных нет. Перед реальным решением проверьте карты, форму и последние новости.
          </p>
        </div>
        <div className="terminal-card p-5">
          <h2 className="text-xl font-semibold">Новости и контекст</h2>
          <div className="mt-3 space-y-3">
            {match.newsItems.length === 0 && (
              <div className="text-sm text-terminal-muted">Для этого матча пока нет новостей в демо-наборе.</div>
            )}
            {match.newsItems.map((item) => (
              <a key={item.id} href={item.url} className="block text-sm hover:text-terminal-green">
                {item.title}
                <span className="block text-xs text-terminal-muted">{item.source} / влияние {item.impactScore ?? "-"}</span>
              </a>
            ))}
          </div>
        </div>
        <div className="terminal-card p-5">
          <h2 className="text-xl font-semibold">Заметки к решению</h2>
          <p className="mt-3 text-sm text-terminal-muted">{match.decisionNotes ?? "Заметок по этому матчу пока нет."}</p>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Добавить решение в журнал</h2>
        <JournalForm matches={matchOptions} bookmakers={journalData.bookmakers} defaultMatchId={match.id} />
      </section>
    </div>
  );
}
