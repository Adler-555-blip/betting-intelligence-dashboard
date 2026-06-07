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
        <p className="metric-label">CS2 / Dota 2 Market Monitor</p>
        <h1 className="text-3xl font-semibold">Dashboard / Today</h1>
        <p className="max-w-3xl text-sm text-terminal-muted">
          Manual analysis workspace for events, odds movement, market signals, and decision tracking.
        </p>
      </section>
      <DashboardTable matches={todayTomorrow} />
    </div>
  );
}
