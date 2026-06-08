"use client";

import { useEffect, useMemo, useState } from "react";

type SurveyState = Record<string, string>;

const questions = [
  "Какие 3 блока самые полезные?",
  "Какие блоки бесполезны?",
  "Каких данных не хватает?",
  "Какие данные ты ищешь вручную?",
  "Что нужно поднять выше?",
  "Что можно убрать?"
];

export function PreBetSurvey({ matchId }: { matchId: string }) {
  const storageKey = useMemo(() => `pre-bet-survey:${matchId}`, [matchId]);
  const [answers, setAnswers] = useState<SurveyState>({});

  useEffect(() => {
    const saved = window.localStorage.getItem(storageKey);
    if (!saved) return;

    try {
      setAnswers(JSON.parse(saved) as SurveyState);
    } catch {
      setAnswers({});
    }
  }, [storageKey]);

  useEffect(() => {
    window.localStorage.setItem(storageKey, JSON.stringify(answers));
  }, [answers, storageKey]);

  return (
    <section className="terminal-card p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="metric-label">First Impression v0.4</p>
          <h2 className="mt-1 text-2xl font-semibold">Что ты смотришь перед ставкой?</h2>
          <p className="mt-2 max-w-3xl text-sm text-terminal-muted">
            Ответы сохраняются только в этом браузере. Блок нужен, чтобы понять, какие данные реально помогают беттору.
          </p>
        </div>
        <span className="rounded border border-terminal-yellow/40 bg-terminal-yellow/10 px-3 py-2 text-sm font-semibold text-terminal-yellow">
          Демо-анкета
        </span>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        {questions.map((question, index) => (
          <label key={question} className="block rounded border border-terminal-border bg-terminal-bg p-4">
            <span className="metric-label">Вопрос {index + 1}</span>
            <span className="mt-1 block font-semibold">{question}</span>
            <textarea
              value={answers[question] ?? ""}
              onChange={(event) => setAnswers((current) => ({ ...current, [question]: event.target.value }))}
              rows={3}
              className="mt-3 w-full rounded border border-terminal-border bg-terminal-panel p-3 text-sm outline-none focus:border-terminal-green"
              placeholder="Ответ беттора"
            />
          </label>
        ))}
      </div>
    </section>
  );
}
