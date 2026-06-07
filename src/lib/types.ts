export type Movement = "up" | "down" | "stable";

export type OddsCell = {
  bookmaker: string;
  bookmakerSlug: string;
  teamA: number | null;
  teamB: number | null;
  draw?: number | null;
  lastUpdated: Date | null;
  changeA: number;
  changeB: number;
};
