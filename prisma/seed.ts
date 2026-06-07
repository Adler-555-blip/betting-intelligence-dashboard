import { PrismaClient, type Team } from "@prisma/client";

const prisma = new PrismaClient();

const bookmakers = [
  { name: "Fonbet", slug: "fonbet" },
  { name: "PARI", slug: "pari" },
  { name: "BetBoom", slug: "betboom" },
  { name: "Liga Stavok", slug: "liga-stavok" }
];

const teams = {
  cs2: ["NAVI", "Spirit", "Vitality", "FaZe", "MOUZ", "G2", "Astralis", "Virtus.pro", "Cloud9", "Aurora"],
  dota2: ["Team Spirit", "BetBoom Team", "Gaimin Gladiators", "Team Falcons", "Liquid", "Tundra", "PARIVISION", "Xtreme Gaming", "Azure Ray", "OG"]
};

function hoursFromNow(hours: number) {
  return new Date(Date.now() + hours * 60 * 60 * 1000);
}

function oddsValue(base: number, step: number, sideBias: number) {
  return Number((base + Math.sin(step / 2 + sideBias) * 0.12 + sideBias * 0.04).toFixed(2));
}

async function main() {
  await prisma.betJournalEntry.deleteMany();
  await prisma.watchlistItem.deleteMany();
  await prisma.signal.deleteMany();
  await prisma.newsItem.deleteMany();
  await prisma.oddsSnapshot.deleteMany();
  await prisma.match.deleteMany();
  await prisma.tournament.deleteMany();
  await prisma.team.deleteMany();
  await prisma.bookmaker.deleteMany();
  await prisma.user.deleteMany();

  const user = await prisma.user.create({ data: { name: "Analyst" } });
  const createdBookmakers = await Promise.all(bookmakers.map((bookmaker) => prisma.bookmaker.create({ data: bookmaker })));

  const createdTeams: Record<"cs2" | "dota2", Team[]> = { cs2: [], dota2: [] };
  for (const game of ["cs2", "dota2"] as const) {
    for (const name of teams[game]) {
      createdTeams[game].push(await prisma.team.create({ data: { name, game, externalIds: JSON.stringify({ mock: name.toLowerCase().replaceAll(" ", "-") }) } }));
    }
  }

  const tournaments = {
    cs2: await prisma.tournament.create({
      data: { name: "Thunderpick World Circuit", game: "cs2", startDate: hoursFromNow(-48), endDate: hoursFromNow(72), tier: "A", externalIds: JSON.stringify({ mock: "cs2-circuit" }) }
    }),
    dota2: await prisma.tournament.create({
      data: { name: "Dota Pro Series", game: "dota2", startDate: hoursFromNow(-24), endDate: hoursFromNow(96), tier: "S", externalIds: JSON.stringify({ mock: "dota-pro-series" }) }
    })
  };

  const matchSpecs = [
    ["cs2", 0, 1, 2, "prematch", "BO3", 91],
    ["cs2", 2, 3, 5, "prematch", "BO3", 83],
    ["cs2", 4, 5, 21, "prematch", "BO1", 68],
    ["cs2", 6, 7, -1, "live", "BO3", 74],
    ["cs2", 8, 9, -7, "finished", "BO3", 52],
    ["dota2", 0, 1, 1, "prematch", "BO3", 95],
    ["dota2", 2, 3, 4, "prematch", "BO3", 88],
    ["dota2", 4, 5, 19, "prematch", "BO5", 76],
    ["dota2", 6, 7, -2, "live", "BO3", 82],
    ["dota2", 8, 9, -8, "finished", "BO3", 58]
  ] as const;

  const matches = [];
  for (const [game, aIndex, bIndex, startOffset, status, format, importanceScore] of matchSpecs) {
    matches.push(await prisma.match.create({
      data: {
        game,
        teamAId: createdTeams[game][aIndex].id,
        teamBId: createdTeams[game][bIndex].id,
        tournamentId: tournaments[game].id,
        startTime: hoursFromNow(startOffset),
        status,
        format,
        importanceScore,
        externalIds: JSON.stringify({ mock: `${game}-${aIndex}-${bIndex}` }),
        decisionNotes: status === "live" ? "Watch live economy/map state before committing." : null
      }
    }));
  }

  for (const match of matches) {
    for (const bookmaker of createdBookmakers) {
      for (let step = 6; step >= 0; step -= 1) {
        const timestamp = new Date(Date.now() - step * 60 * 60 * 1000);
        const baseA = match.game === "cs2" ? 1.78 : 1.86;
        const baseB = match.game === "cs2" ? 2.02 : 1.94;
        await prisma.oddsSnapshot.createMany({
          data: [
            { matchId: match.id, bookmakerId: bookmaker.id, market: "winner", selection: "teamA", odds: oddsValue(baseA, step, bookmaker.slug.length / 20), timestamp },
            { matchId: match.id, bookmakerId: bookmaker.id, market: "winner", selection: "teamB", odds: oddsValue(baseB, step, -bookmaker.slug.length / 24), timestamp }
          ]
        });
      }
    }
  }

  for (const match of matches.slice(0, 6)) {
    await prisma.signal.createMany({
      data: [
        { matchId: match.id, type: "LINE_DROP", severity: "medium", title: "Line Drop", explanation: "One side shortened by more than 5% across the last sample window." },
        { matchId: match.id, type: "BOOKMAKER_SPREAD", severity: "low", title: "Bookmaker Spread", explanation: "Best price differs meaningfully between listed bookmakers." }
      ]
    });
  }

  for (const match of matches.filter((item) => item.status === "prematch").slice(0, 3)) {
    await prisma.watchlistItem.create({ data: { userId: user.id, matchId: match.id } });
  }

  for (const match of matches) {
    await prisma.newsItem.create({
      data: {
        matchId: match.id,
        game: match.game,
        title: `${match.game.toUpperCase()} context update for ${match.id.slice(-5)}`,
        url: "https://example.com/esports-context",
        source: "Mock News",
        impactScore: Math.floor(Math.random() * 4) + 1,
        publishedAt: hoursFromNow(-Math.floor(Math.random() * 10))
      }
    });
  }

  await prisma.betJournalEntry.createMany({
    data: [
      { matchId: matches[0].id, bookmakerId: createdBookmakers[0].id, selectedOutcome: "teamA", odds: 1.82, stake: 100, reasoning: "Market moved early; monitor map veto context.", confidence: 3, result: "pending", tags: JSON.stringify(["prematch", "line-move", "value"]) },
      { matchId: matches[5].id, bookmakerId: createdBookmakers[2].id, selectedOutcome: "teamB", odds: 2.08, stake: 75, reasoning: "Opponent has patch adaptation concerns.", confidence: 4, result: "won", profitLoss: 81, tags: JSON.stringify(["prematch", "news-based"]) },
      { matchId: matches[8].id, bookmakerId: createdBookmakers[1].id, selectedOutcome: "teamA", odds: 1.7, stake: 50, reasoning: "Live read was too emotional after game one.", confidence: 2, result: "lost", profitLoss: -50, tags: JSON.stringify(["live", "emotional"]) }
    ]
  });
}

main()
  .then(async () => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
