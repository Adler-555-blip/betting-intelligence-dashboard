export function gameLabel(game: string) {
  if (game === "dota2") return "Dota 2";
  if (game === "football") return "Футбол";
  return "CS2";
}

export function statusLabel(status: string) {
  const labels: Record<string, string> = {
    prematch: "До матча",
    live: "Идет",
    finished: "Завершен"
  };
  return labels[status] ?? status;
}

export function movementLabel(movement: string) {
  const labels: Record<string, string> = {
    up: "Рост",
    down: "Падение",
    stable: "Без изменений"
  };
  return labels[movement] ?? movement;
}

export function severityLabel(severity: string) {
  const labels: Record<string, string> = {
    low: "низкая",
    medium: "средняя",
    high: "высокая"
  };
  return labels[severity] ?? severity;
}

export function resultLabel(result: string) {
  const labels: Record<string, string> = {
    pending: "Ожидает",
    won: "Выигрыш",
    lost: "Проигрыш",
    void: "Возврат"
  };
  return labels[result] ?? result;
}

export function tagLabel(tag: string) {
  const labels: Record<string, string> = {
    prematch: "до матча",
    live: "в игре",
    value: "ценность",
    emotional: "эмоционально",
    "news-based": "по новостям",
    "line-move": "движение линии"
  };
  return labels[tag] ?? tag;
}

export function signalTypeLabel(type: string) {
  const labels: Record<string, string> = {
    LINE_DROP: "Падение коэффициента",
    LINE_RISE: "Рост коэффициента",
    BOOKMAKER_SPREAD: "Разница между букмекерами",
    CONSENSUS_MOVE: "Согласованное движение",
    MATCH_SOON: "Матч скоро",
    WATCHLIST_ALERT: "Событие из списка наблюдения"
  };
  return labels[type] ?? type;
}
