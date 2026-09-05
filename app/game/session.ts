import {
  createGame,
  removePair,
  reshuffle,
  matchingPairs,
  LEVELS,
  FACES,
  type Tile,
  type Pair,
} from './engine.ts';
export const MAX_HINTS = 5;
export const HINT_PENALTY_SECONDS = 10;
export const MAX_SHUFFLES = 3;
export const SHUFFLE_PENALTY_SECONDS = 30;
export type Snapshot = { tiles: Tile[]; solution: Pair[]; moves: number };
export type Session = Snapshot & {
  level: number;
  seed: number;
  seconds: number;
  penaltySeconds: number;
  hints: number;
  shuffles: number;
  history: Snapshot[];
};
export type Action =
  | { type: 'start'; level: number; seed: number }
  | { type: 'match'; pair: Pair }
  | { type: 'undo' }
  | { type: 'hint' }
  | { type: 'shuffle'; seed: number }
  | { type: 'tick' }
  | { type: 'restore'; session: Session };
export function newSession(level: number, seed: number): Session {
  const game = createGame(level, seed);
  return {
    level,
    seed,
    tiles: game.tiles,
    solution: game.solution,
    moves: 0,
    seconds: 0,
    penaltySeconds: 0,
    hints: 0,
    shuffles: 0,
    history: [],
  };
}
export function reducer(state: Session, action: Action): Session {
  switch (action.type) {
    case 'start':
      return newSession(action.level, action.seed);
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
        history: [
          ...state.history,
          { tiles: state.tiles, solution: state.solution, moves: state.moves },
        ].slice(-64),
      };
    }
    case 'undo': {
      const last = state.history.at(-1);
      if (!last) return state;
      return { ...state, ...last, history: state.history.slice(0, -1) };
    }
    case 'shuffle': {
      if (state.shuffles >= MAX_SHUFFLES || state.tiles.every((t) => t.removed))
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
  version: 4;
  session: Session;
  best: Record<string, number>;
  bestTimes: Record<string, number>;
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
      counts.set(t.face, (counts.get(t.face) ?? 0) + 1);
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
      data.version !== 4 ||
      !validSnapshot(s) ||
      !Number.isInteger(s.level) ||
      s.level < 0 ||
      s.level >= LEVELS.length ||
      !Number.isInteger(s.seed) ||
      ![s.seconds, s.hints, s.shuffles, s.penaltySeconds].every(
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
      Array.isArray(data.bestTimes)
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
    if (!isLevelUnlocked(s.level, best)) return null;
    return { version: 4, session: s, best, bestTimes, sound: data.sound };
  } catch {
    return null;
  }
}
