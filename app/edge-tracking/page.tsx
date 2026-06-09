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
        bySystemProbabilityRange: stats.bySystemProbabilityRange,
        byDataQualityRange: stats.byDataQualityRange,
        bestTypes: stats.bestTypes,
        weakestTypes: stats.weakestTypes,
        averageSystemProbability: stats.averageSystemProbability,
        averageDataQualityScore: stats.averageDataQualityScore,
        entries: stats.entries.map((entry) => ({
          id: entry.id,
          matchId: entry.matchId,
          edgeType: entry.edgeType,
          signalStrength: entry.signalStrength,
          systemProbability: entry.systemProbability,
          predictedOutcome: entry.predictedOutcome,
          relatedMarket: entry.relatedMarket,
          bookmakerOdds: entry.bookmakerOdds,
          impliedProbability: entry.impliedProbability,
          edgePercent: entry.edgePercent,
          dataQualityScore: entry.dataQualityScore,
          modelVersion: entry.modelVersion,
          featureSnapshot: entry.featureSnapshot,
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
