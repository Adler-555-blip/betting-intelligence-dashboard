import { notFound } from "next/navigation";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { getJournalData, getMatch } from "@/src/lib/data";
import { chartSeries, latestOddsRows } from "@/src/lib/odds";
import { gameLabel, severityLabel, signalTypeLabel } from "@/src/lib/display";
import { getMatchIntelligence, type DataBadge, type FootballContext, type MapFactor, type MatchIntelligence, type PlayerKillFactor, type TeamFormFactor, type TeamRatingFactor } from "@/src/lib/matchIntelligence";
import { findBettingEdges } from "@/src/lib/edgeFinder";
import { OddsChart } from "@/src/components/OddsChart";
import { StatusPill } from "@/src/components/StatusPill";
import { JournalForm } from "@/src/components/JournalForm";
import { BlockUsefulnessFeedback } from "@/src/components/BlockUsefulnessFeedback";
import { PreBetSurvey } from "@/src/components/PreBetSurvey";
import { BettingEdgeFinder } from "@/src/components/BettingEdgeFinder";

export default async function MatchPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [match, journalData] = await Promise.all([getMatch(id), getJournalData()]);
  if (!match) notFound();

  const oddsRows = latestOddsRows(match.oddsSnapshots);
  const bookmakers = Array.from(new Set(match.oddsSnapshots.map((snapshot) => snapshot.bookmaker.name)));
  const series = chartSeries(match.oddsSnapshots);
  const matchOptions = journalData.matches.map((item) => ({ id: item.id, label: `${item.teamA.name} против ${item.teamB.name}` }));
  const intelligence = await getMatchIntelligence(match);
  const edges = await findBettingEdges(match, intelligence);
  const summary = buildMatchSummary(match.teamA.name, match.teamB.name, intelligence);
  const leadingTeam = intelligence.score.teamA === intelligence.score.teamB
    ? "Преимущество не выражено"
    : intelligence.score.teamA > intelligence.score.teamB
      ? `${match.teamA.name} выглядит сильнее по доступным факторам`
      : `${match.teamB.name} выглядит сильнее по доступным факторам`;
  const scoreBadge = intelligence.score.confidence === "high" ? "real" : intelligence.score.confidence === "medium" ? "demo" : "insufficient";
  const marketLabel = match.game === "football" ? "1X2" : "победитель матча";
  const feedbackBlocks = match.game === "football"
    ? footballFeedbackBlocks
    : undefined;

  return (
    <div className="space-y-6">
      <section className="terminal-card p-6">
        <div className="flex flex-wrap items-start justify-between gap-5">
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
          <div className="min-w-[260px] rounded border border-terminal-border bg-terminal-bg p-4">
            <p className="metric-label">Первое впечатление</p>
            <p className="mt-2 text-lg font-semibold">{leadingTeam}</p>
            <p className="mt-2 text-sm text-terminal-muted">Не прогноз и не рекомендация. Только сводка уже доступных факторов и рисков.</p>
          </div>
        </div>
      </section>

      <BettingEdgeFinder matchId={match.id} edges={edges} />

      <section className="terminal-card border-terminal-green/40 p-5 shadow-[0_18px_60px_rgba(34,197,94,0.08)]">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="metric-label">Подробная статистика</p>
            <h2 className="mt-1 text-3xl font-semibold">Сила команд и базовые факторы</h2>
            <p className="mt-2 max-w-3xl text-sm text-terminal-muted">
              Старый аналитический слой оставлен ниже найденных закономерностей: форма, рейтинг, турнирный контекст, составы, очные встречи и движение линии.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <DataBadgeView value={scoreBadge} label={confidenceLabel(intelligence.score.confidence)} size="large" />
            {intelligence.score.partial && <DataBadgeView value="insufficient" label="Оценка частичная" />}
          </div>
        </div>

        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          <ScoreCard teamName={match.teamA.name} score={intelligence.score.teamA} breakdown={intelligence.score.breakdown.map((item) => ({ label: item.label, value: item.teamA, note: item.note }))} />
          <ScoreCard teamName={match.teamB.name} score={intelligence.score.teamB} breakdown={intelligence.score.breakdown.map((item) => ({ label: item.label, value: item.teamB, note: item.note }))} />
        </div>

        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          <FactorList title="Факторы за" items={intelligence.factorsFor} tone="positive" />
          <FactorList title="Факторы против" items={intelligence.factorsAgainst} tone="risk" />
        </div>
      </section>

      <MatchSummarySection summary={summary} />

      {match.game === "cs2" && <TeamRatingSection ratings={intelligence.teamRatings} />}
      {match.game === "football" && intelligence.footballContext && (
        <FootballAnalysisSection context={intelligence.footballContext} teamA={match.teamA.name} teamB={match.teamB.name} />
      )}

      <section className="grid gap-4 lg:grid-cols-2">
        <TeamFactorCard factor={intelligence.teamA} />
        <TeamFactorCard factor={intelligence.teamB} />
      </section>

      <section className="terminal-card p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="metric-label">Источники данных</p>
            <h2 className="mt-1 text-2xl font-semibold">Что реальное, а что демо</h2>
          </div>
          <DataBadgeView value="insufficient" label="Проверяй бейдж перед выводами" size="large" />
        </div>
        <div className="mt-5 grid gap-4 lg:grid-cols-3">
          <DataSummary title="Реальные данные" badge="real" items={intelligence.dataSummary.real} empty="Реальные источники пока не дали данных для этого матча." />
          <DataSummary title="Демо-данные" badge="demo" items={intelligence.dataSummary.demo} empty="Fallback не использовался." />
          <DataSummary title="Недостаточно данных" badge="insufficient" items={intelligence.dataSummary.insufficient} empty="Критичных пропусков данных нет." />
        </div>
      </section>

      {match.game === "cs2" && <PlayerKillsSection players={intelligence.playerKills} />}

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
        <section className="terminal-card overflow-hidden border-terminal-green/30">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-terminal-border p-5">
            <div>
              <h2 className="text-xl font-semibold">Карты и стороны</h2>
              <p className="mt-1 text-sm text-terminal-muted">Winrate по картам, CT/T round winrate и профиль карты для оценки map pool.</p>
            </div>
            <DataBadgeView value="demo" label="Демо-статистика карт" size="large" />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1180px] text-left text-sm">
              <thead className="text-xs uppercase text-terminal-muted">
                <tr>
                  <th className="px-4 py-3">Карта</th>
                  <th className="px-4 py-3">{match.teamA.name}: сыграно</th>
                  <th className="px-4 py-3">{match.teamA.name}: winrate</th>
                  <th className="px-4 py-3">{match.teamA.name}: CT/T</th>
                  <th className="px-4 py-3">{match.teamB.name}: сыграно</th>
                  <th className="px-4 py-3">{match.teamB.name}: winrate</th>
                  <th className="px-4 py-3">{match.teamB.name}: CT/T</th>
                  <th className="px-4 py-3">Сильнее сторона</th>
                  <th className="px-4 py-3">Профиль</th>
                  <th className="px-4 py-3">Преимущество</th>
                </tr>
              </thead>
              <tbody>
                {intelligence.maps.map((item) => (
                  <tr key={item.map} className="border-t border-terminal-border">
                    <td className="px-4 py-3 font-medium">{item.map}</td>
                    <td className="px-4 py-3">{item.teamAPlayed}</td>
                    <td className="px-4 py-3">{item.teamAWinrate}%</td>
                    <td className="px-4 py-3">{item.teamACTWinrate}% / {item.teamATWinrate}%</td>
                    <td className="px-4 py-3">{item.teamBPlayed}</td>
                    <td className="px-4 py-3">{item.teamBWinrate}%</td>
                    <td className="px-4 py-3">{item.teamBCTWinrate}% / {item.teamBTWinrate}%</td>
                    <td className="px-4 py-3">{item.strongerSide}</td>
                    <td className="px-4 py-3"><MapSideBadge map={item} /></td>
                    <td className="px-4 py-3 text-terminal-muted">{mapAdvantageLabel(item.advantage, match.teamA.name, match.teamB.name)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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
            <h2 className="text-xl font-semibold">{match.game === "football" ? "Движение линии 1X2" : "Движение коэффициента"}</h2>
            <span className="metric-label">Рынок: {marketLabel}</span>
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
                <td className={match.game === "football" ? "px-4 py-3 text-terminal-green" : "px-4 py-3 text-terminal-muted"}>
                  {match.game === "football" ? row.draw?.toFixed(2) ?? "-" : "-"}
                </td>
                <td className="px-4 py-3 text-terminal-muted">{row.lastUpdated ? format(row.lastUpdated, "HH:mm") : "-"}</td>
                <td className="px-4 py-3">
                  {row.changeA >= 0 ? "+" : ""}{row.changeA.toFixed(2)} / {row.changeB >= 0 ? "+" : ""}{row.changeB.toFixed(2)}
                  {match.game === "football" ? ` / ${row.changeDraw && row.changeDraw >= 0 ? "+" : ""}${(row.changeDraw ?? 0).toFixed(2)}` : ""}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        <div className="terminal-card p-5">
          <h2 className="text-xl font-semibold">Заметки по командам</h2>
          <p className="mt-3 text-sm text-terminal-muted">
            {match.game === "football"
              ? "Подтвержденные составы, травмы и новости пока не подключены. Перед реальным решением проверьте стартовые составы, форму и турнирный контекст."
              : "Составы стабильны, критичных замен в демо-данных нет. Перед реальным решением проверьте карты, форму и последние новости."}
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

      <BlockUsefulnessFeedback matchId={match.id} blocksOverride={feedbackBlocks} />

      <NextStepsSection game={match.game} />

      <PreBetSurvey matchId={match.id} />

      <section className="terminal-card p-5">
          <h2 className="text-xl font-semibold">Что спросить у беттора</h2>
          <div className="mt-4 grid gap-3 text-sm text-terminal-muted md:grid-cols-2">
          {(match.game === "football"
            ? [
                "Какие 3 блока ты смотришь в первую очередь?",
                "Какие блоки можно убрать?",
                "Каких данных не хватает для решения?",
                "Важен ли тебе рейтинг сборной?",
                "Важны ли составы и травмы?",
                "Важен ли контекст группы?",
                "Какие данные ты обычно ищешь вручную?",
                "Что должно быть выше на странице?"
              ]
            : [
                "Какие 3 блока ты смотришь в первую очередь?",
                "Какие блоки можно убрать?",
                "Каких данных не хватает для ставки?",
                "Важны ли тебе CT/T раунды?",
                "Важны ли средние киллы игрока?",
                "Важен ли рейтинг команды?",
                "Какие данные ты обычно ищешь вручную?",
                "Что должно быть выше на странице?"
              ]).map((question) => (
            <div key={question} className="rounded border border-terminal-border bg-terminal-bg p-3">□ {question}</div>
          ))}
        </div>
      </section>
    </div>
  );
}

type TeamSummary = {
  teamName: string;
  advantages: string[];
  risks: string[];
};

const footballFeedbackBlocks = [
  "Рейтинг сборных",
  "Форма сборных",
  "Контекст группы",
  "Состав и потери",
  "Календарь и логистика",
  "Движение линии 1X2",
  "Турнирная мотивация",
  "Что проверить перед решением",
  "Факторы за/против",
  "Match Intelligence Score"
];

function MatchSummarySection({ summary }: { summary: TeamSummary[] }) {
  return (
    <section className="terminal-card p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="metric-label">Краткое резюме матча</p>
          <h2 className="mt-1 text-2xl font-semibold">Факты по каждой команде</h2>
          <p className="mt-2 max-w-3xl text-sm text-terminal-muted">
            Автоматически собрано из уже существующих факторов. Без обещаний результата и без советов по ставке.
          </p>
        </div>
        <DataBadgeView value="demo" label="Сводка из факторов" size="large" />
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        {summary.map((team) => (
          <div key={team.teamName} className="rounded border border-terminal-border bg-terminal-bg p-4">
            <h3 className="text-lg font-semibold">{team.teamName}</h3>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <SummaryList title={`Преимущества ${team.teamName}`} items={team.advantages} tone="positive" />
              <SummaryList title={`Риски ${team.teamName}`} items={team.risks} tone="risk" />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function SummaryList({ title, items, tone }: { title: string; items: string[]; tone: "positive" | "risk" }) {
  return (
    <div>
      <h4 className={tone === "positive" ? "font-semibold text-terminal-green" : "font-semibold text-terminal-yellow"}>{title}</h4>
      <ul className="mt-3 space-y-2 text-sm text-terminal-muted">
        {items.map((item) => <li key={item}>• {item}</li>)}
      </ul>
    </div>
  );
}

function NextStepsSection({ game }: { game: string }) {
  const items = game === "football"
    ? [
        "Реальный FIFA/Coca-Cola ranking",
        "Подтвержденные стартовые составы",
        "Травмы и дисквалификации",
        "Форма последних матчей",
        "xG, удары и созданные моменты",
        "Стадион, погода и логистика",
        "Реальные новости сборных"
      ]
    : [
        "Реальный рейтинг команд",
        "Реальные карты и map pool",
        "Реальная CT/T статистика",
        "Реальные киллы игроков",
        "Реальные составы",
        "Реальные очные встречи",
        "Реальный турнирный контекст"
      ];

  return (
    <section className="terminal-card p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="metric-label">Roadmap данных</p>
          <h2 className="mt-1 text-2xl font-semibold">Что будет добавлено дальше</h2>
          <p className="mt-2 max-w-3xl text-sm text-terminal-muted">
            Список помогает собрать обратную связь: какие источники и факторы важнее подключать первыми.
          </p>
        </div>
        <DataBadgeView value="insufficient" label="Пока не подключено" size="large" />
      </div>
      <div className="mt-5 grid gap-3 text-sm text-terminal-muted md:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <div key={item} className="rounded border border-terminal-border bg-terminal-bg p-3">□ {item}</div>
        ))}
      </div>
    </section>
  );
}

function FootballAnalysisSection({ context, teamA, teamB }: { context: FootballContext; teamA: string; teamB: string }) {
  const rating = context.factors.find((item) => item.label === "Рейтинг сборных");
  const form = context.factors.find((item) => item.label === "Форма сборных");
  const group = context.factors.find((item) => item.label === "Контекст группы");
  const roster = context.factors.find((item) => item.label === "Состав и потери");
  const logistics = context.factors.find((item) => item.label === "Календарь и логистика");
  const line = context.factors.find((item) => item.label === "Движение линии 1X2");
  const motivation = context.factors.find((item) => item.label === "Турнирная мотивация");

  return (
    <section className="space-y-4">
      <section className="terminal-card border-terminal-green/30 p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="metric-label">Футбол / FIFA World Cup 2026</p>
            <h2 className="mt-1 text-2xl font-semibold">Футбольные факторы матча</h2>
            <p className="mt-2 max-w-3xl text-sm text-terminal-muted">
              Для футбола показаны только релевантные факторы: рейтинг сборных, форма, группа, составы, логистика, 1X2 и мотивация.
            </p>
          </div>
          <DataBadgeView value={context.badge} label="● Реальный турнирный контекст" size="large" />
        </div>
        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          <FootballFactorCard title="Рейтинг сборных" factor={rating} teamA={teamA} teamB={teamB} emphasized />
          <FootballFactorCard title="Форма сборных" factor={form} teamA={teamA} teamB={teamB} emphasized />
          <FootballFactorCard title="Контекст группы" factor={group} teamA={teamA} teamB={teamB} emphasized />
          <FootballFactorCard title="Состав и потери" factor={roster} teamA={teamA} teamB={teamB} />
          <FootballFactorCard title="Календарь и логистика" factor={logistics} teamA={teamA} teamB={teamB} />
          <FootballFactorCard title="Движение линии 1X2" factor={line} teamA={teamA} teamB={teamB} />
          <FootballFactorCard title="Турнирная мотивация" factor={motivation} teamA={teamA} teamB={teamB} />
          <div className="rounded border border-terminal-border bg-terminal-bg p-4">
            <div className="flex items-center justify-between gap-3">
              <h3 className="font-semibold">Что проверить перед решением</h3>
              <DataBadgeView value="insufficient" />
            </div>
            <div className="mt-3 space-y-2 text-sm text-terminal-muted">
              {context.checklist.map((item) => <div key={item}>□ {item}</div>)}
            </div>
          </div>
        </div>
      </section>
    </section>
  );
}

function FootballFactorCard({ title, factor, teamA, teamB, emphasized = false }: { title: string; factor?: FootballContext["factors"][number]; teamA: string; teamB: string; emphasized?: boolean }) {
  return (
    <div className={`rounded border bg-terminal-bg p-4 ${emphasized ? "border-terminal-green/30" : "border-terminal-border"}`}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="font-semibold">{title}</h3>
        <DataBadgeView value={factor?.badge ?? "insufficient"} size={emphasized ? "large" : "regular"} />
      </div>
      {factor ? (
        <div className="mt-4 grid gap-3 text-sm md:grid-cols-2">
          <MetricInline label={teamA} value={factor.teamA} />
          <MetricInline label={teamB} value={factor.teamB} />
          <MetricInline label="Источник" value={factor.source} />
        </div>
      ) : (
        <EmptyState text="Недостаточно данных для этого фактора." />
      )}
    </div>
  );
}

function TeamRatingSection({ ratings }: { ratings: TeamRatingFactor[] }) {
  const badge: DataBadge = ratings.every((rating) => rating.badge === "real") ? "real" : ratings.some((rating) => rating.badge === "real") ? "insufficient" : "demo";
  return (
    <section className="terminal-card border-terminal-green/30 p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold">Рейтинг команд</h2>
          <p className="mt-1 text-sm text-terminal-muted">HLTV ranking snapshot для real CS2 foundation. Если команда отсутствует в snapshot, это отмечается как недостаток данных.</p>
        </div>
        <DataBadgeView value={badge} size="large" />
      </div>
      <div className="grid gap-3 lg:grid-cols-2">
        {ratings.map((rating) => (
          <div key={rating.teamName} className="rounded border border-terminal-border bg-terminal-bg p-4">
            <div className="flex items-center justify-between gap-3">
              <h3 className="font-semibold">{rating.teamName}</h3>
              <span className="text-2xl font-semibold text-terminal-green">{rating.rating.toFixed(2)}</span>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
              <MetricInline label="Текущий рейтинг" value={rating.rating.toFixed(2)} />
              <MetricInline label="Место" value={`#${rating.rank}`} />
              <MetricInline label="Разница" value={`${rating.ratingDiff > 0 ? "+" : ""}${rating.ratingDiff.toFixed(2)}`} />
              <MetricInline label="Динамика" value={rating.trend} />
              <MetricInline label="Источник" value={rating.source} />
              <DataBadgeView value={rating.badge} />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function PlayerKillsSection({ players }: { players: PlayerKillFactor[] }) {
  return (
    <section className="terminal-card overflow-hidden border-terminal-green/30">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-terminal-border p-5">
        <div>
          <h2 className="text-xl font-semibold">Киллы игроков</h2>
          <p className="mt-1 text-sm text-terminal-muted">Блок для первичной оценки индивидуальных рынков по количеству киллов.</p>
        </div>
        <DataBadgeView value="demo" label="Демо-данные игроков" size="large" />
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1040px] text-left text-sm">
          <thead className="text-xs uppercase text-terminal-muted">
            <tr>
              <th className="px-4 py-3">Команда</th>
              <th className="px-4 py-3">Игрок</th>
              <th className="px-4 py-3">Киллы 5 карт</th>
              <th className="px-4 py-3">Киллы 10 карт</th>
              <th className="px-4 py-3">K/D</th>
              <th className="px-4 py-3">ADR</th>
              <th className="px-4 py-3">Стабильность</th>
              <th className="px-4 py-3">Лучшие карты</th>
              <th className="px-4 py-3">Слабые карты</th>
            </tr>
          </thead>
          <tbody>
            {players.map((player) => (
              <tr key={`${player.teamName}-${player.nickname}`} className="border-t border-terminal-border">
                <td className="px-4 py-3">{player.teamName}</td>
                <td className="px-4 py-3 font-medium">{player.nickname}</td>
                <td className="px-4 py-3">{player.avgKillsLast5}</td>
                <td className="px-4 py-3">{player.avgKillsLast10}</td>
                <td className="px-4 py-3">{player.kd.toFixed(2)}</td>
                <td className="px-4 py-3">{player.adr.toFixed(1)}</td>
                <td className="px-4 py-3">{player.stability}</td>
                <td className="px-4 py-3">{player.bestMaps.join(", ")}</td>
                <td className="px-4 py-3">{player.weakMaps.join(", ")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function DataBadgeView({ value, label, size = "regular" }: { value: DataBadge; label?: string; size?: "regular" | "large" }) {
  const styles: Record<DataBadge, string> = {
    real: "border-terminal-green/40 bg-terminal-green/10 text-terminal-green",
    partial: "border-terminal-green/30 bg-terminal-green/5 text-terminal-green",
    snapshot: "border-sky-400/40 bg-sky-400/10 text-sky-300",
    demo: "border-terminal-yellow/40 bg-terminal-yellow/10 text-terminal-yellow",
    missing: "border-terminal-red/40 bg-terminal-red/10 text-terminal-red",
    insufficient: "border-terminal-red/40 bg-terminal-red/10 text-terminal-red"
  };
  const labels: Record<DataBadge, string> = {
    real: "● Реальные данные",
    partial: "● Частичные данные",
    snapshot: "● Snapshot-данные",
    demo: "● Демо-данные",
    missing: "● Нет данных",
    insufficient: "● Недостаточно данных"
  };
  const sizeClass = size === "large" ? "px-3 py-2 text-sm font-semibold" : "px-2 py-1 text-xs font-medium";
  return <span className={`inline-flex rounded border ${sizeClass} ${styles[value]}`}>{label ?? labels[value]}</span>;
}

function ScoreCard({ teamName, score, breakdown }: { teamName: string; score: number; breakdown: { label: string; value: number; note: string }[] }) {
  return (
    <div className="rounded border border-terminal-green/30 bg-terminal-bg p-5">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-lg font-semibold">{teamName}</h3>
        <span className="text-5xl font-semibold text-terminal-green">{score}</span>
      </div>
      <div className="mt-4 h-3 rounded bg-white/10">
        <div className="h-3 rounded bg-terminal-green" style={{ width: `${score}%` }} />
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

function MapSideBadge({ map }: { map: MapFactor }) {
  const className =
    map.sideProfile === "Balanced"
      ? "border-white/15 bg-white/5 text-terminal-muted"
      : map.sideProfile === "CT-sided"
        ? "border-terminal-green/40 bg-terminal-green/10 text-terminal-green"
        : "border-terminal-yellow/40 bg-terminal-yellow/10 text-terminal-yellow";
  return <span className={`inline-flex rounded border px-2 py-1 text-xs font-medium ${className}`}>{map.sideProfile}</span>;
}

function buildMatchSummary(teamAName: string, teamBName: string, intelligence: MatchIntelligence): TeamSummary[] {
  const ratingA = intelligence.teamRatings.find((item) => item.teamName === teamAName);
  const ratingB = intelligence.teamRatings.find((item) => item.teamName === teamBName);

  return [
    buildTeamSummary(teamAName, teamBName, intelligence.score.teamA, intelligence.score.teamB, intelligence, ratingA, ratingB),
    buildTeamSummary(teamBName, teamAName, intelligence.score.teamB, intelligence.score.teamA, intelligence, ratingB, ratingA)
  ];
}

function buildTeamSummary(
  teamName: string,
  opponentName: string,
  score: number,
  opponentScore: number,
  intelligence: MatchIntelligence,
  rating?: TeamRatingFactor,
  opponentRating?: TeamRatingFactor
): TeamSummary {
  const advantages = intelligence.factorsFor.filter((item) => item.includes(teamName)).slice(0, 3);
  const risks = intelligence.factorsAgainst.filter((item) => item.includes(teamName)).slice(0, 3);

  if (score > opponentScore) {
    advantages.unshift(`Базовая оценка факторов выше: ${score} против ${opponentScore}.`);
  } else if (score < opponentScore) {
    risks.unshift(`Базовая оценка факторов ниже: ${score} против ${opponentScore}.`);
  }

  if (rating && opponentRating && rating.rating > opponentRating.rating) {
    advantages.push(`Рейтинг команды выше: ${rating.rating.toFixed(2)} против ${opponentRating.rating.toFixed(2)}.`);
  }

  if (rating && opponentRating && rating.rating < opponentRating.rating) {
    risks.push(`Рейтинг команды ниже: ${rating.rating.toFixed(2)} против ${opponentRating.rating.toFixed(2)}.`);
  }

  const opponentAdvantages = intelligence.factorsFor.filter((item) => item.includes(opponentName)).slice(0, 2);
  risks.push(...opponentAdvantages.map((item) => `У соперника есть фактор: ${item}`));

  return {
    teamName,
    advantages: uniqueList(advantages).slice(0, 4).concat(advantages.length ? [] : ["Явных преимуществ по текущим факторам не выделено."]),
    risks: uniqueList(risks).slice(0, 4).concat(risks.length ? [] : ["Критичных рисков по текущим факторам не выделено."])
  };
}

function uniqueList(items: string[]) {
  return Array.from(new Set(items.filter(Boolean)));
}
