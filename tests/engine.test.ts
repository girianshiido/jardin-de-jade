import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createGame,
  isFree,
  matchingPairs,
  removePair,
  reshuffle,
  random,
  LEVELS,
  layout,
  FACES,
  type Tile,
} from '../app/game/engine.ts';
import {
  newSession,
  reducer,
  readSave,
  stars,
  MAX_SHUFFLES,
  MAX_HINTS,
  HINT_PENALTY_SECONDS,
  isLevelUnlocked,
  recordTime,
  SHUFFLE_PENALTY_SECONDS,
} from '../app/game/session.ts';
const tile = (id: number, x: number, y = 0, z = 0, face = 'east'): Tile => ({
  id,
  x,
  y,
  z,
  face,
  removed: false,
});

function mirrorMatches(tiles: Tile[]) {
  const active = tiles.filter((t) => !t.removed);
  const minX = Math.min(...active.map((t) => t.x));
  const maxX = Math.max(...active.map((t) => t.x));
  const pairs = active.flatMap((t) => {
    const mirror = active.find(
      (other) =>
        other.x === minX + maxX - t.x &&
        other.y === t.y &&
        other.z === t.z &&
        other.id > t.id,
    );
    return mirror ? [[t, mirror]] : [];
  });
  return pairs.filter(([a, b]) => a.face === b.face).length / pairs.length;
}

void test('New deals and shuffles do not encode their answer in mirror positions', () => {
  let dealSymmetry = 0;
  let shuffleSymmetry = 0;
  let perfectDeals = 0;
  let perfectShuffles = 0;
  const samples = LEVELS.length * 50;
  for (let level = 0; level < LEVELS.length; level++) {
    for (let seed = 1; seed <= 50; seed++) {
      const game = createGame(level, seed);
      const mixed = reshuffle(game.tiles, seed + 1741);
      const initial = mirrorMatches(game.tiles);
      const after = mirrorMatches(mixed.tiles);
      if (initial === 1) perfectDeals++;
      if (after === 1) perfectShuffles++;
      dealSymmetry += initial;
      shuffleSymmetry += after;
    }
  }
  assert.ok(dealSymmetry / samples < 0.4);
  assert.ok(shuffleSymmetry / samples < 0.4);
  assert.ok(perfectDeals / samples < 0.08);
  assert.ok(perfectShuffles / samples < 0.08);
  console.log(
    `Mirror matches: ${((dealSymmetry / samples) * 100).toFixed(1)}% in deals, ${((shuffleSymmetry / samples) * 100).toFixed(1)}% after shuffling.`,
  );
});

void test('A tile needs a clear top and at least one clear side', () => {
  const board = [tile(0, 0), tile(1, 1), tile(2, 2)];
  assert.equal(isFree(board[0], board), true);
  assert.equal(isFree(board[1], board), false);
  assert.equal(isFree(board[2], board), true);
  const stacked = [...board, tile(3, 0, 0, 1)];
  assert.equal(isFree(stacked[0], stacked), false);
  assert.equal(isFree(stacked[3], stacked), true);
  assert.equal(isFree({ ...board[0], removed: true }, board), false);
});
void test('All fifteen levels and 750 deals can be cleared using their legal certificate', () => {
  let checked = 0;
  for (let level = 0; level < LEVELS.length; level++)
    for (let seed = 1; seed <= 50; seed++) {
      const game = createGame(level, seed);
      let board = game.tiles;
      assert.equal(
        game.rearranged,
        false,
        `Initial layout must be preserved: ${level}`,
      );
      assert.equal(board.length, layout(level).length);
      assert.ok(board.length % 2 === 0);
      for (const pair of game.solution) {
        const next = removePair(board, pair);
        assert.notEqual(
          next,
          board,
          `Blocked certificate pair: ${level}/${seed}`,
        );
        board = next;
        checked++;
      }
      assert.ok(board.every((t) => t.removed));
      assert.ok(game.tiles.every((t) => FACES.includes(t.face)));
    }
  console.log(`Verified ${checked} legal pair removals across 750 deals.`);
});
void test('The redesigned campaign contains fifteen distinct silhouettes and valid stacks', () => {
  assert.equal(LEVELS.length, 15);
  const signatures = new Set<string>();
  for (let level = 0; level < LEVELS.length; level++) {
    const tiles = layout(level);
    signatures.add(
      tiles
        .map((t) => `${t.x},${t.y},${t.z}`)
        .sort()
        .join('|'),
    );
    for (const tile of tiles.filter((t) => t.z > 0))
      assert.ok(
        tiles.some(
          (below) =>
            below.x === tile.x && below.y === tile.y && below.z === tile.z - 1,
        ),
        `Floating tile in ${LEVELS[level].name}`,
      );
  }
  assert.equal(signatures.size, LEVELS.length);
  assert.ok(new Set(LEVELS.map((level) => level.family)).size >= 8);
  assert.deepEqual(LEVELS[0].requires, []);
  assert.deepEqual(LEVELS[1].requires, [0]);
  assert.deepEqual(LEVELS[2].requires, [0]);
  assert.deepEqual(LEVELS[9].requires, [7, 8]);
  assert.deepEqual(LEVELS[14].requires, [12, 13]);
});
void test('Invalid pairs never mutate a board', () => {
  const board = [tile(0, 0), tile(1, 1), tile(2, 2, 0, 0, 'red'), tile(3, 4)];
  for (const pair of [
    [0, 0],
    [0, 1],
    [0, 2],
    [0, 99],
  ] as [number, number][])
    assert.equal(removePair(board, pair), board);
  const next = removePair(board, [0, 3]);
  assert.equal(next.filter((t) => t.removed).length, 2);
  assert.equal(
    board.some((t) => t.removed),
    false,
  );
});
void test('Shuffling preserves remaining faces and restores a full solution after arbitrary play', () => {
  const rng = random(813);
  for (let level = 0; level < LEVELS.length; level++)
    for (let seed = 0; seed < 12; seed++) {
      let board = createGame(level, seed).tiles;
      for (let i = 0; i < 8; i++) {
        const pairs = matchingPairs(board);
        if (!pairs.length) break;
        board = removePair(board, pairs[Math.floor(rng() * pairs.length)]);
      }
      const faces = board
        .filter((t) => !t.removed)
        .map((t) => t.face)
        .sort();
      const game = reshuffle(board, seed + 17);
      assert.deepEqual(
        game.tiles
          .filter((t) => !t.removed)
          .map((t) => t.face)
          .sort(),
        faces,
      );
      let next = game.tiles;
      for (const pair of game.solution) {
        const result = removePair(next, pair);
        assert.notEqual(result, next);
        next = result;
      }
      assert.ok(next.every((t) => t.removed));
    }
});
void test('An irreducible upper tile triggers a safe geometry rearrangement', () => {
  // A single upper tile prevents access to its last matching lower tile.
  const trapped = [tile(0, 0, 0, 0), tile(1, 0, 0, 1)];
  const game = reshuffle(trapped, 12);
  assert.equal(game.rearranged, true);
  assert.equal(
    removePair(game.tiles, game.solution[0]).filter((t) => !t.removed).length,
    0,
  );
});
void test('Undo restores a match and a shuffle; restarting is deterministic', () => {
  const initial = newSession(7, 1234);
  const matched = reducer(initial, {
    type: 'match',
    pair: initial.solution[0],
  });
  assert.equal(matched.moves, 1);
  assert.equal(matched.history.length, 1);
  const restored = reducer(matched, { type: 'undo' });
  assert.deepEqual(restored.tiles, initial.tiles);
  assert.deepEqual(restored.solution, initial.solution);
  const mixed = reducer(matched, { type: 'shuffle', seed: 55 });
  assert.equal(mixed.shuffles, 1);
  assert.deepEqual(reducer(mixed, { type: 'undo' }).tiles, matched.tiles);
  assert.deepEqual(
    reducer(mixed, { type: 'start', level: 7, seed: 1234 }),
    initial,
  );
});
void test('Victory, time and stars follow play rather than device speed', () => {
  let state = newSession(0, 5);
  state = reducer(state, { type: 'tick' });
  assert.equal(state.seconds, 1);
  const path = [...state.solution];
  for (const pair of path) state = reducer(state, { type: 'match', pair });
  assert.equal(state.moves, 10);
  assert.ok(state.tiles.every((t) => t.removed));
  assert.equal(stars(state), 3);
  assert.equal(reducer(state, { type: 'tick' }), state);
  assert.equal(stars({ ...state, hints: 1 }), 2);
  assert.equal(stars({ ...state, shuffles: 1 }), 1);
});
void test('Saved games round-trip and malformed saves are rejected', () => {
  const session = newSession(11, 73);
  const save = {
    version: 4,
    session,
    best: Object.fromEntries(Array.from({ length: 11 }, (_, i) => [i, 3])),
    bestTimes: { 0: 88, 5: 120 },
    sound: true,
  };
  assert.deepEqual(readSave(JSON.stringify(save)), save);
  for (const raw of [
    null,
    'invalid',
    '{}',
    '{"version":2}',
    JSON.stringify({ ...save, session: { ...session, level: 99 } }),
    JSON.stringify({ ...save, session: { ...session, tiles: [tile(0, 0)] } }),
    JSON.stringify({ ...save, session: { ...session, seconds: -1 } }),
  ])
    assert.equal(readSave(raw), null);
});

void test('Shuffles cost 30 seconds, stop after three uses, and undo never refunds them', () => {
  let state = reducer(newSession(8, 42), { type: 'tick' });
  for (let used = 1; used <= MAX_SHUFFLES; used++) {
    const previous = state;
    state = reducer(state, { type: 'shuffle', seed: used });
    assert.equal(state.shuffles, used);
    assert.equal(state.seconds, 1 + used * SHUFFLE_PENALTY_SECONDS);
    assert.equal(state.penaltySeconds, used * SHUFFLE_PENALTY_SECONDS);
    state = reducer(state, { type: 'undo' });
    assert.deepEqual(state.tiles, previous.tiles);
    assert.equal(state.shuffles, used);
    assert.equal(state.seconds, 1 + used * SHUFFLE_PENALTY_SECONDS);
  }
  assert.equal(reducer(state, { type: 'shuffle', seed: 91 }), state);
  const resumed = readSave(
    JSON.stringify({
      version: 4,
      session: state,
      best: Object.fromEntries(Array.from({ length: 8 }, (_, i) => [i, 3])),
      bestTimes: {},
      sound: false,
    }),
  )!;
  assert.equal(resumed.session.shuffles, MAX_SHUFFLES);
  assert.equal(resumed.session.penaltySeconds, 90);
  assert.equal(
    reducer(resumed.session, { type: 'shuffle', seed: 12 }),
    resumed.session,
  );
  const restarted = reducer(state, { type: 'start', level: 8, seed: 42 });
  assert.equal(restarted.shuffles, 0);
  assert.equal(restarted.seconds, 0);
  assert.equal(restarted.penaltySeconds, 0);
  let completed = newSession(0, 3);
  for (const pair of completed.solution)
    completed = reducer(completed, { type: 'match', pair });
  assert.equal(reducer(completed, { type: 'shuffle', seed: 92 }), completed);
});

void test('A fresh campaign starts at level one and earlier formats cannot restore old progress', () => {
  const old = {
    version: 2,
    session: newSession(8, 41),
    best: { 7: 3 },
    sound: false,
  };
  assert.equal(readSave(JSON.stringify(old)), null);
  assert.equal(readSave(JSON.stringify({ ...old, version: 3 })), null);
  for (let level = 0; level < LEVELS.length; level++)
    assert.equal(isLevelUnlocked(level, {}), level === 0);
  const best: Record<string, number> = {};
  for (let level = 0; level < LEVELS.length; level++) {
    assert.equal(isLevelUnlocked(level, best), true);
    best[level] = 1;
  }
  assert.equal(isLevelUnlocked(1, { 0: 1 }), true);
  assert.equal(isLevelUnlocked(2, { 0: 1 }), true);
  assert.equal(isLevelUnlocked(9, { 7: 1 }), false);
  assert.equal(isLevelUnlocked(9, { 7: 1, 8: 1 }), true);
  assert.equal(isLevelUnlocked(-1, best), false);
  assert.equal(isLevelUnlocked(LEVELS.length, best), false);
  assert.equal(isLevelUnlocked(3, { 2: 3 }), false);
  const invalid = {
    version: 4,
    session: newSession(3, 41),
    best: { 2: 3 },
    bestTimes: {},
    sound: false,
  };
  assert.equal(readSave(JSON.stringify(invalid)), null);
  const disconnected = {
    version: 4,
    session: newSession(0, 42),
    best: { 0: 3, 9: 2 },
    bestTimes: {},
    sound: true,
  };
  assert.equal(readSave(JSON.stringify(disconnected)), null);
});

void test('Hints stop after five uses and cost ten seconds each, even after undo and reload', () => {
  let state = newSession(0, 51);
  state = reducer(state, { type: 'match', pair: state.solution[0] });
  for (let i = 1; i <= MAX_HINTS; i++) {
    state = reducer(state, { type: 'hint' });
    assert.equal(state.hints, i);
    assert.equal(state.seconds, i * HINT_PENALTY_SECONDS);
    assert.equal(state.penaltySeconds, i * HINT_PENALTY_SECONDS);
  }
  assert.equal(reducer(state, { type: 'hint' }), state);
  state = reducer(state, { type: 'undo' });
  assert.equal(state.hints, 5);
  assert.equal(state.seconds, 50);
  const resumed = readSave(
    JSON.stringify({
      version: 4,
      session: state,
      best: {},
      bestTimes: {},
      sound: true,
    }),
  )!;
  assert.equal(reducer(resumed.session, { type: 'hint' }), resumed.session);
  const mixed = reducer(state, { type: 'shuffle', seed: 78 });
  assert.equal(mixed.penaltySeconds, 80);
  assert.equal(mixed.seconds, 80);
  const restarted = reducer(state, { type: 'start', level: 0, seed: 51 });
  assert.equal(restarted.hints, 0);
  assert.equal(restarted.penaltySeconds, 0);
  const stuck = { ...state, tiles: [tile(0, 0), tile(1, 0, 0, 1)], hints: 0 };
  assert.equal(reducer(stuck, { type: 'hint' }), stuck);
});

void test('Only completed games establish records; penalties count and slower wins never replace them', () => {
  let state = newSession(0, 79);
  const records = {};
  assert.equal(recordTime(records, state), records);
  state = reducer(state, { type: 'hint' });
  state = reducer(state, { type: 'shuffle', seed: 8 });
  for (const pair of state.solution)
    state = reducer(state, { type: 'match', pair });
  assert.equal(state.seconds, 40);
  const first = recordTime(records, state);
  assert.deepEqual(first, { 0: 40 });
  assert.equal(recordTime(first, { ...state, seconds: 65 }), first);
  const improved = recordTime(first, {
    ...state,
    seconds: 9,
    penaltySeconds: 0,
    hints: 0,
    shuffles: 0,
  });
  assert.deepEqual(improved, { 0: 9 });
  assert.equal(reducer(state, { type: 'hint' }), state);
  const saved = readSave(
    JSON.stringify({
      version: 4,
      session: state,
      best: { 0: 1 },
      bestTimes: first,
      sound: false,
    }),
  )!;
  assert.deepEqual(saved.bestTimes, { 0: 40 });
  assert.equal(isLevelUnlocked(1, saved.best), true);
  const replay = { ...saved, session: newSession(0, 50) };
  assert.deepEqual(readSave(JSON.stringify(replay))!.bestTimes, { 0: 40 });
});
