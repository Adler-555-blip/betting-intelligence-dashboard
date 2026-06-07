import { format } from "date-fns";
import { getJournalData } from "@/src/lib/data";
import { JournalForm } from "@/src/components/JournalForm";

export default async function JournalPage() {
  const { entries, matches, bookmakers } = await getJournalData();
  const matchOptions = matches.map((match) => ({ id: match.id, label: `${match.teamA.name} vs ${match.teamB.name}` }));

  return (
    <div className="space-y-6">
      <div>
        <p className="metric-label">Analytical decisions</p>
        <h1 className="text-3xl font-semibold">Bet Journal</h1>
      </div>
      <JournalForm matches={matchOptions} bookmakers={bookmakers} />
      <div className="terminal-card overflow-hidden">
        <table className="w-full min-w-[900px] text-left text-sm">
          <thead className="text-xs uppercase text-terminal-muted">
            <tr>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Match</th>
              <th className="px-4 py-3">Outcome</th>
              <th className="px-4 py-3">Bookmaker</th>
              <th className="px-4 py-3">Odds</th>
              <th className="px-4 py-3">Confidence</th>
              <th className="px-4 py-3">Result</th>
              <th className="px-4 py-3">P/L</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry) => (
              <tr key={entry.id} className="border-t border-terminal-border">
                <td className="px-4 py-3 text-terminal-muted">{format(entry.createdAt, "MMM d HH:mm")}</td>
                <td className="px-4 py-3">{entry.match.teamA.name} vs {entry.match.teamB.name}</td>
                <td className="px-4 py-3">{entry.selectedOutcome}</td>
                <td className="px-4 py-3">{entry.bookmaker?.name ?? "Manual"}</td>
                <td className="px-4 py-3">{entry.odds.toFixed(2)}</td>
                <td className="px-4 py-3">{entry.confidence}/5</td>
                <td className="px-4 py-3">{entry.result}</td>
                <td className="px-4 py-3">{entry.profitLoss ?? "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
