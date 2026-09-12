import { layout } from './engine.ts';
import { DIFFICULTY_PROFILES } from './difficulty-profile.ts';
import type { Session } from './session.ts';

export const MEDAL_IDS = [
  'clear-sight',
  'still-water',
  'swift-step',
  'sure-path',
] as const;

export type MedalId = (typeof MEDAL_IDS)[number];
export type MedalRecord = Record<string, MedalId[]>;

export const MEDAL_DEFINITIONS: Array<{
  id: MedalId;
  name: string;
  description: string;
}> = [
  {
    id: 'clear-sight',
    name: 'Œil clair',
    description: 'Terminer sans utiliser d’indice',
  },
  {
    id: 'still-water',
    name: 'Eau calme',
    description: 'Terminer sans mélanger les tuiles',
  },
  {
    id: 'swift-step',
    name: 'Pas vif',
    description: 'Terminer avant le temps cible',
  },
  {
    id: 'sure-path',
    name: 'Voie sûre',
    description: 'Terminer sans annuler de coup',
  },
];

export function targetTime(level: number) {
  const pairs = layout(level).length / 2;
  const score = DIFFICULTY_PROFILES[level].score;
  return Math.ceil((pairs * (4 + score)) / 15) * 15;
}

export function earnedMedals(session: Session): MedalId[] {
  if (session.tiles.some((tile) => !tile.removed)) return [];
  return MEDAL_IDS.filter((id) => {
    if (id === 'clear-sight') return session.hints === 0;
    if (id === 'still-water') return session.shuffles === 0;
    if (id === 'swift-step')
      return session.seconds <= targetTime(session.level);
    return session.undos === 0;
  });
}

export function recordMedals(current: MedalRecord, session: Session) {
  const earned = earnedMedals(session);
  if (!earned.length) return current;
  const previous = current[session.level] ?? [];
  const combined = MEDAL_IDS.filter(
    (id) => previous.includes(id) || earned.includes(id),
  );
  if (
    combined.length === previous.length &&
    combined.every((id, index) => id === previous[index])
  )
    return current;
  return { ...current, [session.level]: combined };
}

export function validMedalRecord(value: unknown): value is MedalRecord {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  return Object.entries(value).every(
    ([key, medals]) =>
      /^\d+$/.test(key) &&
      Number(key) < DIFFICULTY_PROFILES.length &&
      Array.isArray(medals) &&
      new Set(medals).size === medals.length &&
      medals.every((medal) => MEDAL_IDS.includes(medal as MedalId)),
  );
}
