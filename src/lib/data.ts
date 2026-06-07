import { prisma } from "./prisma";

export async function getMatches() {
  return prisma.match.findMany({
    orderBy: { startTime: "asc" },
    include: {
      teamA: true,
      teamB: true,
      tournament: true,
      oddsSnapshots: { include: { bookmaker: true }, orderBy: { timestamp: "desc" } },
      signals: { orderBy: { createdAt: "desc" } },
      watchlistItems: true
    }
  });
}

export async function getMatch(id: string) {
  return prisma.match.findUnique({
    where: { id },
    include: {
      teamA: true,
      teamB: true,
      tournament: true,
      oddsSnapshots: { include: { bookmaker: true }, orderBy: { timestamp: "asc" } },
      signals: { orderBy: { createdAt: "desc" } },
      newsItems: { orderBy: { publishedAt: "desc" } },
      journalEntries: { orderBy: { createdAt: "desc" }, include: { bookmaker: true } }
    }
  });
}

export async function getJournalData() {
  const [entries, matches, bookmakers] = await Promise.all([
    prisma.betJournalEntry.findMany({
      include: { match: { include: { teamA: true, teamB: true, tournament: true } }, bookmaker: true },
      orderBy: { createdAt: "desc" }
    }),
    prisma.match.findMany({ include: { teamA: true, teamB: true }, orderBy: { startTime: "desc" } }),
    prisma.bookmaker.findMany({ orderBy: { name: "asc" } })
  ]);
  return { entries, matches, bookmakers };
}

export async function getAnalytics() {
  return prisma.betJournalEntry.findMany({
    include: { match: true, bookmaker: true },
    orderBy: { createdAt: "desc" }
  });
}
