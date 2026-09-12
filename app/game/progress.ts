import { CORE_LEVEL_COUNT } from './engine.ts';
import type { Session } from './session.ts';

export type ComfortSettings = {
  largeTiles: boolean;
  highContrast: boolean;
  hideTimer: boolean;
};

export const DEFAULT_COMFORT: ComfortSettings = {
  largeTiles: false,
  highContrast: false,
  hideTimer: false,
};

export type LocalStats = {
  completedGames: number;
  totalSeconds: number;
  hintsUsed: number;
  shufflesUsed: number;
  undosUsed: number;
};

export const EMPTY_STATS: LocalStats = {
  completedGames: 0,
  totalSeconds: 0,
  hintsUsed: 0,
  shufflesUsed: 0,
  undosUsed: 0,
};

export type DailyResult = {
  bestTime: number;
  bestStars: number;
  completions: number;
};

export type DailyResults = Record<string, DailyResult>;

function hashText(text: string) {
  let hash = 2166136261;
  for (const character of text) {
    hash ^= character.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export function localDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function dateFromKey(key: string) {
  const [year, month, day] = key.split('-').map(Number);
  return new Date(year, month - 1, day, 12);
}

export function dailyChallenge(date = new Date()) {
  const key = localDateKey(date);
  const level = 2 + (hashText(`garden:${key}`) % (CORE_LEVEL_COUNT - 2));
  const seed = (hashText(`jade:${key}`) % 2147483646) + 1;
  return { key, level, seed };
}

function sessionStars(session: Session) {
  return session.shuffles === 0 ? (session.hints === 0 ? 3 : 2) : 1;
}

export function recordDaily(
  current: DailyResults,
  session: Session,
): DailyResults {
  if (
    session.mode !== 'daily' ||
    !session.dailyKey ||
    session.tiles.some((tile) => !tile.removed)
  )
    return current;
  const previous = current[session.dailyKey];
  return {
    ...current,
    [session.dailyKey]: {
      bestTime: Math.min(previous?.bestTime ?? Infinity, session.seconds),
      bestStars: Math.max(previous?.bestStars ?? 0, sessionStars(session)),
      completions: (previous?.completions ?? 0) + 1,
    },
  };
}

export function recordLocalStats(current: LocalStats, session: Session) {
  if (session.tiles.some((tile) => !tile.removed)) return current;
  return {
    completedGames: current.completedGames + 1,
    totalSeconds: current.totalSeconds + session.seconds,
    hintsUsed: current.hintsUsed + session.hints,
    shufflesUsed: current.shufflesUsed + session.shuffles,
    undosUsed: current.undosUsed + session.undos,
  };
}

function previousDateKey(key: string) {
  const date = dateFromKey(key);
  date.setDate(date.getDate() - 1);
  return localDateKey(date);
}

export function currentDailyStreak(results: DailyResults, date = new Date()) {
  let key = localDateKey(date);
  if (!results[key]) key = previousDateKey(key);
  let streak = 0;
  while (results[key]) {
    streak++;
    key = previousDateKey(key);
  }
  return streak;
}

export function longestDailyStreak(results: DailyResults) {
  const keys = Object.keys(results).sort();
  let longest = 0;
  let current = 0;
  let previous = '';
  for (const key of keys) {
    current = previousDateKey(key) === previous ? current + 1 : 1;
    longest = Math.max(longest, current);
    previous = key;
  }
  return longest;
}

export function validComfort(value: unknown): value is ComfortSettings {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const settings = value as ComfortSettings;
  return [settings.largeTiles, settings.highContrast, settings.hideTimer].every(
    (option) => typeof option === 'boolean',
  );
}

export function validLocalStats(value: unknown): value is LocalStats {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const stats = value as LocalStats;
  return [
    stats.completedGames,
    stats.totalSeconds,
    stats.hintsUsed,
    stats.shufflesUsed,
    stats.undosUsed,
  ].every((number) => Number.isSafeInteger(number) && number >= 0);
}

export function validDailyResults(value: unknown): value is DailyResults {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  return Object.entries(value).every(
    ([key, result]) =>
      /^\d{4}-\d{2}-\d{2}$/.test(key) &&
      localDateKey(dateFromKey(key)) === key &&
      result !== null &&
      typeof result === 'object' &&
      Number.isSafeInteger((result as DailyResult).bestTime) &&
      (result as DailyResult).bestTime >= 0 &&
      [1, 2, 3].includes((result as DailyResult).bestStars) &&
      Number.isSafeInteger((result as DailyResult).completions) &&
      (result as DailyResult).completions >= 1,
  );
}
