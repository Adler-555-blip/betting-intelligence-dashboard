import type { OddsSnapshot } from "@prisma/client";
import type { Movement, OddsCell } from "./types";

export function movementFromSnapshots(snapshots: Pick<OddsSnapshot, "odds" | "timestamp">[]): Movement {
  if (snapshots.length < 2) return "stable";
  const sorted = [...snapshots].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  const first = sorted[0].odds;
  const last = sorted[sorted.length - 1].odds;
  const delta = (last - first) / first;
  if (delta > 0.015) return "up";
  if (delta < -0.015) return "down";
  return "stable";
}

export function bestOdds(snapshots: OddsSnapshot[], selection: "teamA" | "teamB") {
  const latestByBook = latestOddsRows(snapshots);
  const prices = latestByBook.map((row) => (selection === "teamA" ? row.teamA : row.teamB)).filter((price): price is number => Boolean(price));
  return prices.length ? Math.max(...prices) : null;
}

export function latestOddsRows(snapshots: OddsSnapshot[]): OddsCell[] {
  const grouped = new Map<string, OddsSnapshot[]>();
  for (const snapshot of snapshots) {
    const key = snapshot.bookmakerId;
    grouped.set(key, [...(grouped.get(key) ?? []), snapshot]);
  }

  return Array.from(grouped.values()).map((items) => {
    const sorted = [...items].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    const bookmaker = "bookmaker" in sorted[0] ? (sorted[0] as OddsSnapshot & { bookmaker: { name: string; slug: string } }).bookmaker : { name: "Bookmaker", slug: "bookmaker" };
    const latestTeamA = sorted.find((item) => item.selection === "teamA");
    const latestTeamB = sorted.find((item) => item.selection === "teamB");
    const previousTeamA = sorted.filter((item) => item.selection === "teamA")[1];
    const previousTeamB = sorted.filter((item) => item.selection === "teamB")[1];

    return {
      bookmaker: bookmaker.name,
      bookmakerSlug: bookmaker.slug,
      teamA: latestTeamA?.odds ?? null,
      teamB: latestTeamB?.odds ?? null,
      lastUpdated: latestTeamA?.timestamp ?? latestTeamB?.timestamp ?? null,
      changeA: latestTeamA && previousTeamA ? Number((latestTeamA.odds - previousTeamA.odds).toFixed(2)) : 0,
      changeB: latestTeamB && previousTeamB ? Number((latestTeamB.odds - previousTeamB.odds).toFixed(2)) : 0
    };
  });
}

export function chartSeries(snapshots: (OddsSnapshot & { bookmaker: { name: string } })[]) {
  const byTime = new Map<string, Record<string, string | number>>();
  for (const snapshot of snapshots.filter((item) => item.selection === "teamA")) {
    const key = snapshot.timestamp.toISOString();
    byTime.set(key, { ...(byTime.get(key) ?? { time: key }), [snapshot.bookmaker.name]: snapshot.odds });
  }
  return Array.from(byTime.values()).sort((a, b) => String(a.time).localeCompare(String(b.time)));
}
