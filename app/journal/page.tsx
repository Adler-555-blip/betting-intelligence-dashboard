import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { getJournalData } from "@/src/lib/data";
import { JournalForm } from "@/src/components/JournalForm";
import { resultLabel } from "@/src/lib/display";

export default async function JournalPage() {
  const { entries, matches, bookmakers } = await getJournalData();
  const matchOptions = matches.map((match) => ({ id: match.id, label: `${match.teamA.name} против ${match.teamB.name}` }));

  return (
    <div className="space-y-6">
      <div>
        <p className="metric-label">Журнал ручных решений</p>
        <h1 className="text-3xl font-semibold">Журнал решений</h1>
      </div>
      <JournalForm matches={matchOptions} bookmakers={bookmakers} />
      <div className="terminal-card overflow-hidden">
        <table className="w-full min-w-[900px] text-left text-sm">
          <thead className="text-xs uppercase text-terminal-muted">
            <tr>
              <th className="px-4 py-3">Дата</th>
              <th className="px-4 py-3">Матч</th>
              <th className="px-4 py-3">Исход</th>
              <th className="px-4 py-3">Букмекер</th>
              <th className="px-4 py-3">Коэф.</th>
              <th className="px-4 py-3">Уверенность</th>
              <th className="px-4 py-3">Результат</th>
              <th className="px-4 py-3">Итог</th>
            </tr>
          </thead>
          <tbody>
            {entries.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-10 text-center text-terminal-muted">
                  Записей пока нет. Добавьте первое решение через форму выше.
                </td>
              </tr>
            )}
            {entries.map((entry) => (
              <tr key={entry.id} className="border-t border-terminal-border">
                <td className="px-4 py-3 text-terminal-muted">{format(entry.createdAt, "d MMM HH:mm", { locale: ru })}</td>
                <td className="px-4 py-3">{entry.match.teamA.name} против {entry.match.teamB.name}</td>
                <td className="px-4 py-3">{entry.selectedOutcome}</td>
                <td className="px-4 py-3">{entry.bookmaker?.name ?? "Ручной ввод"}</td>
                <td className="px-4 py-3">{entry.odds.toFixed(2)}</td>
                <td className="px-4 py-3">{entry.confidence}/5</td>
                <td className="px-4 py-3">{resultLabel(entry.result)}</td>
                <td className="px-4 py-3">{entry.profitLoss ?? "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
