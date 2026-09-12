import {
  LEVELS,
  createGame,
  faceGroup,
  layout,
  type Pair,
  type Tile,
} from './engine.ts';
import type { DifficultyLabel } from './difficulty-profile.ts';

export const DIFFICULTY_SAMPLE_COUNT = 20;
export const DIFFICULTY_SEARCH_BUDGET = 5_000;

export type DifficultyMetrics = {
  level: number;
  samples: number;
  tiles: number;
  layers: number;
  stackedRate: number;
  openingPairs: number;
  averageChoices: number;
  forcedMoveRate: number;
  trapRate: number;
  unresolvedChoices: number;
  score: number;
  label: DifficultyLabel;
};

type SearchResult = 'solvable' | 'dead-end' | 'unresolved';
type Topology = {
  all: bigint;
  above: bigint[];
  left: bigint[];
  right: bigint[];
  groups: string[];
};

const ZERO = BigInt(0);
const ONE = BigInt(1);
const bit = (id: number) => ONE << BigInt(id);
const clamp = (value: number) => Math.max(0, Math.min(1, value));
const rounded = (value: number, digits = 4) => Number(value.toFixed(digits));

function buildTopology(tiles: Tile[]): Topology {
  return {
    all: tiles.reduce((mask, tile) => mask | bit(tile.id), ZERO),
    above: tiles.map((tile) =>
      tiles.reduce(
        (mask, other) =>
          other.z > tile.z && other.x === tile.x && other.y === tile.y
            ? mask | bit(other.id)
            : mask,
        ZERO,
      ),
    ),
    left: tiles.map((tile) =>
      tiles.reduce(
        (mask, other) =>
          other.z === tile.z && other.x === tile.x - 1 && other.y === tile.y
            ? mask | bit(other.id)
            : mask,
        ZERO,
      ),
    ),
    right: tiles.map((tile) =>
      tiles.reduce(
        (mask, other) =>
          other.z === tile.z && other.x === tile.x + 1 && other.y === tile.y
            ? mask | bit(other.id)
            : mask,
        ZERO,
      ),
    ),
    groups: tiles.map((tile) => faceGroup(tile.face)),
  };
}

function isPresent(mask: bigint, id: number) {
  return (mask & bit(id)) !== ZERO;
}

function isFree(mask: bigint, id: number, topology: Topology) {
  return (
    isPresent(mask, id) &&
    (mask & topology.above[id]) === ZERO &&
    ((mask & topology.left[id]) === ZERO ||
      (mask & topology.right[id]) === ZERO)
  );
}

function legalPairs(mask: bigint, topology: Topology): Pair[] {
  const freeByGroup = new Map<string, number[]>();
  for (let id = 0; id < topology.groups.length; id++) {
    if (!isFree(mask, id, topology)) continue;
    const group = topology.groups[id];
    freeByGroup.set(group, [...(freeByGroup.get(group) ?? []), id]);
  }
  const pairs: Pair[] = [];
  for (const ids of freeByGroup.values())
    for (let first = 0; first < ids.length; first++)
      for (let second = first + 1; second < ids.length; second++)
        pairs.push([ids[first], ids[second]]);
  return pairs;
}

function removeFromMask(mask: bigint, pair: Pair) {
  return mask & ~bit(pair[0]) & ~bit(pair[1]);
}

function canSolve(
  mask: bigint,
  topology: Topology,
  memo: Map<bigint, boolean>,
  budget: { nodes: number },
): SearchResult {
  if (mask === ZERO) return 'solvable';
  const known = memo.get(mask);
  if (known !== undefined) return known ? 'solvable' : 'dead-end';
  if (--budget.nodes < 0) return 'unresolved';

  let unresolved = false;
  for (const pair of legalPairs(mask, topology)) {
    const result = canSolve(removeFromMask(mask, pair), topology, memo, budget);
    if (result === 'solvable') {
      memo.set(mask, true);
      return result;
    }
    if (result === 'unresolved') unresolved = true;
  }
  if (unresolved) return 'unresolved';
  memo.set(mask, false);
  return 'dead-end';
}

export function difficultyLabel(score: number): DifficultyLabel {
  if (score < 1.5) return 'Découverte';
  if (score < 2.25) return 'Facile';
  if (score < 3) return 'Intermédiaire';
  if (score < 3.75) return 'Avancé';
  if (score < 4.9) return 'Expert';
  return 'Grand maître';
}

function difficultyScore(metrics: {
  tiles: number;
  stackedRate: number;
  averageChoices: number;
  forcedMoveRate: number;
  trapRate: number;
}) {
  const tileLoad = clamp((metrics.tiles - 20) / 82);
  const stackLoad = clamp(metrics.stackedRate / 0.42);
  const choiceLoad = clamp((metrics.averageChoices - 2) / 10);
  const trapLoad = clamp(metrics.trapRate / 0.025);
  const decisionFreedom = 1 - clamp(metrics.forcedMoveRate / 0.22);
  const raw =
    tileLoad * 0.3 +
    stackLoad * 0.15 +
    choiceLoad * 0.2 +
    trapLoad * 0.25 +
    decisionFreedom * 0.1;
  return rounded(1 + 4 * clamp(raw / 0.71), 1);
}

export function measureDifficulty(
  level: number,
  samples = DIFFICULTY_SAMPLE_COUNT,
): DifficultyMetrics {
  if (!Number.isInteger(level) || level < 0 || level >= LEVELS.length)
    throw new Error(`Niveau inconnu : ${level}`);
  if (!Number.isInteger(samples) || samples < 1)
    throw new Error('Le nombre de distributions doit être positif.');

  const geometry = layout(level);
  let steps = 0;
  let choices = 0;
  let forcedMoves = 0;
  let openingPairs = 0;
  let safeChoices = 0;
  let trapChoices = 0;
  let unresolvedChoices = 0;

  for (let seed = 1; seed <= samples; seed++) {
    const game = createGame(level, seed);
    const topology = buildTopology(game.tiles);
    const memo = new Map<bigint, boolean>();
    let mask = topology.all;
    for (let step = 0; step < game.solution.length; step++) {
      const pairs = legalPairs(mask, topology);
      if (step === 0) openingPairs += pairs.length;
      steps++;
      choices += pairs.length;
      if (pairs.length === 1) forcedMoves++;
      for (const pair of pairs) {
        const result = canSolve(removeFromMask(mask, pair), topology, memo, {
          nodes: DIFFICULTY_SEARCH_BUDGET,
        });
        if (result === 'solvable') safeChoices++;
        else if (result === 'dead-end') trapChoices++;
        else unresolvedChoices++;
      }
      mask = removeFromMask(mask, game.solution[step]);
    }
  }

  const confirmedChoices = safeChoices + trapChoices;
  const base = {
    level,
    samples,
    tiles: geometry.length,
    layers: Math.max(...geometry.map((tile) => tile.z)) + 1,
    stackedRate: rounded(
      geometry.filter((tile) => tile.z > 0).length / geometry.length,
    ),
    openingPairs: rounded(openingPairs / samples, 2),
    averageChoices: rounded(choices / steps, 2),
    forcedMoveRate: rounded(forcedMoves / steps),
    trapRate: rounded(trapChoices / Math.max(1, confirmedChoices)),
    unresolvedChoices,
  };
  const score = difficultyScore(base);
  return { ...base, score, label: difficultyLabel(score) };
}

export function measureCampaign(samples = DIFFICULTY_SAMPLE_COUNT) {
  return LEVELS.map((_, level) => measureDifficulty(level, samples));
}
