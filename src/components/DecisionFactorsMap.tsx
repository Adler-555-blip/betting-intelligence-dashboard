"use client";

import { useEffect, useMemo, useState } from "react";

type FactorStatus = "Уже есть в продукте" | "Нужно добавить" | "Неясно, спросить беттора";
type DataType = "Real" | "Demo" | "Not connected";
type Usefulness = "Очень важно" | "Полезно" | "Не нужно" | "Не знаю";

type DecisionFactor = {
  name: string;
  status: FactorStatus;
  dataType: DataType;
  source: string;
};

type FactorSection = {
  title: string;
  description: string;
  factors: DecisionFactor[];
};

const usefulnessOptions: Usefulness[] = ["Очень важно", "Полезно", "Не нужно", "Не знаю"];

const sections: FactorSection[] = [
  {
    title: "CS2",
    description: "Карта факторов для оценки силы команд, map pool, игроков и движения линии.",
    factors: [
      { name: "HLTV Ranking", status: "Нужно добавить", dataType: "Not connected", source: "HLTV / PandaScore" },
      { name: "Динамика рейтинга", status: "Нужно добавить", dataType: "Not connected", source: "HLTV / PandaScore" },
      { name: "Последние 5 матчей", status: "Уже есть в продукте", dataType: "Demo", source: "Demo" },
      { name: "Последние 10 матчей", status: "Уже есть в продукте", dataType: "Demo", source: "Demo" },
      { name: "Серия побед/поражений", status: "Уже есть в продукте", dataType: "Demo", source: "Demo" },
      { name: "Map Pool", status: "Уже есть в продукте", dataType: "Demo", source: "Demo / HLTV" },
      { name: "Winrate по картам", status: "Уже есть в продукте", dataType: "Demo", source: "Demo / HLTV" },
      { name: "CT Winrate", status: "Уже есть в продукте", dataType: "Demo", source: "Demo / HLTV" },
      { name: "T Winrate", status: "Уже есть в продукте", dataType: "Demo", source: "Demo / HLTV" },
      { name: "CT/T баланс карты", status: "Уже есть в продукте", dataType: "Demo", source: "Demo / HLTV" },
      { name: "Pistol Round Win %", status: "Нужно добавить", dataType: "Not connected", source: "HLTV / PandaScore" },
      { name: "Entry Kills", status: "Нужно добавить", dataType: "Not connected", source: "HLTV / PandaScore" },
      { name: "K/D игроков", status: "Уже есть в продукте", dataType: "Demo", source: "Demo / HLTV" },
      { name: "ADR игроков", status: "Уже есть в продукте", dataType: "Demo", source: "Demo / HLTV" },
      { name: "Средние киллы игроков", status: "Уже есть в продукте", dataType: "Demo", source: "Demo / HLTV" },
      { name: "Лучшие карты игроков", status: "Уже есть в продукте", dataType: "Demo", source: "Demo / HLTV" },
      { name: "Очные встречи", status: "Уже есть в продукте", dataType: "Demo", source: "Demo / HLTV" },
      { name: "Состав", status: "Уже есть в продукте", dataType: "Demo", source: "Demo / Liquipedia" },
      { name: "Замены / stand-in", status: "Нужно добавить", dataType: "Not connected", source: "Liquipedia / PandaScore" },
      { name: "LAN / Online", status: "Нужно добавить", dataType: "Not connected", source: "Liquipedia / HLTV" },
      { name: "История veto", status: "Нужно добавить", dataType: "Not connected", source: "HLTV" },
      { name: "Движение коэффициентов", status: "Уже есть в продукте", dataType: "Demo", source: "Demo / The Odds API" }
    ]
  },
  {
    title: "Dota 2",
    description: "Факторы для проверки формы, состава, патча, героев и игровых метрик.",
    factors: [
      { name: "Рейтинг команды", status: "Нужно добавить", dataType: "Not connected", source: "OpenDota / PandaScore" },
      { name: "Последние 5 матчей", status: "Уже есть в продукте", dataType: "Real", source: "OpenDota" },
      { name: "Последние 10 матчей", status: "Уже есть в продукте", dataType: "Real", source: "OpenDota" },
      { name: "Серия побед/поражений", status: "Уже есть в продукте", dataType: "Real", source: "OpenDota" },
      { name: "Состав", status: "Уже есть в продукте", dataType: "Demo", source: "Demo / Liquipedia" },
      { name: "Замены", status: "Нужно добавить", dataType: "Not connected", source: "Liquipedia / PandaScore" },
      { name: "Текущий патч", status: "Уже есть в продукте", dataType: "Demo", source: "Demo / OpenDota" },
      { name: "Результаты команды на патче", status: "Нужно добавить", dataType: "Not connected", source: "OpenDota" },
      { name: "Сигнатурные герои игроков", status: "Нужно добавить", dataType: "Not connected", source: "OpenDota / STRATZ" },
      { name: "Winrate героев", status: "Нужно добавить", dataType: "Not connected", source: "OpenDota / STRATZ" },
      { name: "KDA игроков", status: "Нужно добавить", dataType: "Not connected", source: "OpenDota" },
      { name: "GPM", status: "Нужно добавить", dataType: "Not connected", source: "OpenDota" },
      { name: "XPM", status: "Нужно добавить", dataType: "Not connected", source: "OpenDota" },
      { name: "First Blood %", status: "Нужно добавить", dataType: "Not connected", source: "OpenDota" },
      { name: "Roshan control", status: "Нужно добавить", dataType: "Not connected", source: "OpenDota / STRATZ" },
      { name: "Очные встречи", status: "Уже есть в продукте", dataType: "Demo", source: "Demo / OpenDota" },
      { name: "Длительность матчей", status: "Нужно добавить", dataType: "Not connected", source: "OpenDota" },
      { name: "Движение коэффициентов", status: "Уже есть в продукте", dataType: "Demo", source: "Demo / The Odds API" }
    ]
  },
  {
    title: "World Cup 2026",
    description: "Футбольная карта факторов для группового этапа, мотивации, составов и рынков.",
    factors: [
      { name: "Группа", status: "Уже есть в продукте", dataType: "Real", source: "FIFA / Demo seed" },
      { name: "Место в группе", status: "Нужно добавить", dataType: "Not connected", source: "API-Football / Sportmonks" },
      { name: "Очки", status: "Нужно добавить", dataType: "Not connected", source: "API-Football / Sportmonks" },
      { name: "Разница мячей", status: "Нужно добавить", dataType: "Not connected", source: "API-Football / Sportmonks" },
      { name: "Турнирная мотивация", status: "Уже есть в продукте", dataType: "Demo", source: "Demo / FIFA context" },
      { name: "Нужно ли побеждать", status: "Неясно, спросить беттора", dataType: "Not connected", source: "API-Football / Sportmonks" },
      { name: "Достаточно ли ничьей", status: "Неясно, спросить беттора", dataType: "Not connected", source: "API-Football / Sportmonks" },
      { name: "Последние 5 матчей сборной", status: "Уже есть в продукте", dataType: "Demo", source: "Demo / API-Football" },
      { name: "Последние 10 матчей сборной", status: "Уже есть в продукте", dataType: "Demo", source: "Demo / API-Football" },
      { name: "FIFA Ranking", status: "Уже есть в продукте", dataType: "Demo", source: "Demo / FIFA" },
      { name: "Динамика рейтинга", status: "Нужно добавить", dataType: "Not connected", source: "FIFA / API-Football" },
      { name: "Состав", status: "Нужно добавить", dataType: "Not connected", source: "API-Football / Sportmonks" },
      { name: "Травмы", status: "Нужно добавить", dataType: "Not connected", source: "API-Football / Sportmonks" },
      { name: "Дисквалификации", status: "Нужно добавить", dataType: "Not connected", source: "API-Football / Sportmonks" },
      { name: "Стартовый состав", status: "Нужно добавить", dataType: "Not connected", source: "API-Football / Sportmonks" },
      { name: "Домашний фактор", status: "Неясно, спросить беттора", dataType: "Demo", source: "Demo / FIFA" },
      { name: "Перелеты / климат / часовой пояс", status: "Неясно, спросить беттора", dataType: "Demo", source: "Demo / FIFA / Weather API" },
      { name: "xG", status: "Нужно добавить", dataType: "Not connected", source: "Sportmonks / API-Football" },
      { name: "xGA", status: "Нужно добавить", dataType: "Not connected", source: "Sportmonks / API-Football" },
      { name: "Удары", status: "Нужно добавить", dataType: "Not connected", source: "API-Football / Sportmonks" },
      { name: "Удары в створ", status: "Нужно добавить", dataType: "Not connected", source: "API-Football / Sportmonks" },
      { name: "Владение", status: "Нужно добавить", dataType: "Not connected", source: "API-Football / Sportmonks" },
      { name: "Личные встречи", status: "Уже есть в продукте", dataType: "Demo", source: "Demo / API-Football" },
      { name: "Тотал голов", status: "Нужно добавить", dataType: "Not connected", source: "The Odds API / API-Football" },
      { name: "BTTS / обе забьют", status: "Нужно добавить", dataType: "Not connected", source: "The Odds API / API-Football" },
      { name: "Движение коэффициентов", status: "Уже есть в продукте", dataType: "Demo", source: "Demo / The Odds API" }
    ]
  }
];

export function DecisionFactorsMap() {
  const [usefulness, setUsefulness] = useState<Record<string, Usefulness>>({});
  const storageKey = "decision-factors-map:v05";
  const totals = useMemo(() => buildTotals(sections), []);

  useEffect(() => {
    const saved = window.localStorage.getItem(storageKey);
    if (!saved) return;
    try {
      setUsefulness(JSON.parse(saved) as Record<string, Usefulness>);
    } catch {
      setUsefulness({});
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(storageKey, JSON.stringify(usefulness));
  }, [usefulness]);

  function update(section: string, factor: string, value: Usefulness) {
    setUsefulness((current) => ({
      ...current,
      [`${section}:${factor}`]: value
    }));
  }

  return (
    <div className="space-y-6">
      <section className="terminal-card p-6">
        <p className="metric-label">Decision Factors Map v0.5</p>
        <div className="mt-2 flex flex-wrap items-start justify-between gap-5">
          <div>
            <h1 className="text-3xl font-semibold">Карта факторов принятия решения</h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-terminal-muted">
              Эта страница нужна для интервью с беттором. Отметьте, какие факторы реально используются при принятии решения.
              После этого мы сможем убрать лишнее и подключить нужные источники данных.
            </p>
          </div>
          <div className="grid min-w-[280px] grid-cols-3 gap-2 text-sm">
            <StatTile label="Факторов" value={String(totals.total)} />
            <StatTile label="Уже есть" value={String(totals.inProduct)} />
            <StatTile label="Real" value={String(totals.real)} />
          </div>
        </div>
      </section>

      <section className="grid gap-3 md:grid-cols-3">
        <LegendCard title="Статус" items={["Уже есть в продукте", "Нужно добавить", "Неясно, спросить беттора"]} />
        <LegendCard title="Тип данных" items={["Real", "Demo", "Not connected"]} />
        <LegendCard title="Оценка беттора" items={usefulnessOptions} />
      </section>

      {sections.map((section) => (
        <section key={section.title} className="terminal-card overflow-hidden">
          <div className="flex flex-wrap items-start justify-between gap-4 border-b border-terminal-border p-5">
            <div>
              <p className="metric-label">Раздел</p>
              <h2 className="mt-1 text-2xl font-semibold">{section.title}</h2>
              <p className="mt-2 max-w-3xl text-sm text-terminal-muted">{section.description}</p>
            </div>
            <div className="grid grid-cols-3 gap-2 text-sm">
              <StatTile label="Всего" value={String(section.factors.length)} compact />
              <StatTile label="Есть" value={String(section.factors.filter((item) => item.status === "Уже есть в продукте").length)} compact />
              <StatTile label="API" value={String(section.factors.filter((item) => item.dataType === "Not connected").length)} compact />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[1120px] text-left text-sm">
              <thead className="border-b border-terminal-border text-xs uppercase text-terminal-muted">
                <tr>
                  <th className="px-4 py-3">Фактор</th>
                  <th className="px-4 py-3">Статус</th>
                  <th className="px-4 py-3">Тип данных</th>
                  <th className="px-4 py-3">Источник данных</th>
                  <th className="px-4 py-3">Полезность</th>
                </tr>
              </thead>
              <tbody>
                {section.factors.map((factor) => {
                  const key = `${section.title}:${factor.name}`;
                  return (
                    <tr key={key} className="border-b border-terminal-border/70 last:border-0">
                      <td className="px-4 py-4 font-medium">{factor.name}</td>
                      <td className="px-4 py-4"><StatusBadge value={factor.status} /></td>
                      <td className="px-4 py-4"><DataTypeBadge value={factor.dataType} /></td>
                      <td className="px-4 py-4 text-terminal-muted">{factor.source}</td>
                      <td className="px-4 py-4">
                        <div className="flex flex-wrap gap-2">
                          {usefulnessOptions.map((option) => (
                            <button
                              key={option}
                              type="button"
                              onClick={() => update(section.title, factor.name, option)}
                              className={`rounded border px-2 py-1 text-xs transition ${
                                usefulness[key] === option
                                  ? "border-terminal-green bg-terminal-green/15 text-terminal-green"
                                  : "border-terminal-border text-terminal-muted hover:border-terminal-green/50 hover:text-terminal-text"
                              }`}
                            >
                              {option}
                            </button>
                          ))}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      ))}
    </div>
  );
}

function buildTotals(data: FactorSection[]) {
  const factors = data.flatMap((section) => section.factors);
  return {
    total: factors.length,
    inProduct: factors.filter((factor) => factor.status === "Уже есть в продукте").length,
    real: factors.filter((factor) => factor.dataType === "Real").length
  };
}

function StatTile({ label, value, compact = false }: { label: string; value: string; compact?: boolean }) {
  return (
    <div className={`rounded border border-terminal-border bg-terminal-bg ${compact ? "p-3" : "p-4"}`}>
      <div className="metric-label">{label}</div>
      <div className={compact ? "mt-1 text-xl font-semibold text-terminal-green" : "mt-1 text-2xl font-semibold text-terminal-green"}>{value}</div>
    </div>
  );
}

function LegendCard({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="terminal-card p-4">
      <h3 className="font-semibold">{title}</h3>
      <div className="mt-3 flex flex-wrap gap-2">
        {items.map((item) => (
          <span key={item} className="rounded border border-terminal-border bg-terminal-bg px-2 py-1 text-xs text-terminal-muted">{item}</span>
        ))}
      </div>
    </div>
  );
}

function StatusBadge({ value }: { value: FactorStatus }) {
  const className =
    value === "Уже есть в продукте"
      ? "border-terminal-green/40 bg-terminal-green/10 text-terminal-green"
      : value === "Нужно добавить"
        ? "border-terminal-yellow/40 bg-terminal-yellow/10 text-terminal-yellow"
        : "border-white/15 bg-white/5 text-terminal-muted";
  return <span className={`inline-flex rounded border px-2 py-1 text-xs font-medium ${className}`}>{value}</span>;
}

function DataTypeBadge({ value }: { value: DataType }) {
  const className =
    value === "Real"
      ? "border-terminal-green/40 bg-terminal-green/10 text-terminal-green"
      : value === "Demo"
        ? "border-terminal-yellow/40 bg-terminal-yellow/10 text-terminal-yellow"
        : "border-terminal-red/40 bg-terminal-red/10 text-terminal-red";
  return <span className={`inline-flex rounded border px-2 py-1 text-xs font-medium ${className}`}>{value}</span>;
}
