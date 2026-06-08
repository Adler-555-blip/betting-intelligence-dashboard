import { EdgeTrackingDashboard } from "@/src/components/EdgeTrackingDashboard";
import { getEdgeTrackingStats } from "@/src/lib/edgeTracking";

export default async function EdgeTrackingPage() {
  const stats = await getEdgeTrackingStats();

  return (
    <EdgeTrackingDashboard
      stats={{
        overall: stats.overall,
        byType: stats.byType,
        byStrengthRange: stats.byStrengthRange,
        bestTypes: stats.bestTypes,
        weakestTypes: stats.weakestTypes,
        entries: stats.entries.map((entry) => ({
          id: entry.id,
          matchId: entry.matchId,
          edgeType: entry.edgeType,
          signalStrength: entry.signalStrength,
          predictedOutcome: entry.predictedOutcome,
          relatedMarket: entry.relatedMarket,
          bookmakerOdds: entry.bookmakerOdds,
          impliedProbability: entry.impliedProbability,
          actualOutcome: entry.actualOutcome,
          status: entry.status as "pending" | "hit" | "miss" | "void",
          profitLoss: entry.profitLoss,
          createdAt: entry.createdAt.toISOString(),
          resolvedAt: entry.resolvedAt?.toISOString() ?? null,
          match: {
            game: entry.match.game,
            teamA: entry.match.teamA.name,
            teamB: entry.match.teamB.name,
            tournament: entry.match.tournament.name
          }
        }))
      }}
    />
  );
}
