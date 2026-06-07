import { type Match, type OddsSnapshot } from "@prisma/client";

type SignalInput = Match & { oddsSnapshots: OddsSnapshot[] };

export function evaluateSignals(match: SignalInput) {
  const signals = [];
  const now = Date.now();
  const minutesUntilStart = (match.startTime.getTime() - now) / 60000;

  if (minutesUntilStart > 0 && minutesUntilStart < 30) {
    signals.push({
      matchId: match.id,
      type: "MATCH_SOON",
      severity: "high",
      title: "Match Soon",
      explanation: "Match starts in less than 30 minutes. Re-check odds, roster context, and live availability."
    });
  }

  const bySelection = groupBy(match.oddsSnapshots, (item) => item.selection);
  for (const [selection, snapshots] of bySelection.entries()) {
    const sorted = [...snapshots].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    if (sorted.length < 2) continue;
    const first = sorted[0].odds;
    const last = sorted[sorted.length - 1].odds;
    const pct = ((last - first) / first) * 100;
    if (pct <= -5) {
      signals.push({
        matchId: match.id,
        type: "LINE_DROP",
        severity: "medium",
        title: `Line Drop: ${selection}`,
        explanation: `${selection} odds dropped ${Math.abs(pct).toFixed(1)}% across the observed window.`
      });
    }
    if (pct >= 5) {
      signals.push({
        matchId: match.id,
        type: "LINE_RISE",
        severity: "medium",
        title: `Line Rise: ${selection}`,
        explanation: `${selection} odds rose ${pct.toFixed(1)}% across the observed window.`
      });
    }
  }

  const latestTeamA = latestByBook(match.oddsSnapshots.filter((item) => item.selection === "teamA"));
  if (latestTeamA.length > 1 && Math.max(...latestTeamA) - Math.min(...latestTeamA) >= 0.12) {
    signals.push({
      matchId: match.id,
      type: "BOOKMAKER_SPREAD",
      severity: "low",
      title: "Bookmaker Spread",
      explanation: "Team A has a notable price gap between bookmakers."
    });
  }

  return signals;
}

function groupBy<T>(items: T[], keyFn: (item: T) => string) {
  const map = new Map<string, T[]>();
  for (const item of items) {
    const key = keyFn(item);
    map.set(key, [...(map.get(key) ?? []), item]);
  }
  return map;
}

function latestByBook(items: OddsSnapshot[]) {
  const byBook = groupBy(items, (item) => item.bookmakerId);
  return Array.from(byBook.values()).map((snapshots) => snapshots.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())[0].odds);
}
