import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";

export async function POST(request: Request) {
  const body = await request.json();
  if (!body.matchId) return NextResponse.json({ error: "matchId is required" }, { status: 400 });

  const user =
    (await prisma.user.findFirst()) ??
    (await prisma.user.create({
      data: { name: "Analyst" }
    }));

  const existing = await prisma.watchlistItem.findFirst({
    where: { userId: user.id, matchId: body.matchId }
  });
  if (!existing) {
    await prisma.watchlistItem.create({
      data: { userId: user.id, matchId: body.matchId }
    });
  }

  return NextResponse.json({ ok: true });
}
