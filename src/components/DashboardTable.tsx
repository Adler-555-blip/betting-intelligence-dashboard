"use client";

import Link from "next/link";
import { format } from "date-fns";
import { useDashboardStore } from "@/src/store/useDashboardStore";
import { bestOdds, movementFromSnapshots } from "@/src/lib/odds";
import { MovementIndicator } from "./MovementIndicator";
import { StatusPill } from "./StatusPill";
import { WatchlistButton } from "./WatchlistButton";

type MatchRow = Awaited<ReturnType<typeof import("@/src/lib/data").getMatches>>[number];

export function DashboardTable({ matches }: { matches: MatchRow[] }) {
  const { game, status, setGame, setStatus } = useDashboardStore();
  const filtered = matches.filter((match) => (game === "all" || match.game === game) && (status === "all" || match.status === status));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex rounded border border-terminal-border bg-terminal-panel p-1">
          {["all", "cs2", "dota2"].map((item) => (
            <button key={item} onClick={() => setGame(item as typeof game)} className={`rounded px-3 py-2 text-sm uppercase ${game === item ? "bg-terminal-panelSoft text-terminal-text" : "text-terminal-muted"}`}>
              {item}
            </button>
          ))}
        </div>
        <div className="flex rounded border border-terminal-border bg-terminal-panel p-1">
          {["all", "prematch", "live", "finished"].map((item) => (
            <button key={item} onClick={() => setStatus(item as typeof status)} className={`rounded px-3 py-2 text-sm uppercase ${status === item ? "bg-terminal-panelSoft text-terminal-text" : "text-terminal-muted"}`}>
              {item}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-hidden terminal-card">
        <table className="w-full min-w-[980px] text-left text-sm">
          <thead className="border-b border-terminal-border text-xs uppercase text-terminal-muted">
            <tr>
              <th className="px-4 py-3">Start</th>
              <th className="px-4 py-3">Event</th>
              <th className="px-4 py-3">Teams</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Importance</th>
              <th className="px-4 py-3">Best A</th>
              <th className="px-4 py-3">Best B</th>
              <th className="px-4 py-3">Line</th>
              <th className="px-4 py-3">Action</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((match) => {
              const movement = movementFromSnapshots(match.oddsSnapshots.filter((item) => item.selection === "teamA"));
              return (
                <tr key={match.id} className="border-b border-terminal-border/70 last:border-0">
                  <td className="px-4 py-4 text-terminal-muted">{format(match.startTime, "MMM d HH:mm")}</td>
                  <td className="px-4 py-4">
                    <div className="font-medium">{match.tournament.name}</div>
                    <div className="text-xs uppercase text-terminal-muted">{match.game}</div>
                  </td>
                  <td className="px-4 py-4">
                    <Link href={`/matches/${match.id}`} className="font-semibold hover:text-terminal-green">
                      {match.teamA.name} vs {match.teamB.name}
                    </Link>
                  </td>
                  <td className="px-4 py-4"><StatusPill value={match.status} /></td>
                  <td className="px-4 py-4">{match.importanceScore}</td>
                  <td className="px-4 py-4 text-terminal-green">{bestOdds(match.oddsSnapshots, "teamA")?.toFixed(2) ?? "-"}</td>
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
