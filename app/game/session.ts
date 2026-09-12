import {
  createGame,
  removePair,
  reshuffle,
  matchingPairs,
  LEVELS,
  FACES,
  faceGroup,
  type Tile,
  type Pair,
} from './engine.ts';
import { validMedalRecord, type MedalRecord } from './medals.ts';
import {
  validComfort,
  validDailyResults,
  validLocalStats,
  type ComfortSettings,
  type DailyResults,
  type LocalStats,
} from './progress.ts';
export const MAX_HINTS = 5;
export const HINT_PENALTY_SECONDS = 10;
export const MAX_SHUFFLES = 3;
export const SHUFFLE_PENALTY_SECONDS = 30;
export function shuffleLimit(level: number) {
  if (level < 5) return 3;
  if (level < 10) return 2;
  return 1;
}
export type Snapshot = { tiles: Tile[]; solution: Pair[]; moves: number };
export type Session = Snapshot & {
  mode: 'campaign' | 'daily';
  dailyKey: string | null;
  level: number;
  seed: number;
  seconds: number;
  penaltySeconds: number;
  hints: number;
  shuffles: number;
  undos: number;
  completionRecorded: boolean;
  history: Snapshot[];
};
export type Action =
  | {
      type: 'start';
      level: number;
      seed: number;
      mode?: Session['mode'];
      dailyKey?: string | null;
    }
  | { type: 'match'; pair: Pair }
  | { type: 'undo' }
  | { type: 'hint' }
  | { type: 'shuffle'; seed: number }
  | { type: 'tick' }
  | { type: 'restore'; session: Session };
export function newSession(
  level: number,
  seed: number,
  mode: Session['mode'] = 'campaign',
  dailyKey: string | null = null,
): Session {
  const game = createGame(level, seed);
  return {
    mode,
    dailyKey: mode === 'daily' ? dailyKey : null,
    level,
    seed,
    tiles: game.tiles,
    solution: game.solution,
    moves: 0,
    seconds: 0,
    penaltySeconds: 0,
    hints: 0,
    shuffles: 0,
    undos: 0,
    completionRecorded: false,
    history: [],
  };
}
export function reducer(state: Session, action: Action): Session {
  switch (action.type) {
    case 'start':
      return newSession(
        action.level,
        action.seed,
        action.mode,
        action.dailyKey,
      );
    case 'restore':
      return action.session;
    case 'tick':
      return state.tiles.some((t) => !t.removed)
        ? { ...state, seconds: state.seconds + 1 }
        : state;
    case 'hint':
      if (state.hints >= MAX_HINTS || matchingPairs(state.tiles).length === 0)
        return state;
      return {
        ...state,
        hints: state.hints + 1,
        seconds: state.seconds + HINT_PENALTY_SECONDS,
        penaltySeconds: state.penaltySeconds + HINT_PENALTY_SECONDS,
      };
    case 'match': {
      const tiles = removePair(state.tiles, action.pair);
      if (tiles === state.tiles) return state;
      const removed = new Set(tiles.filter((t) => t.removed).map((t) => t.id));
      const solution = state.solution.filter(
        (pair) => !pair.some((id) => removed.has(id)),
      );
      return {
        ...state,
        tiles,
        solution,
        moves: state.moves + 1,
        completionRecorded:
          state.completionRecorded || tiles.every((tile) => tile.removed),
        history: [
          ...state.history,
          { tiles: state.tiles, solution: state.solution, moves: state.moves },
        ].slice(-64),
      };
    }
    case 'undo': {
      const last = state.history.at(-1);
      if (!last) return state;
      return {
        ...state,
        ...last,
        undos: state.undos + 1,
        history: state.history.slice(0, -1),
      };
    }
    case 'shuffle': {
      if (
        state.shuffles >= shuffleLimit(state.level) ||
        state.tiles.every((t) => t.removed)
      )
        return state;
      const game = reshuffle(state.tiles, action.seed);
      return {
        ...state,
        tiles: game.tiles,
        solution: game.solution,
        shuffles: state.shuffles + 1,
        seconds: state.seconds + SHUFFLE_PENALTY_SECONDS,
        penaltySeconds: state.penaltySeconds + SHUFFLE_PENALTY_SECONDS,
        history: [
          ...state.history,
          { tiles: state.tiles, solution: state.solution, moves: state.moves },
        ].slice(-64),
      };
    }
  }
}
export function stars(session: Session) {
  return session.shuffles === 0 ? (session.hints === 0 ? 3 : 2) : 1;
}
export type Save = {
  version: 6;
  session: Session;
  best: Record<string, number>;
  bestTimes: Record<string, number>;
  medals: MedalRecord;
  dailyResults: DailyResults;
  stats: LocalStats;
  comfort: ComfortSettings;
  tutorialSeen: boolean;
  sound: boolean;
};
function validTiles(value: unknown): value is Tile[] {
  if (
    !Array.isArray(value) ||
    value.length < 2 ||
    value.length > 120 ||
    value.length % 2 !== 0
  )
    return false;
  const ids = new Set<number>();
  const counts = new Map<string, number>();
  const positions = new Set<string>();
  for (const t of value) {
    if (
      !t ||
      !Number.isInteger(t.id) ||
      t.id < 0 ||
      ids.has(t.id) ||
      !Number.isInteger(t.x) ||
      t.x < 0 ||
      t.x > 15 ||
      !Number.isInteger(t.y) ||
      t.y < 0 ||
      t.y > 19 ||
      !Number.isInteger(t.z) ||
      t.z < 0 ||
      t.z > 3 ||
      !FACES.includes(t.face) ||
      typeof t.removed !== 'boolean'
    )
      return false;
    ids.add(t.id);
    if (!t.removed) {
      const pos = `${t.x},${t.y},${t.z}`;
      if (positions.has(pos)) return false;
      positions.add(pos);
      const group = faceGroup(t.face);
      counts.set(group, (counts.get(group) ?? 0) + 1);
    }
  }
  return [...counts.values()].every((n) => n % 2 === 0);
}
function validSnapshot(value: unknown): value is Snapshot {
  if (!value || typeof value !== 'object') return false;
  const s = value as Snapshot;
  return (
    validTiles(s.tiles) &&
    Number.isInteger(s.moves) &&
    s.moves >= 0 &&
    s.moves <= 60 &&
    Array.isArray(s.solution) &&
    s.solution.length <= 60 &&
    s.solution.every(
      (p) =>
        Array.isArray(p) &&
        p.length === 2 &&
        p[0] !== p[1] &&
        p.every((id) => s.tiles.some((t) => t.id === id)),
    )
  );
}
export function isLevelUnlocked(
  level: number,
  best: Record<string, number>,
): boolean {
  if (!Number.isInteger(level) || level < 0 || level >= LEVELS.length)
    return false;
  return LEVELS[level].requires.every((required) => Boolean(best[required]));
}
export function recordTime(
  bestTimes: Record<string, number>,
  session: Session,
) {
  if (session.tiles.some((t) => !t.removed)) return bestTimes;
  const previous = bestTimes[session.level];
  if (previous !== undefined && previous <= session.seconds) return bestTimes;
  return { ...bestTimes, [session.level]: session.seconds };
}
export function readSave(raw: string | null): Save | null {
  if (!raw) return null;
  try {
    const data = JSON.parse(raw) as Save;
    const s = data.session;
    if (
      data.version !== 6 ||
      !validSnapshot(s) ||
      !Number.isInteger(s.level) ||
      s.level < 0 ||
      s.level >= LEVELS.length ||
      !Number.isInteger(s.seed) ||
      typeof s.completionRecorded !== 'boolean' ||
      !['campaign', 'daily'].includes(s.mode) ||
      (s.mode === 'daily'
        ? typeof s.dailyKey !== 'string' ||
          !/^\d{4}-\d{2}-\d{2}$/.test(s.dailyKey)
        : s.dailyKey !== null) ||
      ![s.seconds, s.hints, s.shuffles, s.undos, s.penaltySeconds].every(
        (n) => Number.isSafeInteger(n) && n >= 0,
      ) ||
      s.hints > MAX_HINTS ||
      s.shuffles > MAX_SHUFFLES ||
      s.penaltySeconds > s.seconds ||
      s.penaltySeconds !==
        s.shuffles * SHUFFLE_PENALTY_SECONDS + s.hints * HINT_PENALTY_SECONDS ||
      !Array.isArray(s.history) ||
      s.history.length > 64 ||
      !s.history.every(
        (h) => validSnapshot(h) && h.tiles.length === s.tiles.length,
      ) ||
      typeof data.sound !== 'boolean' ||
      !data.best ||
      typeof data.best !== 'object' ||
      Array.isArray(data.best) ||
      !data.bestTimes ||
      typeof data.bestTimes !== 'object' ||
      Array.isArray(data.bestTimes) ||
      !validMedalRecord(data.medals) ||
      !validDailyResults(data.dailyResults) ||
      !validLocalStats(data.stats) ||
      !validComfort(data.comfort) ||
      typeof data.tutorialSeen !== 'boolean'
    )
      return null;
    const best: Record<string, number> = {};
    for (const [key, value] of Object.entries(data.best))
      if (
        /^\d+$/.test(key) &&
        Number(key) < LEVELS.length &&
        [1, 2, 3].includes(value)
      )
        best[key] = value;
    if (
      Object.keys(best).some((key) => {
        const level = Number(key);
        return !LEVELS[level].requires.every((required) => best[required]);
      })
    )
      return null;
    const bestTimes: Record<string, number> = {};
    for (const [key, value] of Object.entries(data.bestTimes))
      if (best[key] && Number.isSafeInteger(value) && value >= 0)
        bestTimes[key] = value;
    if (Object.keys(data.medals).some((key) => !best[key])) return null;
    if (s.mode === 'campaign' && !isLevelUnlocked(s.level, best)) return null;
    return {
      version: 6,
      session: s,
      best,
      bestTimes,
      medals: data.medals,
      dailyResults: data.dailyResults,
      stats: data.stats,
      comfort: data.comfort,
      tutorialSeen: data.tutorialSeen,
      sound: data.sound,
    };
  } catch {
    return null;
  }
}
