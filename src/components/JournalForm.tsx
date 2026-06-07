"use client";

import { useState } from "react";

type MatchOption = { id: string; label: string };
type BookmakerOption = { id: string; name: string };

export function JournalForm({ matches, bookmakers, defaultMatchId }: { matches: MatchOption[]; bookmakers: BookmakerOption[]; defaultMatchId?: string }) {
  const [message, setMessage] = useState("");

  async function submit(formData: FormData) {
    setMessage("");
    const response = await fetch("/api/journal", {
      method: "POST",
      body: JSON.stringify(Object.fromEntries(formData.entries())),
      headers: { "Content-Type": "application/json" }
    });
    setMessage(response.ok ? "Запись сохранена" : "Не удалось сохранить запись");
    if (response.ok) window.location.reload();
  }

  return (
    <form action={submit} className="terminal-card grid gap-4 p-4 md:grid-cols-2">
      <label className="space-y-2">
        <span className="metric-label">Матч</span>
        <select name="matchId" defaultValue={defaultMatchId} className="w-full rounded border border-terminal-border bg-terminal-bg p-3">
          {matches.map((match) => <option key={match.id} value={match.id}>{match.label}</option>)}
        </select>
      </label>
      <label className="space-y-2">
        <span className="metric-label">Букмекер</span>
        <select name="bookmakerId" className="w-full rounded border border-terminal-border bg-terminal-bg p-3">
          <option value="">Ручной ввод / без букмекера</option>
          {bookmakers.map((bookmaker) => <option key={bookmaker.id} value={bookmaker.id}>{bookmaker.name}</option>)}
        </select>
      </label>
      <label className="space-y-2">
        <span className="metric-label">Выбранный исход</span>
        <input name="selectedOutcome" required placeholder="Победа первой команды / тотал карт / фора" className="w-full rounded border border-terminal-border bg-terminal-bg p-3" />
      </label>
      <label className="space-y-2">
        <span className="metric-label">Коэффициент</span>
        <input name="odds" required type="number" step="0.01" min="1" className="w-full rounded border border-terminal-border bg-terminal-bg p-3" />
      </label>
      <label className="space-y-2">
        <span className="metric-label">Сумма, опционально</span>
        <input name="stake" type="number" step="0.01" className="w-full rounded border border-terminal-border bg-terminal-bg p-3" />
      </label>
      <label className="space-y-2">
        <span className="metric-label">Уверенность 1-5</span>
        <input name="confidence" required type="number" min="1" max="5" defaultValue="3" className="w-full rounded border border-terminal-border bg-terminal-bg p-3" />
      </label>
      <label className="space-y-2 md:col-span-2">
        <span className="metric-label">Логика решения</span>
        <textarea name="reasoning" required rows={4} className="w-full rounded border border-terminal-border bg-terminal-bg p-3" />
      </label>
      <label className="space-y-2 md:col-span-2">
        <span className="metric-label">Теги</span>
        <input name="tags" placeholder="до матча, ценность, движение линии" className="w-full rounded border border-terminal-border bg-terminal-bg p-3" />
      </label>
      <div className="flex items-center gap-3 md:col-span-2">
        <button className="rounded bg-terminal-green px-4 py-3 font-semibold text-black" type="submit">Сохранить запись</button>
        {message && <span className="text-sm text-terminal-muted">{message}</span>}
      </div>
    </form>
  );
}
