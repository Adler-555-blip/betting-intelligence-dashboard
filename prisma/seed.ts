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
  dota2: ["Team Spirit", "BetBoom Team", "Tundra", "Gaimin Gladiators", "Team Falcons"],
  football: ["Mexico", "South Africa", "Canada", "Switzerland", "Brazil", "Scotland", "Morocco", "Haiti", "Germany", "England", "Argentina", "France", "Spain", "Portugal", "Korea Republic", "Czechia"]
};

function hoursFromNow(hours: number) {
  return new Date(Date.now() + hours * 60 * 60 * 1000);
}

function oddsValue(base: number, step: number, sideBias: number) {
  return Number((base + Math.sin(step / 2 + sideBias) * 0.12 + sideBias * 0.04).toFixed(2));
}

async function main() {
  await prisma.betJournalEntry.deleteMany();
  await prisma.edgeTrackingEntry.deleteMany();
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

  const createdTeams: Record<"cs2" | "dota2" | "football", Team[]> = { cs2: [], dota2: [], football: [] };
  for (const game of ["cs2", "dota2", "football"] as const) {
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
    }),
    football: await prisma.tournament.create({
      data: {
        name: "FIFA World Cup 2026",
        game: "football",
        startDate: new Date("2026-06-11T00:00:00.000Z"),
        endDate: new Date("2026-07-19T00:00:00.000Z"),
        tier: "World Cup",
        externalIds: JSON.stringify({ source: "FIFA", officialSchedule: "2026-06-11 to 2026-07-19" })
      }
    })
  };

  const footballScheduleMeta: Record<string, { officialDate: string; venue: string; scheduleKind: "official" | "demo"; source: string }> = {
    "Mexico-South Africa": { officialDate: "11 июня 2026", venue: "Mexico City Stadium", scheduleKind: "official", source: "FIFA match schedule" },
    "Switzerland-Canada": { officialDate: "13 июня 2026", venue: "BC Place Vancouver", scheduleKind: "official", source: "FIFA match schedule" },
    "Scotland-Brazil": { officialDate: "13 июня 2026", venue: "Miami Stadium", scheduleKind: "official", source: "FIFA match schedule" },
    "Morocco-Haiti": { officialDate: "13 июня 2026", venue: "Atlanta Stadium", scheduleKind: "official", source: "FIFA match schedule" },
    "South Africa-Korea Republic": { officialDate: "18 июня 2026", venue: "Estadio Monterrey", scheduleKind: "official", source: "FIFA match schedule" },
    "Czechia-Mexico": { officialDate: "24 июня 2026", venue: "Mexico City Stadium", scheduleKind: "official", source: "FIFA match schedule" },
    "Germany-England": { officialDate: "Демо-матч в окне группового этапа", venue: "Демо-площадка", scheduleKind: "demo", source: "Demo fixture" },
    "Argentina-France": { officialDate: "Демо-матч в окне группового этапа", venue: "Демо-площадка", scheduleKind: "demo", source: "Demo fixture" },
    "Spain-Portugal": { officialDate: "Демо-матч в окне группового этапа", venue: "Демо-площадка", scheduleKind: "demo", source: "Demo fixture" }
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
    ["dota2", 3, 4, -8, "finished", "BO3", 58],
    ["football", 0, 1, 3, "prematch", "Group A", 96],
    ["football", 3, 2, 8, "prematch", "Group B", 90],
    ["football", 5, 4, 14, "prematch", "Group C", 93],
    ["football", 6, 7, 25, "prematch", "Group C", 78],
    ["football", 1, 14, 31, "prematch", "Group A", 86],
    ["football", 15, 0, 39, "prematch", "Group A", 82],
    ["football", 8, 9, 45, "prematch", "Group stage", 86],
    ["football", 10, 11, 46, "prematch", "Group stage", 92],
    ["football", 12, 13, 47, "prematch", "Group stage", 88]
  ] as const;

  const matches = [];
  for (const [game, aIndex, bIndex, startOffset, status, format, importanceScore] of matchSpecs) {
    const teamAName = createdTeams[game][aIndex].name;
    const teamBName = createdTeams[game][bIndex].name;
    const footballMeta = game === "football" ? footballScheduleMeta[`${teamAName}-${teamBName}`] : undefined;
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
        externalIds: JSON.stringify(game === "football" ? {
          source: footballMeta?.source ?? "Demo fixture",
          mock: `${game}-${aIndex}-${bIndex}`,
          officialDate: footballMeta?.officialDate ?? "Демо-матч в окне турнира",
          venue: footballMeta?.venue ?? "Демо-площадка",
          scheduleKind: footballMeta?.scheduleKind ?? "demo",
          officialTournamentWindow: "11 June - 19 July 2026"
        } : { mock: `${game}-${aIndex}-${bIndex}` }),
        decisionNotes: game === "football"
          ? "Демо-время сдвинуто ближе к текущей дате, чтобы матч отображался в рабочем дашборде. Турнирный контекст основан на расписании FIFA World Cup 2026."
          : status === "live" ? "Матч уже идет: сначала проверить текущую карту, экономику/драфт и скорость движения линии." : null
      }
    }));
  }

  for (const match of matches) {
    for (const bookmaker of createdBookmakers) {
      for (let step = 6; step >= 0; step -= 1) {
        const timestamp = new Date(Date.now() - step * 60 * 60 * 1000);
        const baseA = match.game === "football" ? 2.05 : match.game === "cs2" ? 1.78 : 1.86;
        const baseB = match.game === "football" ? 2.75 : match.game === "cs2" ? 2.02 : 1.94;
        const oddsData = [
          { matchId: match.id, bookmakerId: bookmaker.id, market: match.game === "football" ? "1x2" : "winner", selection: "teamA", odds: oddsValue(baseA, step, bookmaker.slug.length / 20), timestamp },
          { matchId: match.id, bookmakerId: bookmaker.id, market: match.game === "football" ? "1x2" : "winner", selection: "teamB", odds: oddsValue(baseB, step, -bookmaker.slug.length / 24), timestamp }
        ];
        if (match.game === "football") {
          oddsData.push({ matchId: match.id, bookmakerId: bookmaker.id, market: "1x2", selection: "draw", odds: oddsValue(3.25, step, bookmaker.slug.length / 30), timestamp });
        }
        await prisma.oddsSnapshot.createMany({ data: oddsData });
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

  await prisma.edgeTrackingEntry.createMany({
    data: [
      { matchId: matches[0].id, edgeType: "Map Edge", signalStrength: 78, predictedOutcome: "Team Spirit сильнее на Mirage", relatedMarket: "Map Edge / winner", bookmakerOdds: 1.82, impliedProbability: 55, actualOutcome: "Карта подтвердила преимущество Team Spirit", status: "hit", profitLoss: 82, resolvedAt: hoursFromNow(-4) },
      { matchId: matches[0].id, edgeType: "Player Edge", signalStrength: 71, predictedOutcome: "donk: высокий объем киллов", relatedMarket: "Player kills", bookmakerOdds: 1.9, impliedProbability: 53, actualOutcome: "Игрок прошел условную линию", status: "hit", profitLoss: 90, resolvedAt: hoursFromNow(-3) },
      { matchId: matches[1].id, edgeType: "CT/T Edge", signalStrength: 64, predictedOutcome: "CT/T профиль Ancient", relatedMarket: "Rounds / side profile", bookmakerOdds: 1.95, impliedProbability: 51, actualOutcome: "Сторона не дала ожидаемого преимущества", status: "miss", profitLoss: -100, resolvedAt: hoursFromNow(-2) },
      { matchId: matches[2].id, edgeType: "Tournament Edge", signalStrength: 69, predictedOutcome: "Формат BO1 повышает дисперсию", relatedMarket: "Tournament context", bookmakerOdds: null, impliedProbability: null, actualOutcome: "Фактор подтвердился частично", status: "void", profitLoss: 0, resolvedAt: hoursFromNow(-1) },
      { matchId: matches[5].id, edgeType: "Line Movement Edge", signalStrength: 73, predictedOutcome: "Движение линии в сторону BetBoom Team", relatedMarket: "winner", bookmakerOdds: 2.08, impliedProbability: 48, actualOutcome: "Линия двигалась верно", status: "hit", profitLoss: 108, resolvedAt: hoursFromNow(-6) },
      { matchId: matches[6].id, edgeType: "Player Edge", signalStrength: 58, predictedOutcome: "Fallback player profile", relatedMarket: "Player props", bookmakerOdds: null, impliedProbability: null, actualOutcome: "Недостаточно подтверждения", status: "miss", profitLoss: -50, resolvedAt: hoursFromNow(-7) },
      { matchId: matches[10].id, edgeType: "Tournament Edge", signalStrength: 66, predictedOutcome: "Mexico получает турнирный контекст открытия", relatedMarket: "1x2", bookmakerOdds: 2.05, impliedProbability: 49, actualOutcome: null, status: "pending" },
      { matchId: matches[10].id, edgeType: "Line Movement Edge", signalStrength: 62, predictedOutcome: "Демо-движение линии 1X2", relatedMarket: "1x2", bookmakerOdds: 3.25, impliedProbability: 31, actualOutcome: null, status: "pending" }
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
