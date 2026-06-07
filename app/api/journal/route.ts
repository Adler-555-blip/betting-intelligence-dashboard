import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";

export async function POST(request: Request) {
  const body = await request.json();
  const odds = Number(body.odds);
  const confidence = Number(body.confidence);
  if (!body.matchId || !body.selectedOutcome || !body.reasoning || Number.isNaN(odds) || Number.isNaN(confidence)) {
    return NextResponse.json({ error: "Некорректная запись журнала" }, { status: 400 });
  }

  const tags = String(body.tags ?? "")
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);

  await prisma.betJournalEntry.create({
    data: {
      matchId: body.matchId,
      bookmakerId: body.bookmakerId || null,
      selectedOutcome: body.selectedOutcome,
      odds,
      stake: body.stake ? Number(body.stake) : null,
      reasoning: body.reasoning,
      confidence,
      tags: JSON.stringify(tags),
      result: "pending"
    }
  });

  return NextResponse.json({ ok: true });
}
