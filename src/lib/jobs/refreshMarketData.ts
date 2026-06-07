import cron from "node-cron";
import { prisma } from "../prisma";
import { evaluateSignals } from "../signals";

export async function refreshMarketData() {
  const matches = await prisma.match.findMany({ include: { oddsSnapshots: true } });
  for (const match of matches) {
    const generated = evaluateSignals(match);
    for (const signal of generated) {
      await prisma.signal.create({ data: signal });
    }
  }
}

if (process.env.RUN_CRON === "true") {
  cron.schedule("*/15 * * * *", () => {
    refreshMarketData().catch((error) => console.error("Market refresh failed", error));
  });
}
