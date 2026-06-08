import { getMatches } from "@/src/lib/data";
import { DashboardTable } from "@/src/components/DashboardTable";

export default async function HomePage() {
  const matches = await getMatches();
  const todayTomorrow = matches.filter((match) => {
    const deltaHours = (match.startTime.getTime() - Date.now()) / 3600000;
    return deltaHours > -12 && deltaHours < 48;
  });

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-2">
        <p className="metric-label">Мониторинг линии CS2 / Dota 2 / Футбол</p>
        <h1 className="text-3xl font-semibold">Матчи сегодня и завтра</h1>
        <p className="max-w-3xl text-sm text-terminal-muted">
          Рабочий экран для ручного анализа: события, коэффициенты, движение линии, рыночные сигналы и журнал решений.
        </p>
      </section>
      <DashboardTable matches={todayTomorrow} />
    </div>
  );
}
