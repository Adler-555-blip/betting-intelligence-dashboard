import type { EdgeTrackingEntry } from "@prisma/client";
import { prisma } from "./prisma";

export type EdgeStatus = "pending" | "hit" | "miss" | "void";

export type EdgeTrackingPayload = {
  matchId: string;
  edgeType: string;
  signalStrength: number;
  predictedOutcome: string;
  relatedMarket: string;
  bookmakerOdds?: number | null;
  impliedProbability?: number | null;
};

export type EdgeTrackingStats = {
  entries: EdgeTrackingEntryWithMatch[];
  overall: RateSummary;
  byType: RateSummary[];
  byStrengthRange: RateSummary[];
  bestTypes: RateSummary[];
  weakestTypes: RateSummary[];
};

export type EdgeTrackingEntryWithMatch = EdgeTrackingEntry & {
  match: {
    game: string;
    teamA: { name: string };
    teamB: { name: string };
    tournament: { name: string };
  };
};

export type RateSummary = {
  label: string;
  total: number;
  resolved: number;
  hits: number;
  misses: number;
  voids: number;
  hitRate: number;
};

export async function trackEdges(edges: EdgeTrackingPayload[]) {
  return Promise.all(
    edges.map((edge) =>
      prisma.edgeTrackingEntry.upsert({
        where: {
          matchId_edgeType_relatedMarket: {
            matchId: edge.matchId,
            edgeType: edge.edgeType,
            relatedMarket: edge.relatedMarket
          }
        },
        update: {
          signalStrength: edge.signalStrength,
          predictedOutcome: edge.predictedOutcome,
          bookmakerOdds: edge.bookmakerOdds ?? null,
          impliedProbability: edge.impliedProbability ?? null
        },
        create: {
          matchId: edge.matchId,
          edgeType: edge.edgeType,
          signalStrength: edge.signalStrength,
          predictedOutcome: edge.predictedOutcome,
          relatedMarket: edge.relatedMarket,
          bookmakerOdds: edge.bookmakerOdds ?? null,
          impliedProbability: edge.impliedProbability ?? null
        }
      })
    )
  );
}

export async function updateTrackedEdge(input: {
  id: string;
  status: EdgeStatus;
  actualOutcome?: string | null;
  profitLoss?: number | null;
}) {
  const resolvedAt = input.status === "pending" ? null : new Date();
  return prisma.edgeTrackingEntry.update({
    where: { id: input.id },
    data: {
      status: input.status,
      actualOutcome: input.actualOutcome?.trim() || null,
      profitLoss: typeof input.profitLoss === "number" ? input.profitLoss : null,
      resolvedAt
    }
  });
}

export async function getEdgeTrackingStats(): Promise<EdgeTrackingStats> {
  const entries = await prisma.edgeTrackingEntry.findMany({
    include: {
      match: {
        include: {
          teamA: { select: { name: true } },
          teamB: { select: { name: true } },
          tournament: { select: { name: true } }
        }
      }
    },
    orderBy: [{ createdAt: "desc" }]
  });

  const byType = summarizeGroups(groupBy(entries, (entry) => entry.edgeType));
  const byStrengthRange = summarizeGroups(groupBy(entries, (entry) => strengthRange(entry.signalStrength)));
  const rankedTypes = byType.filter((item) => item.resolved > 0).sort((a, b) => b.hitRate - a.hitRate || b.resolved - a.resolved);

  return {
    entries,
    overall: summarize("Все закономерности", entries),
    byType,
    byStrengthRange: sortStrengthRanges(byStrengthRange),
    bestTypes: rankedTypes.slice(0, 3),
    weakestTypes: [...rankedTypes].reverse().slice(0, 3)
  };
}

function groupBy<T>(items: T[], keyGetter: (item: T) => string) {
  const groups = new Map<string, T[]>();
  for (const item of items) {
    const key = keyGetter(item);
    groups.set(key, [...(groups.get(key) ?? []), item]);
  }
  return groups;
}

function summarizeGroups(groups: Map<string, EdgeTrackingEntryWithMatch[]>) {
  return Array.from(groups.entries()).map(([label, items]) => summarize(label, items));
}

function summarize(label: string, entries: EdgeTrackingEntry[]) {
  const hits = entries.filter((entry) => entry.status === "hit").length;
  const misses = entries.filter((entry) => entry.status === "miss").length;
  const voids = entries.filter((entry) => entry.status === "void").length;
  const resolved = hits + misses;
  return {
    label,
    total: entries.length,
    resolved,
    hits,
    misses,
    voids,
    hitRate: resolved ? Math.round((hits / resolved) * 100) : 0
  };
}

function strengthRange(value: number) {
  if (value >= 80) return "80-100";
  if (value >= 65) return "65-79";
  if (value >= 50) return "50-64";
  return "0-49";
}

function sortStrengthRanges(items: RateSummary[]) {
  const order = ["80-100", "65-79", "50-64", "0-49"];
  return [...items].sort((a, b) => order.indexOf(a.label) - order.indexOf(b.label));
}
