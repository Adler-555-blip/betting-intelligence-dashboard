import { notFound } from "next/navigation";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { getJournalData, getMatch } from "@/src/lib/data";
import { chartSeries, latestOddsRows } from "@/src/lib/odds";
import { gameLabel, severityLabel, signalTypeLabel } from "@/src/lib/display";
import { getMatchIntelligence, type DataBadge, type TeamFormFactor } from "@/src/lib/matchIntelligence";
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
  const intelligence = await getMatchIntelligence(match);

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

      <section className="terminal-card p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="metric-label">Match Intelligence Engine v0.2</p>
            <h2 className="mt-1 text-2xl font-semibold">Ключевые факторы матча</h2>
            <p className="mt-2 max-w-3xl text-sm text-terminal-muted">
              Нейтральная сводка факторов без рекомендаций к ставке: форма, очные встречи, состав, дисциплинный фактор и движение линии.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <DataBadgeView value={intelligence.score.confidence === "high" ? "real" : intelligence.score.confidence === "medium" ? "demo" : "insufficient"} label={confidenceLabel(intelligence.score.confidence)} />
            {intelligence.score.partial && <DataBadgeView value="insufficient" label="Оценка частичная" />}
          </div>
        </div>

        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          <ScoreCard teamName={match.teamA.name} score={intelligence.score.teamA} breakdown={intelligence.score.breakdown.map((item) => ({ label: item.label, value: item.teamA, note: item.note }))} />
          <ScoreCard teamName={match.teamB.name} score={intelligence.score.teamB} breakdown={intelligence.score.breakdown.map((item) => ({ label: item.label, value: item.teamB, note: item.note }))} />
        </div>

        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          <TeamFactorCard factor={intelligence.teamA} />
          <TeamFactorCard factor={intelligence.teamB} />
        </div>

        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          <FactorList title="Факторы за" items={intelligence.factorsFor} tone="positive" />
          <FactorList title="Факторы против" items={intelligence.factorsAgainst} tone="risk" />
        </div>

        <div className="mt-5 grid gap-4 lg:grid-cols-3">
          <DataSummary title="Реальные данные" badge="real" items={intelligence.dataSummary.real} empty="Реальные источники пока не дали данных для этого матча." />
          <DataSummary title="Демо-данные" badge="demo" items={intelligence.dataSummary.demo} empty="Fallback не использовался." />
          <DataSummary title="Недостаточно данных" badge="insufficient" items={intelligence.dataSummary.insufficient} empty="Критичных пропусков данных нет." />
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="terminal-card p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-xl font-semibold">Составы</h2>
            <DataBadgeView value={intelligence.rosterBadge} />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <RosterList teamName={match.teamA.name} players={intelligence.teamARoster} />
            <RosterList teamName={match.teamB.name} players={intelligence.teamBRoster} />
          </div>
        </div>

        <div className="terminal-card p-5">
          <h2 className="text-xl font-semibold">Очные встречи</h2>
          <div className="mt-4 space-y-3">
            {intelligence.h2h.length === 0 && <EmptyState text="Недостаточно данных для расчета фактора." />}
            {intelligence.h2h.map((item) => (
              <div key={`${item.date}-${item.winner}`} className="rounded border border-terminal-border bg-terminal-bg p-3 text-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span>{format(new Date(item.date), "d MMM yyyy", { locale: ru })}</span>
                  <DataBadgeView value={item.badge} />
                </div>
                <div className="mt-2 text-terminal-muted">Счет серии: {item.score}. Победитель: <span className="text-terminal-text">{item.winner}</span></div>
                <div className="mt-1 text-xs text-terminal-muted">Источник: {item.source}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {match.game === "cs2" && (
        <section className="terminal-card overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-terminal-border p-5">
            <div>
              <h2 className="text-xl font-semibold">Карты</h2>
              <p className="mt-1 text-sm text-terminal-muted">Демо-статистика карт до подключения надежного CS2-источника.</p>
            </div>
            <DataBadgeView value="demo" label="Демо-статистика карт" />
          </div>
          <table className="w-full min-w-[880px] text-left text-sm">
            <thead className="text-xs uppercase text-terminal-muted">
              <tr>
                <th className="px-4 py-3">Карта</th>
                <th className="px-4 py-3">{match.teamA.name}: сыграно</th>
                <th className="px-4 py-3">{match.teamA.name}: winrate</th>
                <th className="px-4 py-3">{match.teamB.name}: сыграно</th>
                <th className="px-4 py-3">{match.teamB.name}: winrate</th>
                <th className="px-4 py-3">Преимущество</th>
              </tr>
            </thead>
            <tbody>
              {intelligence.maps.map((item) => (
                <tr key={item.map} className="border-t border-terminal-border">
                  <td className="px-4 py-3 font-medium">{item.map}</td>
                  <td className="px-4 py-3">{item.teamAPlayed}</td>
                  <td className="px-4 py-3">{item.teamAWinrate}%</td>
                  <td className="px-4 py-3">{item.teamBPlayed}</td>
                  <td className="px-4 py-3">{item.teamBWinrate}%</td>
                  <td className="px-4 py-3 text-terminal-muted">{mapAdvantageLabel(item.advantage, match.teamA.name, match.teamB.name)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {match.game === "dota2" && intelligence.patchContext && (
        <section className="terminal-card p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-xl font-semibold">Контекст патча</h2>
            <DataBadgeView value={intelligence.patchContext.badge} />
          </div>
          <p className="mt-3 text-sm text-terminal-muted">Текущий патч: <span className="text-terminal-text">{intelligence.patchContext.patch}</span></p>
          <p className="mt-2 text-sm text-terminal-muted">{intelligence.patchContext.note}</p>
        </section>
      )}

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

function DataBadgeView({ value, label }: { value: DataBadge; label?: string }) {
  const styles: Record<DataBadge, string> = {
    real: "border-terminal-green/40 bg-terminal-green/10 text-terminal-green",
    demo: "border-terminal-yellow/40 bg-terminal-yellow/10 text-terminal-yellow",
    insufficient: "border-white/15 bg-white/5 text-terminal-muted"
  };
  const labels: Record<DataBadge, string> = {
    real: "Реальные данные",
    demo: "Демо-данные",
    insufficient: "Недостаточно данных"
  };
  return <span className={`inline-flex rounded border px-2 py-1 text-xs font-medium ${styles[value]}`}>{label ?? labels[value]}</span>;
}

function ScoreCard({ teamName, score, breakdown }: { teamName: string; score: number; breakdown: { label: string; value: number; note: string }[] }) {
  return (
    <div className="rounded border border-terminal-border bg-terminal-bg p-4">
      <div className="flex items-center justify-between gap-3">
        <h3 className="font-semibold">{teamName}</h3>
        <span className="text-3xl font-semibold text-terminal-green">{score}</span>
      </div>
      <div className="mt-3 h-2 rounded bg-white/10">
        <div className="h-2 rounded bg-terminal-green" style={{ width: `${score}%` }} />
      </div>
      <div className="mt-4 space-y-2">
        {breakdown.map((item) => (
          <div key={item.label} className="flex items-center justify-between gap-3 text-sm">
            <span className="text-terminal-muted">{item.label}</span>
            <span>{item.value > 0 ? "+" : ""}{item.value} <span className="text-xs text-terminal-muted">{item.note}</span></span>
          </div>
        ))}
      </div>
    </div>
  );
}

function TeamFactorCard({ factor }: { factor: TeamFormFactor }) {
  return (
    <div className="rounded border border-terminal-border bg-terminal-bg p-4">
      <div className="flex items-center justify-between gap-3">
        <h3 className="font-semibold">{factor.teamName}</h3>
        <DataBadgeView value={factor.badge} />
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <MetricInline label="Последние 5" value={factor.last5} />
        <MetricInline label="Последние 10" value={factor.last10} />
        <MetricInline label="Winrate" value={factor.winrate === null ? "нет данных" : `${factor.winrate}%`} />
        <MetricInline label="Серия" value={factor.streak} />
        <MetricInline label="Последний матч" value={factor.lastMatchDate ? format(new Date(factor.lastMatchDate), "d MMM yyyy", { locale: ru }) : "нет данных"} />
        <MetricInline label="Источник" value={factor.source} />
      </div>
    </div>
  );
}

function MetricInline({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="metric-label">{label}</div>
      <div className="mt-1">{value}</div>
    </div>
  );
}

function FactorList({ title, items, tone }: { title: string; items: string[]; tone: "positive" | "risk" }) {
  return (
    <div className="rounded border border-terminal-border bg-terminal-bg p-4">
      <h3 className={tone === "positive" ? "font-semibold text-terminal-green" : "font-semibold text-terminal-yellow"}>{title}</h3>
      <ul className="mt-3 space-y-2 text-sm text-terminal-muted">
        {items.map((item) => <li key={item}>• {item}</li>)}
      </ul>
    </div>
  );
}

function DataSummary({ title, badge, items, empty }: { title: string; badge: DataBadge; items: string[]; empty: string }) {
  return (
    <div className="rounded border border-terminal-border bg-terminal-bg p-4">
      <div className="flex items-center justify-between gap-3">
        <h3 className="font-semibold">{title}</h3>
        <DataBadgeView value={badge} />
      </div>
      <div className="mt-3 space-y-2 text-sm text-terminal-muted">
        {items.length === 0 ? empty : items.map((item) => <div key={item}>{item}</div>)}
      </div>
    </div>
  );
}

function RosterList({ teamName, players }: { teamName: string; players: { nickname: string; role: string }[] }) {
  return (
    <div>
      <h3 className="font-semibold">{teamName}</h3>
      <div className="mt-3 space-y-2 text-sm">
        {players.length === 0 && <EmptyState text="Состав неизвестен. Используется fallback." />}
        {players.map((player) => (
          <div key={`${teamName}-${player.nickname}`} className="flex justify-between border-b border-terminal-border pb-2 last:border-0">
            <span>{player.nickname}</span>
            <span className="text-terminal-muted">{player.role}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return <div className="rounded border border-terminal-border bg-white/5 p-3 text-sm text-terminal-muted">{text}</div>;
}

function confidenceLabel(confidence: "low" | "medium" | "high") {
  const labels = {
    low: "Низкая уверенность",
    medium: "Средняя уверенность",
    high: "Высокая уверенность"
  };
  return labels[confidence];
}

function mapAdvantageLabel(value: "teamA" | "teamB" | "even", teamA: string, teamB: string) {
  if (value === "teamA") return teamA;
  if (value === "teamB") return teamB;
  return "Ровно";
}
