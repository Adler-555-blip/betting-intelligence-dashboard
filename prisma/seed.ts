import { PrismaClient, type Team } from "@prisma/client";

const prisma = new PrismaClient();

const bookmakers = [
  { name: "Fonbet", slug: "fonbet" },
  { name: "PARI", slug: "pari" },
  { name: "BetBoom", slug: "betboom" },
  { name: "Liga Stavok", slug: "liga-stavok" }
];

const teams = {
  cs2: ["Team Spirit", "NAVI", "Vitality", "MOUZ", "FaZe Clan"],
  dota2: ["Team Spirit", "BetBoom Team", "Tundra", "Gaimin Gladiators", "Team Falcons"]
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

  const user = await prisma.user.create({ data: { name: "Аналитик" } });
  const createdBookmakers = await Promise.all(bookmakers.map((bookmaker) => prisma.bookmaker.create({ data: bookmaker })));

  const createdTeams: Record<"cs2" | "dota2", Team[]> = { cs2: [], dota2: [] };
  for (const game of ["cs2", "dota2"] as const) {
    for (const name of teams[game]) {
      createdTeams[game].push(await prisma.team.create({ data: { name, game, externalIds: JSON.stringify({ mock: name.toLowerCase().replaceAll(" ", "-") }) } }));
    }
  }

  const tournaments = {
    cs2: await prisma.tournament.create({
      data: { name: "IEM Cologne 2026", game: "cs2", startDate: hoursFromNow(-48), endDate: hoursFromNow(72), tier: "S", externalIds: JSON.stringify({ mock: "iem-cologne-2026" }) }
    }),
    dota2: await prisma.tournament.create({
      data: { name: "DreamLeague Season 27", game: "dota2", startDate: hoursFromNow(-24), endDate: hoursFromNow(96), tier: "S", externalIds: JSON.stringify({ mock: "dreamleague-season-27" }) }
    })
  };

  const matchSpecs = [
    ["cs2", 0, 1, 2, "prematch", "BO3", 91],
    ["cs2", 2, 3, 5, "prematch", "BO3", 83],
    ["cs2", 4, 0, 21, "prematch", "BO1", 68],
    ["cs2", 1, 3, -1, "live", "BO3", 74],
    ["cs2", 2, 4, -7, "finished", "BO3", 52],
    ["dota2", 0, 1, 1, "prematch", "BO3", 95],
    ["dota2", 2, 3, 4, "prematch", "BO3", 88],
    ["dota2", 4, 0, 19, "prematch", "BO5", 76],
    ["dota2", 1, 2, -2, "live", "BO3", 82],
    ["dota2", 3, 4, -8, "finished", "BO3", 58]
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
        decisionNotes: status === "live" ? "Матч уже идет: сначала проверить текущую карту, экономику/драфт и скорость движения линии." : null
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
        { matchId: match.id, type: "LINE_DROP", severity: "medium", title: "Падение коэффициента", explanation: "Один из исходов просел более чем на 5% за последние часы. Стоит проверить причину движения." },
        { matchId: match.id, type: "BOOKMAKER_SPREAD", severity: "low", title: "Разница между букмекерами", explanation: "Лучший коэффициент заметно отличается между букмекерами. Есть смысл сравнить рынок перед решением." }
      ]
    });
  }

  for (const match of matches.filter((item) => item.status === "prematch").slice(0, 3)) {
    await prisma.watchlistItem.create({ data: { userId: user.id, matchId: match.id } });
  }

  for (const match of matches) {
    const teamA = await prisma.team.findUniqueOrThrow({ where: { id: match.teamAId } });
    const teamB = await prisma.team.findUniqueOrThrow({ where: { id: match.teamBId } });
    await prisma.newsItem.create({
      data: {
        matchId: match.id,
        game: match.game,
        title: `${teamA.name} против ${teamB.name}: проверка формы и контекста перед матчем`,
        url: "https://example.com/esports-context",
        source: "Демо-лента",
        impactScore: Math.floor(Math.random() * 4) + 1,
        publishedAt: hoursFromNow(-Math.floor(Math.random() * 10))
      }
    });
  }

  await prisma.betJournalEntry.createMany({
    data: [
      { matchId: matches[0].id, bookmakerId: createdBookmakers[0].id, selectedOutcome: "Победа Team Spirit", odds: 1.82, stake: 100, reasoning: "Линия начала двигаться в сторону Team Spirit. Перед решением нужно проверить выбор карт и текущую форму NAVI.", confidence: 3, result: "pending", tags: JSON.stringify(["prematch", "line-move", "value"]) },
      { matchId: matches[5].id, bookmakerId: createdBookmakers[2].id, selectedOutcome: "Победа BetBoom Team", odds: 2.08, stake: 75, reasoning: "У Team Spirit сильнее общий рейтинг, но рынок дает завышенный коэффициент на BetBoom Team после новостного фона.", confidence: 4, result: "won", profitLoss: 81, tags: JSON.stringify(["prematch", "news-based"]) },
      { matchId: matches[8].id, bookmakerId: createdBookmakers[1].id, selectedOutcome: "Победа BetBoom Team", odds: 1.7, stake: 50, reasoning: "Решение по ходу матча было принято слишком быстро после первой карты. Отметить как эмоциональный вход.", confidence: 2, result: "lost", profitLoss: -50, tags: JSON.stringify(["live", "emotional"]) }
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
