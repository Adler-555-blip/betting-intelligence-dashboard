import { NextResponse } from "next/server";
import { trackEdges, updateTrackedEdge, type EdgeStatus } from "@/src/lib/edgeTracking";

const statuses: EdgeStatus[] = ["pending", "hit", "miss", "void"];

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body || !Array.isArray(body.edges)) {
    return NextResponse.json({ error: "Неверный формат данных" }, { status: 400 });
  }

  const edges = body.edges
    .filter((edge: Record<string, unknown>) =>
      typeof edge.matchId === "string" &&
      typeof edge.edgeType === "string" &&
      typeof edge.signalStrength === "number" &&
      typeof edge.predictedOutcome === "string" &&
      typeof edge.relatedMarket === "string"
    )
    .map((edge: Record<string, unknown>) => ({
      matchId: edge.matchId as string,
      edgeType: edge.edgeType as string,
      signalStrength: edge.signalStrength as number,
      systemProbability: typeof edge.systemProbability === "number" ? edge.systemProbability : null,
      predictedOutcome: edge.predictedOutcome as string,
      relatedMarket: edge.relatedMarket as string,
      bookmakerOdds: typeof edge.bookmakerOdds === "number" ? edge.bookmakerOdds : null,
      impliedProbability: typeof edge.impliedProbability === "number" ? edge.impliedProbability : null,
      edgePercent: typeof edge.edgePercent === "number" ? edge.edgePercent : null,
      dataQualityScore: typeof edge.dataQualityScore === "number" ? edge.dataQualityScore : null,
      modelVersion: typeof edge.modelVersion === "string" ? edge.modelVersion : null,
      featureSnapshot: typeof edge.featureSnapshot === "string" ? edge.featureSnapshot : null
    }));

  if (!edges.length) {
    return NextResponse.json({ error: "Нет закономерностей для сохранения" }, { status: 400 });
  }

  const saved = await trackEdges(edges);
  return NextResponse.json({ saved: saved.length });
}

export async function PATCH(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body || typeof body.id !== "string" || !statuses.includes(body.status)) {
    return NextResponse.json({ error: "Неверный формат обновления" }, { status: 400 });
  }

  const profitLoss = body.profitLoss === "" || body.profitLoss === null || typeof body.profitLoss === "undefined"
    ? null
    : Number(body.profitLoss);

  const updated = await updateTrackedEdge({
    id: body.id,
    status: body.status,
    actualOutcome: typeof body.actualOutcome === "string" ? body.actualOutcome : null,
    profitLoss: Number.isFinite(profitLoss) ? profitLoss : null
  });

  return NextResponse.json({ updated });
}
