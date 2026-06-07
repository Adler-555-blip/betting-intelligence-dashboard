"use client";

import { useEffect, useMemo, useState } from "react";

type Vote = "useful" | "not_needed" | "missing_data";

type Feedback = {
  vote?: Vote;
  comment: string;
};

const blocks = [
  "Рейтинг команды",
  "Форма команды",
  "Очные встречи",
  "Карты",
  "CT/T стороны",
  "Состав",
  "Статистика игроков",
  "Киллы игроков",
  "Турнирный контекст",
  "Движение линии",
  "Факторы за/против",
  "Match Intelligence Score"
];

const voteLabels: Record<Vote, string> = {
  useful: "Полезно",
  not_needed: "Не нужно",
  missing_data: "Не хватает данных"
};

export function BlockUsefulnessFeedback({ matchId }: { matchId: string }) {
  const storageKey = useMemo(() => `match-feedback:${matchId}`, [matchId]);
  const [feedback, setFeedback] = useState<Record<string, Feedback>>({});

  useEffect(() => {
    const saved = window.localStorage.getItem(storageKey);
    if (saved) {
      try {
        setFeedback(JSON.parse(saved) as Record<string, Feedback>);
      } catch {
        setFeedback({});
      }
    }
  }, [storageKey]);

  useEffect(() => {
    window.localStorage.setItem(storageKey, JSON.stringify(feedback));
  }, [feedback, storageKey]);

  function update(block: string, patch: Partial<Feedback>) {
    setFeedback((current) => ({
      ...current,
      [block]: {
        ...(current[block] ?? { comment: "" }),
        ...patch
      }
    }));
  }

  return (
    <section className="terminal-card p-5">
      <div>
        <p className="metric-label">User Validation v0.3</p>
        <h2 className="mt-1 text-2xl font-semibold">Оценка полезности блоков</h2>
        <p className="mt-2 max-w-3xl text-sm text-terminal-muted">
          Оценка сохраняется локально в браузере. Это быстрый способ собрать обратную связь от опытного беттора без авторизации.
        </p>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        {blocks.map((block) => {
          const value = feedback[block];
          return (
            <div key={block} className="rounded border border-terminal-border bg-terminal-bg p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h3 className="font-semibold">{block}</h3>
                <div className="flex flex-wrap gap-2">
                  {(Object.keys(voteLabels) as Vote[]).map((vote) => (
                    <button
                      key={vote}
                      type="button"
                      onClick={() => update(block, { vote })}
                      className={`rounded border px-2 py-1 text-xs ${
                        value?.vote === vote
                          ? "border-terminal-green bg-terminal-green/15 text-terminal-green"
                          : "border-terminal-border text-terminal-muted hover:text-terminal-text"
                      }`}
                    >
                      {voteLabels[vote]}
                    </button>
                  ))}
                </div>
              </div>
              <label className="mt-3 block">
                <span className="metric-label">Комментарий беттора</span>
                <textarea
                  value={value?.comment ?? ""}
                  onChange={(event) => update(block, { comment: event.target.value })}
                  rows={2}
                  className="mt-2 w-full rounded border border-terminal-border bg-terminal-panel p-3 text-sm outline-none focus:border-terminal-green"
                  placeholder="Что полезно, что убрать, какие данные нужны?"
                />
              </label>
            </div>
          );
        })}
      </div>
    </section>
  );
}
