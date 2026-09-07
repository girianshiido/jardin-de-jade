export type Tile = {
  id: number;
  x: number;
  y: number;
  z: number;
  face: string;
  removed: boolean;
};
export type Pair = [number, number];
export type Level = {
  name: string;
  subtitle: string;
  difficulty: string;
  family: string;
  rank: number;
  requires: number[];
  layers: string[][];
};
export const LEVELS: Level[] = [
  {
    name: 'Clairière I',
    subtitle: 'Les premiers pas',
    difficulty: 'Découverte',
    family: 'Clairière',
    rank: 1,
    requires: [],
    layers: [['.####.', '######', '######', '.####.']],
  },
  {
    name: 'Clairière II',
    subtitle: 'Les îlots de mousse',
    difficulty: 'Facile',
    family: 'Clairière',
    rank: 2,
    requires: [0],
    layers: [
      ['..##..##..', '.########.', '##########', '.########.', '..##..##..'],
      ['..........', '....##....', '....##....', '..........', '..........'],
    ],
  },
  {
    name: 'Papillon I',
    subtitle: 'Deux ailes, un même cœur',
    difficulty: 'Facile',
    family: 'Papillon',
    rank: 2,
    requires: [0],
    layers: [
      [
        '##.....##',
        '.###.###.',
        '..#####..',
        '..#####..',
        '.###.###.',
        '##.....##',
      ],
      [
        '.........',
        '.........',
        '....#....',
        '....#....',
        '.........',
        '.........',
      ],
    ],
  },
  {
    name: 'Pont de pierre I',
    subtitle: 'Deux rives à réunir',
    difficulty: 'Intermédiaire',
    family: 'Pont de pierre',
    rank: 3,
    requires: [1],
    layers: [
      ['##....##', '###..###', '########', '########', '###..###', '##....##'],
      ['........', '........', '..####..', '..####..', '........', '........'],
    ],
  },
  {
    name: 'Papillon II',
    subtitle: 'Les ailes se referment',
    difficulty: 'Intermédiaire',
    family: 'Papillon',
    rank: 3,
    requires: [2],
    layers: [
      [
        '##.....##',
        '.###.###.',
        '..#####..',
        '..#####..',
        '.###.###.',
        '##.....##',
      ],
      [
        '.........',
        '.##...##.',
        '...#.#...',
        '.........',
        '.##...##.',
        '.........',
      ],
    ],
  },
  {
    name: 'Serpent de bambou I',
    subtitle: 'Suivre le chemin',
    difficulty: 'Intermédiaire',
    family: 'Serpent de bambou',
    rank: 3,
    requires: [3],
    layers: [
      [
        '######....',
        '....##....',
        '....######',
        '....##....',
        '######....',
        '##........',
        '##########',
      ],
      [
        '..........',
        '....##....',
        '....##....',
        '....##....',
        '..........',
        '##........',
        '..........',
      ],
    ],
  },
  {
    name: 'Temple des lanternes I',
    subtitle: 'Quatre pavillons et un sanctuaire',
    difficulty: 'Tactique',
    family: 'Temple des lanternes',
    rank: 3,
    requires: [4],
    layers: [
      [
        '###....###',
        '###....###',
        '...####...',
        '..######..',
        '..######..',
        '...####...',
        '###....###',
        '###....###',
      ],
      [
        '..........',
        '..........',
        '....##....',
        '...####...',
        '...####...',
        '....##....',
        '..........',
        '..........',
      ],
    ],
  },
  {
    name: 'Serpent de bambou II',
    subtitle: 'Le sentier se replie',
    difficulty: 'Avancé',
    family: 'Serpent de bambou',
    rank: 4,
    requires: [5],
    layers: [
      [
        '########..',
        '......##..',
        '....######',
        '........##',
        '..########',
        '..##......',
        '######....',
        '##........',
        '##########',
      ],
      [
        '....##....',
        '..........',
        '......##..',
        '..........',
        '....####..',
        '..........',
        '..##......',
        '..........',
        '....##....',
      ],
    ],
  },
  {
    name: 'Spirale de brume I',
    subtitle: 'Approcher le centre',
    difficulty: 'Avancé',
    family: 'Spirale de brume',
    rank: 4,
    requires: [6],
    layers: [
      [
        '##########',
        '###.......',
        '#.######..',
        '#.#....#..',
        '#.#.##.#..',
        '#.#....#..',
        '#.######..',
        '##......##',
        '##########',
      ],
      [
        '....##....',
        '..........',
        '...##.....',
        '..........',
        '....##....',
        '..........',
        '...##.....',
        '..........',
        '..........',
      ],
    ],
  },
  {
    name: 'Temple des lanternes II',
    subtitle: 'Ouvrir le sanctuaire intérieur',
    difficulty: 'Expert',
    family: 'Temple des lanternes',
    rank: 4,
    requires: [7, 8],
    layers: [
      [
        '###....###',
        '###....###',
        '...####...',
        '..######..',
        '.########.',
        '.########.',
        '..######..',
        '...####...',
        '###....###',
        '###....###',
      ],
      [
        '..........',
        '..........',
        '....##....',
        '...####...',
        '..######..',
        '..######..',
        '...####...',
        '....##....',
        '..........',
        '..........',
      ],
      [
        '..........',
        '..........',
        '..........',
        '..........',
        '....##....',
        '....##....',
        '..........',
        '..........',
        '..........',
        '..........',
      ],
    ],
  },
  {
    name: 'Jardins suspendus I',
    subtitle: 'Des îles entre terre et ciel',
    difficulty: 'Expert',
    family: 'Jardins suspendus',
    rank: 5,
    requires: [9],
    layers: [
      [
        '###....###',
        '###....###',
        '..........',
        '...####...',
        '...####...',
        '..........',
        '###....###',
        '###....###',
      ],
      [
        '.##....##.',
        '.##....##.',
        '..........',
        '....##....',
        '....##....',
        '..........',
        '.##....##.',
        '.##....##.',
      ],
      [
        '..........',
        '..........',
        '..........',
        '....#.....',
        '....#.....',
        '..........',
        '..........',
        '..........',
      ],
    ],
  },
  {
    name: 'Spirale de brume II',
    subtitle: 'Le cœur du tourbillon',
    difficulty: 'Maître',
    family: 'Spirale de brume',
    rank: 5,
    requires: [9],
    layers: [
      [
        '##########',
        '###.......',
        '#.######..',
        '#.#....#..',
        '#.#.##.#..',
        '#.#.##.#..',
        '#.#....#..',
        '#.######..',
        '##......##',
        '##########',
      ],
      [
        '...####...',
        '#.........',
        '...##.....',
        '..........',
        '....##....',
        '....##....',
        '..........',
        '...##.....',
        '..........',
        '...####...',
      ],
      [
        '..........',
        '..........',
        '..........',
        '..........',
        '....##....',
        '....##....',
        '..........',
        '..........',
        '..........',
        '..........',
      ],
    ],
  },
  {
    name: 'Labyrinthe de jade',
    subtitle: 'Choisir avant d’ouvrir',
    difficulty: 'Maître',
    family: 'Labyrinthe de jade',
    rank: 5,
    requires: [10],
    layers: [
      [
        '####..####',
        '####..##..',
        '..######..',
        '..##..####',
        '######..##',
        '##..######',
        '##..##..##',
        '######..##',
      ],
      [
        '.##.......',
        '......##..',
        '...##.....',
        '......##..',
        '.##.......',
        '....##....',
        '..........',
        '..........',
      ],
    ],
  },
  {
    name: 'Jardins suspendus II',
    subtitle: 'Sept terrasses dans le vide',
    difficulty: 'Maître',
    family: 'Jardins suspendus',
    rank: 5,
    requires: [11],
    layers: [
      [
        '###....###',
        '###....###',
        '..........',
        '...####...',
        '..######..',
        '...####...',
        '..........',
        '###....###',
        '###....###',
      ],
      [
        '.##....##.',
        '.##....##.',
        '..........',
        '....##....',
        '...####...',
        '....##....',
        '..........',
        '.##....##.',
        '.##....##.',
      ],
      [
        '..........',
        '..........',
        '..........',
        '..........',
        '....##....',
        '..........',
        '..........',
        '..........',
        '..........',
      ],
    ],
  },
  {
    name: 'Palais de jade',
    subtitle: 'Toutes les voies du jardin',
    difficulty: 'Grand maître',
    family: 'Palais de jade',
    rank: 6,
    requires: [12, 13],
    layers: [
      [
        '####..####',
        '##########',
        '##########',
        '###.##.###',
        '##########',
        '##########',
        '####..####',
      ],
      [
        '.###..###.',
        '..##..##..',
        '...####...',
        '....##....',
        '...####...',
        '..##..##..',
        '.###..###.',
      ],
      [
        '..........',
        '..........',
        '....##....',
        '....##....',
        '....##....',
        '..........',
        '..........',
      ],
      [
        '..........',
        '..........',
        '..........',
        '....##....',
        '..........',
        '..........',
        '..........',
      ],
    ],
  },
];
export const FACES = [
  'dot-1',
  'dot-2',
  'dot-3',
  'dot-4',
  'dot-5',
  'dot-6',
  'dot-7',
  'dot-8',
  'dot-9',
  'bamboo-1',
  'bamboo-2',
  'bamboo-3',
  'bamboo-4',
  'bamboo-5',
  'bamboo-6',
  'bamboo-7',
  'bamboo-8',
  'bamboo-9',
  'character-1',
  'character-2',
  'character-3',
  'character-4',
  'character-5',
  'character-6',
  'character-7',
  'character-8',
  'character-9',
  'east',
  'south',
  'west',
  'north',
  'red',
  'green',
  'white',
  'flower-plum',
  'flower-orchid',
  'flower-chrysanthemum',
  'flower-bamboo',
  'season-spring',
  'season-summer',
  'season-autumn',
  'season-winter',
];
const REGULAR_FACES = FACES.filter(
  (face) => !face.startsWith('flower-') && !face.startsWith('season-'),
);
type FacePair = [string, string];
const FACE_PAIRS: FacePair[] = [
  ...REGULAR_FACES.map((face): FacePair => [face, face]),
  ['flower-plum', 'flower-orchid'],
  ['flower-chrysanthemum', 'flower-bamboo'],
  ['season-spring', 'season-summer'],
  ['season-autumn', 'season-winter'],
];
export function faceGroup(face: string) {
  if (face.startsWith('flower-')) return 'flowers';
  if (face.startsWith('season-')) return 'seasons';
  return face;
}
export function facesMatch(a: string, b: string) {
  return faceGroup(a) === faceGroup(b);
}
export function random(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
export function shuffled<T>(items: T[], rng: () => number): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}
export function isFree(tile: Tile, tiles: Tile[]): boolean {
  if (tile.removed) return false;
  const others = tiles.filter((t) => !t.removed && t.id !== tile.id);
  if (
    others.some(
      (t) =>
        t.z > tile.z &&
        Math.abs(t.x - tile.x) < 1 &&
        Math.abs(t.y - tile.y) < 1,
    )
  )
    return false;
  const left = others.some(
    (t) =>
      t.z === tile.z &&
      Math.abs(t.x - (tile.x - 1)) < 0.01 &&
      Math.abs(t.y - tile.y) < 1,
  );
  const right = others.some(
    (t) =>
      t.z === tile.z &&
      Math.abs(t.x - (tile.x + 1)) < 0.01 &&
      Math.abs(t.y - tile.y) < 1,
  );
  return !left || !right;
}
export function freeTiles(tiles: Tile[]) {
  return tiles.filter((t) => isFree(t, tiles));
}
export function matchingPairs(tiles: Tile[]): Pair[] {
  const free = freeTiles(tiles);
  const pairs: Pair[] = [];
  for (let i = 0; i < free.length; i++)
    for (let j = i + 1; j < free.length; j++)
      if (facesMatch(free[i].face, free[j].face))
        pairs.push([free[i].id, free[j].id]);
  return pairs;
}
export function removePair(tiles: Tile[], pair: Pair): Tile[] {
  const a = tiles.find((t) => t.id === pair[0]),
    b = tiles.find((t) => t.id === pair[1]);
  if (
    !a ||
    !b ||
    a.id === b.id ||
    !facesMatch(a.face, b.face) ||
    !isFree(a, tiles) ||
    !isFree(b, tiles)
  )
    return tiles;
  return tiles.map((t) => (pair.includes(t.id) ? { ...t, removed: true } : t));
}
export function layout(level: number): Tile[] {
  const tiles: Tile[] = [];
  LEVELS[level].layers.forEach((rows, z) =>
    rows.forEach((row, y) => {
      for (let x = 0; x < row.length; x++) {
        if (row[x] === '#')
          tiles.push({
            id: tiles.length,
            x,
            y,
            z,
            face: '',
            removed: false,
          });
      }
    }),
  );
  if (tiles.length % 2 !== 0)
    throw new Error(
      `Le jardin ${level + 1} contient un nombre impair de tuiles.`,
    );
  return tiles;
}
// Generate a legal removal certificate first, then assign identical faces to each pair.
export function geometrySolution(
  tiles: Tile[],
  rng: () => number,
): Pair[] | null {
  for (let attempt = 0; attempt < 120; attempt++) {
    let board = tiles.map((t) => ({ ...t }));
    const path: Pair[] = [];
    while (board.some((t) => !t.removed)) {
      const free = shuffled(freeTiles(board), rng);
      if (free.length < 2) break;
      // Both endpoints are sampled independently of their coordinates. Pairing
      // reflections here would encode the whole solution in the board's shape.
      const [a, b] = free;
      path.push([a.id, b.id]);
      board = board.map((t) =>
        t.id === a.id || t.id === b.id ? { ...t, removed: true } : t,
      );
    }
    if (board.every((t) => t.removed)) return path;
  }
  return null;
}
export function deal(tiles: Tile[], facePairs: FacePair[], rng: () => number) {
  let board = tiles.map((t) => ({ ...t }));
  let rearranged = false;
  let solution = geometrySolution(board, rng);
  if (!solution) {
    // Some legal moves can strand a lone upper tile. Flatten only when necessary.
    const columns = Math.max(
      2,
      Math.ceil(Math.sqrt(board.filter((t) => !t.removed).length)),
    );
    let index = 0;
    board = board.map((t) =>
      t.removed
        ? t
        : {
            ...t,
            x: index % columns,
            y: Math.floor(index++ / columns),
            z: 0,
          },
    );
    solution = geometrySolution(board, rng);
    rearranged = true;
  }
  if (!solution) throw new Error('Impossible de redistribuer ce plateau.');
  const assigned = shuffled(facePairs, rng);
  const map = new Map<number, string>();
  solution.forEach((pair, i) => {
    map.set(pair[0], assigned[i][0]);
    map.set(pair[1], assigned[i][1]);
  });
  board = board.map((t) => (t.removed ? t : { ...t, face: map.get(t.id)! }));
  return { tiles: board, solution, rearranged };
}
export function createGame(level: number, seed: number) {
  const tiles = layout(level);
  const rng = random(seed);
  const variety = shuffled(FACE_PAIRS, rng).slice(
    0,
    Math.min(FACE_PAIRS.length, 5 + level * 3),
  );
  const regularRepeats = shuffled(
    REGULAR_FACES.map((face): FacePair => [face, face]),
    rng,
  );
  return deal(
    tiles,
    Array.from({ length: tiles.length / 2 }, (_, i) =>
      i < variety.length
        ? variety[i]
        : regularRepeats[(i - variety.length) % regularRepeats.length],
    ),
    rng,
  );
}
export function reshuffle(tiles: Tile[], seed: number) {
  const rng = random(seed);
  const groups = new Map<string, string[]>();
  tiles
    .filter((t) => !t.removed)
    .forEach((t) => {
      const group = faceGroup(t.face);
      groups.set(group, [...(groups.get(group) ?? []), t.face]);
    });
  const pairs: FacePair[] = [];
  groups.forEach((groupFaces) => {
    if (groupFaces.length % 2) throw new Error('Paire incomplète');
    const ordered = shuffled(groupFaces, rng);
    for (let i = 0; i < ordered.length; i += 2)
      pairs.push([ordered[i], ordered[i + 1]]);
  });
  return deal(tiles, pairs, rng);
}
export function boardBounds(tiles: Tile[]) {
  const minX = Math.min(...tiles.map((t) => t.x));
  const maxX = Math.max(...tiles.map((t) => t.x));
  const minY = Math.min(...tiles.map((t) => t.y));
  const maxY = Math.max(...tiles.map((t) => t.y));
  return {
    minX,
    minY,
    width: (maxX - minX) * 72 + 100,
    height: (maxY - minY) * 90 + 118,
  };
}
