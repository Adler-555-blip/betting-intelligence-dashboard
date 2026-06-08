"use client";

import Link from "next/link";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { useDashboardStore } from "@/src/store/useDashboardStore";
import { bestOdds, movementFromSnapshots } from "@/src/lib/odds";
import { gameLabel, statusLabel } from "@/src/lib/display";
import { MovementIndicator } from "./MovementIndicator";
import { StatusPill } from "./StatusPill";
import { WatchlistButton } from "./WatchlistButton";

type MatchRow = Awaited<ReturnType<typeof import("@/src/lib/data").getMatches>>[number];

export function DashboardTable({ matches }: { matches: MatchRow[] }) {
  const { game, status, setGame, setStatus } = useDashboardStore();
  const filtered = matches.filter((match) => (game === "all" || match.game === game) && (status === "all" || match.status === status));
  const gameFilters = [
    { value: "all", label: "Все дисциплины" },
    { value: "cs2", label: "CS2" },
    { value: "dota2", label: "Dota 2" },
    { value: "football", label: "Футбол" }
  ] as const;
  const statusFilters = [
    { value: "all", label: "Все статусы" },
    { value: "prematch", label: statusLabel("prematch") },
    { value: "live", label: statusLabel("live") },
    { value: "finished", label: statusLabel("finished") }
  ] as const;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex rounded border border-terminal-border bg-terminal-panel p-1">
          {gameFilters.map((item) => (
            <button key={item.value} onClick={() => setGame(item.value as typeof game)} className={`rounded px-3 py-2 text-sm ${game === item.value ? "bg-terminal-panelSoft text-terminal-text" : "text-terminal-muted"}`}>
              {item.label}
            </button>
          ))}
        </div>
        <div className="flex rounded border border-terminal-border bg-terminal-panel p-1">
          {statusFilters.map((item) => (
            <button key={item.value} onClick={() => setStatus(item.value as typeof status)} className={`rounded px-3 py-2 text-sm ${status === item.value ? "bg-terminal-panelSoft text-terminal-text" : "text-terminal-muted"}`}>
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-hidden terminal-card">
        <table className="w-full min-w-[980px] text-left text-sm">
          <thead className="border-b border-terminal-border text-xs uppercase text-terminal-muted">
            <tr>
              <th className="px-4 py-3">Старт</th>
              <th className="px-4 py-3">Турнир</th>
              <th className="px-4 py-3">Матч</th>
              <th className="px-4 py-3">Статус</th>
              <th className="px-4 py-3">Важность</th>
              <th className="px-4 py-3">Лучший A</th>
              <th className="px-4 py-3">Ничья</th>
              <th className="px-4 py-3">Лучший B</th>
              <th className="px-4 py-3">Линия</th>
              <th className="px-4 py-3">Действие</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={10} className="px-4 py-10 text-center text-terminal-muted">
                  По выбранным фильтрам матчей нет. Измените дисциплину или статус.
                </td>
              </tr>
            )}
            {filtered.map((match) => {
              const movement = movementFromSnapshots(match.oddsSnapshots.filter((item) => item.selection === "teamA"));
              return (
                <tr key={match.id} className="border-b border-terminal-border/70 last:border-0">
                  <td className="px-4 py-4 text-terminal-muted">{format(match.startTime, "d MMM HH:mm", { locale: ru })}</td>
                  <td className="px-4 py-4">
                    <div className="font-medium">{match.tournament.name}</div>
                    <div className="text-xs uppercase text-terminal-muted">{gameLabel(match.game)}</div>
                  </td>
                  <td className="px-4 py-4">
                    <Link href={`/matches/${match.id}`} className="font-semibold hover:text-terminal-green">
                      {match.teamA.name} против {match.teamB.name}
                    </Link>
                  </td>
                  <td className="px-4 py-4"><StatusPill value={match.status} /></td>
                  <td className="px-4 py-4">{match.importanceScore}</td>
                  <td className="px-4 py-4 text-terminal-green">{bestOdds(match.oddsSnapshots, "teamA")?.toFixed(2) ?? "-"}</td>
                  <td className="px-4 py-4 text-terminal-green">{match.game === "football" ? (bestOdds(match.oddsSnapshots, "draw")?.toFixed(2) ?? "-") : "-"}</td>
                  <td className="px-4 py-4 text-terminal-green">{bestOdds(match.oddsSnapshots, "teamB")?.toFixed(2) ?? "-"}</td>
                  <td className="px-4 py-4"><MovementIndicator movement={movement} /></td>
                  <td className="px-4 py-4"><WatchlistButton matchId={match.id} initialActive={match.watchlistItems.length > 0} /></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
