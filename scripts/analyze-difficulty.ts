import { LEVELS } from '../app/game/engine.ts';
import {
  DIFFICULTY_SAMPLE_COUNT,
  measureCampaign,
} from '../app/game/difficulty.ts';
import { DIFFICULTY_PROFILES } from '../app/game/difficulty-profile.ts';

const samples = Number(process.argv[2] ?? DIFFICULTY_SAMPLE_COUNT);
const results = measureCampaign(samples);

console.log(
  'Niveau | Jardin | Score | Classe | Choix moyens | Coups forcés | Pièges confirmés | Non résolus',
);
console.log('--- | --- | ---: | --- | ---: | ---: | ---: | ---:');
for (const metrics of results) {
  console.log(
    `${metrics.level + 1} | ${LEVELS[metrics.level].name} | ${metrics.score.toFixed(1)}/5 | ${metrics.label} | ${metrics.averageChoices.toFixed(2)} | ${(metrics.forcedMoveRate * 100).toFixed(1)} % | ${(metrics.trapRate * 100).toFixed(2)} % | ${metrics.unresolvedChoices}`,
  );
}

const drifted = results.filter((metrics) => {
  const profile = DIFFICULTY_PROFILES[metrics.level];
  const close = (first: number, second: number, tolerance: number) =>
    Math.abs(first - second) <= tolerance;
  return (
    !profile ||
    profile.score !== metrics.score ||
    profile.label !== metrics.label ||
    !close(profile.averageChoices, metrics.averageChoices, 0.0051) ||
    !close(profile.forcedMoveRate, metrics.forcedMoveRate, 0.00051) ||
    !close(profile.trapRate, metrics.trapRate, 0.000051)
  );
});
if (samples === DIFFICULTY_SAMPLE_COUNT && drifted.length > 0) {
  console.error(
    `\nProfils à actualiser : ${drifted.map(({ level }) => level + 1).join(', ')}`,
  );
  process.exitCode = 1;
}
