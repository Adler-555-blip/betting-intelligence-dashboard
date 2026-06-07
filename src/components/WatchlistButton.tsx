"use client";

import { Eye } from "lucide-react";
import { useState } from "react";

export function WatchlistButton({ matchId, initialActive }: { matchId: string; initialActive: boolean }) {
  const [active, setActive] = useState(initialActive);
  const [busy, setBusy] = useState(false);

  async function toggle() {
    setBusy(true);
    const response = await fetch("/api/watchlist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ matchId })
    });
    if (response.ok) setActive(true);
    setBusy(false);
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={busy || active}
      title="Add to Watchlist"
      className="inline-flex h-9 items-center gap-2 rounded border border-terminal-border px-3 text-sm text-terminal-text hover:border-terminal-green disabled:opacity-60"
    >
      <Eye size={16} /> {active ? "Watching" : "Watchlist"}
    </button>
  );
}
