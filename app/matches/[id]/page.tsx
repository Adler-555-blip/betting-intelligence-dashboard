import { notFound } from "next/navigation";
import { format } from "date-fns";
import { getJournalData, getMatch } from "@/src/lib/data";
import { chartSeries, latestOddsRows } from "@/src/lib/odds";
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
  const matchOptions = journalData.matches.map((item) => ({ id: item.id, label: `${item.teamA.name} vs ${item.teamB.name}` }));

  return (
    <div className="space-y-6">
      <section className="terminal-card p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="metric-label">{match.game} / {match.tournament.name}</p>
            <h1 className="mt-2 text-3xl font-semibold">{match.teamA.name} vs {match.teamB.name}</h1>
            <div className="mt-3 flex flex-wrap gap-3 text-sm text-terminal-muted">
              <span>{format(match.startTime, "MMM d, yyyy HH:mm")}</span>
              <span>{match.format}</span>
              <StatusPill value={match.status} />
              <span>Importance {match.importanceScore}</span>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="terminal-card p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold">Odds Movement</h2>
            <span className="metric-label">Team A winner market</span>
          </div>
          <OddsChart data={series} bookmakers={bookmakers} />
        </div>
        <div className="terminal-card p-5">
          <h2 className="text-xl font-semibold">Market Signals</h2>
          <div className="mt-4 space-y-3">
            {match.signals.length === 0 && (
              <div className="rounded border border-terminal-border bg-terminal-bg p-3 text-sm text-terminal-muted">
                No active signals for this match. Keep monitoring odds movement and news context.
              </div>
            )}
            {match.signals.map((signal) => (
              <div key={signal.id} className="rounded border border-terminal-border bg-terminal-bg p-3">
                <div className="flex justify-between gap-3">
                  <strong>{signal.title}</strong>
                  <span className="metric-label">{signal.severity}</span>
                </div>
                <p className="mt-2 text-sm text-terminal-muted">{signal.explanation}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="terminal-card overflow-hidden">
        <div className="border-b border-terminal-border p-5">
          <h2 className="text-xl font-semibold">Odds Comparison</h2>
        </div>
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="text-xs uppercase text-terminal-muted">
            <tr>
              <th className="px-4 py-3">Bookmaker</th>
              <th className="px-4 py-3">{match.teamA.name}</th>
              <th className="px-4 py-3">{match.teamB.name}</th>
              <th className="px-4 py-3">Draw</th>
              <th className="px-4 py-3">Last updated</th>
              <th className="px-4 py-3">Change</th>
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
          <h2 className="text-xl font-semibold">Team Notes</h2>
          <p className="mt-3 text-sm text-terminal-muted">Track roster, patch, map pool, draft, travel, and motivation context manually here in the next iteration.</p>
        </div>
        <div className="terminal-card p-5">
          <h2 className="text-xl font-semibold">News / Context</h2>
          <div className="mt-3 space-y-3">
            {match.newsItems.map((item) => (
              <a key={item.id} href={item.url} className="block text-sm hover:text-terminal-green">
                {item.title}
                <span className="block text-xs text-terminal-muted">{item.source} / impact {item.impactScore ?? "-"}</span>
              </a>
            ))}
          </div>
        </div>
        <div className="terminal-card p-5">
          <h2 className="text-xl font-semibold">Decision Notes</h2>
          <p className="mt-3 text-sm text-terminal-muted">{match.decisionNotes ?? "No saved match-level notes yet."}</p>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Add Journal Decision</h2>
        <JournalForm matches={matchOptions} bookmakers={journalData.bookmakers} defaultMatchId={match.id} />
      </section>
    </div>
  );
}
