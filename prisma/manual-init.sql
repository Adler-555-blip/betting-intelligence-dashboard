PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS "User" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "email" TEXT UNIQUE,
  "name" TEXT NOT NULL,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "Team" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "name" TEXT NOT NULL,
  "game" TEXT NOT NULL,
  "logoUrl" TEXT,
  "externalIds" TEXT
);

CREATE TABLE IF NOT EXISTS "Tournament" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "name" TEXT NOT NULL,
  "game" TEXT NOT NULL,
  "startDate" DATETIME NOT NULL,
  "endDate" DATETIME,
  "tier" TEXT,
  "externalIds" TEXT
);

CREATE TABLE IF NOT EXISTS "Match" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "game" TEXT NOT NULL,
  "teamAId" TEXT NOT NULL,
  "teamBId" TEXT NOT NULL,
  "tournamentId" TEXT NOT NULL,
  "startTime" DATETIME NOT NULL,
  "status" TEXT NOT NULL,
  "format" TEXT NOT NULL,
  "importanceScore" INTEGER NOT NULL,
  "externalIds" TEXT,
  "decisionNotes" TEXT,
  CONSTRAINT "Match_teamAId_fkey" FOREIGN KEY ("teamAId") REFERENCES "Team" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "Match_teamBId_fkey" FOREIGN KEY ("teamBId") REFERENCES "Team" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "Match_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "Tournament" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "Bookmaker" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS "OddsSnapshot" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "matchId" TEXT NOT NULL,
  "bookmakerId" TEXT NOT NULL,
  "market" TEXT NOT NULL,
  "selection" TEXT NOT NULL,
  "odds" REAL NOT NULL,
  "timestamp" DATETIME NOT NULL,
  CONSTRAINT "OddsSnapshot_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "OddsSnapshot_bookmakerId_fkey" FOREIGN KEY ("bookmakerId") REFERENCES "Bookmaker" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "OddsSnapshot_matchId_timestamp_idx" ON "OddsSnapshot" ("matchId", "timestamp");
CREATE INDEX IF NOT EXISTS "OddsSnapshot_bookmakerId_timestamp_idx" ON "OddsSnapshot" ("bookmakerId", "timestamp");

CREATE TABLE IF NOT EXISTS "Signal" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "matchId" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "severity" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "explanation" TEXT NOT NULL,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Signal_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "WatchlistItem" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "userId" TEXT,
  "matchId" TEXT NOT NULL,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "WatchlistItem_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "WatchlistItem_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "WatchlistItem_userId_matchId_key" ON "WatchlistItem" ("userId", "matchId");

CREATE TABLE IF NOT EXISTS "BetJournalEntry" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "matchId" TEXT NOT NULL,
  "bookmakerId" TEXT,
  "selectedOutcome" TEXT NOT NULL,
  "odds" REAL NOT NULL,
  "stake" REAL,
  "reasoning" TEXT NOT NULL,
  "confidence" INTEGER NOT NULL,
  "result" TEXT NOT NULL DEFAULT 'pending',
  "profitLoss" REAL,
  "tags" TEXT NOT NULL,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL,
  CONSTRAINT "BetJournalEntry_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "BetJournalEntry_bookmakerId_fkey" FOREIGN KEY ("bookmakerId") REFERENCES "Bookmaker" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "NewsItem" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "matchId" TEXT,
  "teamId" TEXT,
  "game" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "url" TEXT NOT NULL,
  "source" TEXT NOT NULL,
  "impactScore" INTEGER,
  "publishedAt" DATETIME NOT NULL,
  CONSTRAINT "NewsItem_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "NewsItem_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "EdgeTrackingEntry" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "matchId" TEXT NOT NULL,
  "edgeType" TEXT NOT NULL,
  "signalStrength" INTEGER NOT NULL,
  "systemProbability" REAL,
  "predictedOutcome" TEXT NOT NULL,
  "relatedMarket" TEXT NOT NULL,
  "bookmakerOdds" REAL,
  "impliedProbability" INTEGER,
  "edgePercent" REAL,
  "dataQualityScore" INTEGER,
  "modelVersion" TEXT,
  "featureSnapshot" TEXT,
  "actualOutcome" TEXT,
  "status" TEXT NOT NULL DEFAULT 'pending',
  "profitLoss" REAL,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "resolvedAt" DATETIME,
  CONSTRAINT "EdgeTrackingEntry_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "EdgeTrackingEntry_matchId_edgeType_relatedMarket_key" ON "EdgeTrackingEntry" ("matchId", "edgeType", "relatedMarket");
CREATE INDEX IF NOT EXISTS "EdgeTrackingEntry_status_idx" ON "EdgeTrackingEntry" ("status");
CREATE INDEX IF NOT EXISTS "EdgeTrackingEntry_edgeType_idx" ON "EdgeTrackingEntry" ("edgeType");
CREATE INDEX IF NOT EXISTS "EdgeTrackingEntry_signalStrength_idx" ON "EdgeTrackingEntry" ("signalStrength");
CREATE INDEX IF NOT EXISTS "EdgeTrackingEntry_systemProbability_idx" ON "EdgeTrackingEntry" ("systemProbability");
CREATE INDEX IF NOT EXISTS "EdgeTrackingEntry_dataQualityScore_idx" ON "EdgeTrackingEntry" ("dataQualityScore");
