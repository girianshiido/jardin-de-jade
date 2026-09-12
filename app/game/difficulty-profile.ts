export type DifficultyLabel =
  | 'Découverte'
  | 'Facile'
  | 'Intermédiaire'
  | 'Avancé'
  | 'Expert'
  | 'Grand maître';

export type DifficultyProfile = {
  score: number;
  label: DifficultyLabel;
  averageChoices: number;
  forcedMoveRate: number;
  trapRate: number;
};

// Generated from twenty deterministic deals per garden by `pnpm analyze:difficulty`.
export const DIFFICULTY_PROFILES: DifficultyProfile[] = [
  {
    score: 1.2,
    label: 'Découverte',
    averageChoices: 2.37,
    forcedMoveRate: 0.2,
    trapRate: 0.0021,
  },
  {
    score: 2.2,
    label: 'Facile',
    averageChoices: 6.38,
    forcedMoveRate: 0.084,
    trapRate: 0,
  },
  {
    score: 2.5,
    label: 'Intermédiaire',
    averageChoices: 3.24,
    forcedMoveRate: 0.138,
    trapRate: 0.0051,
  },
  {
    score: 3,
    label: 'Avancé',
    averageChoices: 6.33,
    forcedMoveRate: 0.132,
    trapRate: 0.0079,
  },
  {
    score: 3.1,
    label: 'Avancé',
    averageChoices: 3.56,
    forcedMoveRate: 0.195,
    trapRate: 0.0229,
  },
  {
    score: 3.1,
    label: 'Avancé',
    averageChoices: 6.85,
    forcedMoveRate: 0.07,
    trapRate: 0.0051,
  },
  {
    score: 3.1,
    label: 'Avancé',
    averageChoices: 6.22,
    forcedMoveRate: 0.107,
    trapRate: 0.0046,
  },
  {
    score: 3.4,
    label: 'Avancé',
    averageChoices: 8.73,
    forcedMoveRate: 0.059,
    trapRate: 0.0004,
  },
  {
    score: 3.4,
    label: 'Avancé',
    averageChoices: 5.92,
    forcedMoveRate: 0.071,
    trapRate: 0.0058,
  },
  {
    score: 3.5,
    label: 'Avancé',
    averageChoices: 6.85,
    forcedMoveRate: 0.052,
    trapRate: 0.0003,
  },
  {
    score: 3.5,
    label: 'Avancé',
    averageChoices: 8.32,
    forcedMoveRate: 0.038,
    trapRate: 0,
  },
  {
    score: 3.8,
    label: 'Expert',
    averageChoices: 8.18,
    forcedMoveRate: 0.063,
    trapRate: 0.0002,
  },
  {
    score: 3.9,
    label: 'Expert',
    averageChoices: 8.13,
    forcedMoveRate: 0.056,
    trapRate: 0.0015,
  },
  {
    score: 4.7,
    label: 'Expert',
    averageChoices: 11.7,
    forcedMoveRate: 0.045,
    trapRate: 0.0021,
  },
  {
    score: 5,
    label: 'Grand maître',
    averageChoices: 10.67,
    forcedMoveRate: 0.035,
    trapRate: 0.0022,
  },
  {
    score: 5,
    label: 'Grand maître',
    averageChoices: 19.49,
    forcedMoveRate: 0.047,
    trapRate: 0.0018,
  },
  {
    score: 5,
    label: 'Grand maître',
    averageChoices: 22.06,
    forcedMoveRate: 0.036,
    trapRate: 0.0021,
  },
  {
    score: 5,
    label: 'Grand maître',
    averageChoices: 15.83,
    forcedMoveRate: 0.047,
    trapRate: 0.0022,
  },
  {
    score: 5,
    label: 'Grand maître',
    averageChoices: 14.02,
    forcedMoveRate: 0.042,
    trapRate: 0.0013,
  },
  {
    score: 5,
    label: 'Grand maître',
    averageChoices: 12.89,
    forcedMoveRate: 0.037,
    trapRate: 0.0035,
  },
];
