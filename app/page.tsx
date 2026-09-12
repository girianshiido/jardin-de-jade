'use client';

import {
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
  type CSSProperties,
} from 'react';
import {
  Leaf,
  Grid2X2,
  Lightbulb,
  Undo2,
  Shuffle,
  CircleHelp,
  Volume2,
  VolumeX,
  Pause,
  Play,
  RotateCcw,
  ChevronRight,
  Check,
  Star,
  X,
  ArrowLeft,
  LockKeyhole,
  Trophy,
  Download,
  CalendarDays,
  BarChart3,
  Settings2,
  Flame,
  Clock3,
  BookOpen,
  Eye,
  ZoomIn,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from '@/components/ui/dialog';
import {
  freeTiles,
  matchingPairs,
  LEVELS,
  boardBounds,
  layout,
  isFree,
  facesMatch,
  type Tile,
  type Pair,
} from './game/engine';
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
  type Save,
} from './game/session';
import { TileFace, faceLabel } from './game/tiles';
import { JadeAudio, type SoundCue } from './game/audio';
import { DIFFICULTY_PROFILES } from './game/difficulty-profile';
import {
  earnedMedals,
  MEDAL_DEFINITIONS,
  recordMedals,
  targetTime,
  type MedalId,
  type MedalRecord,
} from './game/medals';
import {
  currentDailyStreak,
  dailyChallenge,
  dateFromKey,
  DEFAULT_COMFORT,
  EMPTY_STATS,
  longestDailyStreak,
  localDateKey,
  recordDaily,
  recordLocalStats,
  type ComfortSettings,
  type DailyResults,
  type LocalStats,
} from './game/progress';

const SAVE_KEY = 'jardin-de-jade-v6';
const seedNow = () => Date.now() % 2147483647;
const formatTime = (s: number) =>
  `${Math.floor(s / 60)
    .toString()
    .padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;
const formatDifficulty = (score: number) => score.toFixed(1).replace('.', ',');
const formatLongTime = (seconds: number) => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (hours) return `${hours} h ${String(minutes).padStart(2, '0')}`;
  return minutes ? `${minutes} min` : `${seconds} s`;
};
const formatDailyDate = (key: string) =>
  new Intl.DateTimeFormat('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(dateFromKey(key));
const pairFoundMessage = (firstFace: string, secondFace: string) => {
  if (firstFace.startsWith('season-') && secondFace.startsWith('season-'))
    return `Paire de saisons trouvée : ${faceLabel(firstFace)} et ${faceLabel(secondFace)} !`;
  if (firstFace.startsWith('flower-') && secondFace.startsWith('flower-'))
    return `Paire de fleurs trouvée : ${faceLabel(firstFace)} et ${faceLabel(secondFace)} !`;
  return `Paire trouvée : ${faceLabel(secondFace)} !`;
};
type Panel =
  | 'help'
  | 'levels'
  | 'daily'
  | 'tutorial'
  | 'stats'
  | 'comfort'
  | 'pause'
  | 'restart'
  | 'install'
  | null;
const TILE_LAYER_OFFSET_X = -5;
const TILE_LAYER_OFFSET_Y = 7;
type InstallPrompt = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};
const CAMPAIGN_RANKS = [...new Set(LEVELS.map((level) => level.rank))];
const CAMPAIGN_STAGES = CAMPAIGN_RANKS.map((rank) => {
  const gardens = LEVELS.map((level, index) => ({ level, index })).filter(
    ({ level }) => level.rank === rank,
  );
  return {
    rank,
    rows:
      rank === 3 || rank === 5
        ? [gardens.slice(0, 2), gardens.slice(2)]
        : [gardens],
  };
});

const THEME_LABELS = {
  glade: 'Bosquet des ailes',
  bamboo: 'Sentier de bambou',
  mist: 'Terrasses de brume',
  lantern: 'Domaine des lanternes',
  palace: 'Cœur du palais',
};

function MedalGlyph({ id, size = 14 }: { id: MedalId; size?: number }) {
  if (id === 'clear-sight') return <Lightbulb size={size} />;
  if (id === 'still-water') return <Shuffle size={size} />;
  if (id === 'swift-step') return <Trophy size={size} />;
  return <Undo2 size={size} />;
}

function Tutorial({ onComplete }: { onComplete: () => void }) {
  const [step, setStep] = useState(0);
  const [simpleSelected, setSimpleSelected] = useState<number | null>(null);
  const [blockedSeen, setBlockedSeen] = useState(false);
  const [bonusSelected, setBonusSelected] = useState<string | null>(null);
  const [bonusDone, setBonusDone] = useState<string[]>([]);
  const [tutorialMessage, setTutorialMessage] = useState(
    'Touchez les deux tuiles identiques.',
  );
  const bonusFaces = [
    'season-autumn',
    'season-winter',
    'flower-plum',
    'flower-orchid',
  ];

  function chooseSimpleTile(index: number) {
    if (simpleSelected === null) {
      setSimpleSelected(index);
      setTutorialMessage('Très bien. Touchez maintenant sa jumelle.');
      return;
    }
    if (index !== simpleSelected) {
      setStep(1);
      setTutorialMessage(
        'Une tuile sombre est bloquée. Touchez-la pour essayer.',
      );
    }
  }

  function chooseBonus(face: string) {
    const group = face.startsWith('season-') ? 'seasons' : 'flowers';
    if (bonusDone.includes(group)) return;
    if (!bonusSelected) {
      setBonusSelected(face);
      setTutorialMessage(
        `Cherchez une autre ${group === 'seasons' ? 'saison' : 'fleur'}.`,
      );
      return;
    }
    const selectedGroup = bonusSelected.startsWith('season-')
      ? 'seasons'
      : 'flowers';
    if (selectedGroup !== group) {
      setBonusSelected(face);
      setTutorialMessage('Une fleur et une saison ne forment pas une paire.');
      return;
    }
    const completed = [...bonusDone, group];
    setBonusDone(completed);
    setBonusSelected(null);
    if (completed.length === 2) {
      setStep(3);
      setTutorialMessage('Vous connaissez maintenant les règles essentielles.');
    } else
      setTutorialMessage(
        `Parfait. Associez maintenant les deux ${group === 'seasons' ? 'fleurs' : 'saisons'}.`,
      );
  }

  return (
    <div className="tutorial">
      <div className="tutorial-progress" aria-label={`Étape ${step + 1} sur 4`}>
        {[0, 1, 2, 3].map((index) => (
          <i className={index <= step ? 'active' : ''} key={index} />
        ))}
      </div>
      {step === 0 && (
        <div className="tutorial-scene">
          <strong>1. Former une paire</strong>
          <p>
            Une tuile libre est lumineuse. Sélectionnez deux motifs identiques.
          </p>
          <div className="tutorial-tiles">
            {[0, 1].map((index) => (
              <button
                className={`tutorial-tile free ${simpleSelected === index ? 'chosen' : ''}`}
                key={index}
                onClick={() => chooseSimpleTile(index)}
                aria-label={`${faceLabel('dot-3')}${simpleSelected === index ? ', sélectionnée' : ''}`}
              >
                <TileFace face="dot-3" />
              </button>
            ))}
          </div>
        </div>
      )}
      {step === 1 && (
        <div className="tutorial-scene">
          <strong>2. Reconnaître une tuile bloquée</strong>
          <p>Une tuile sombre est recouverte ou serrée entre ses voisines.</p>
          <div className="tutorial-tiles">
            <button
              className="tutorial-tile blocked-example"
              onClick={() => {
                setBlockedSeen(true);
                setTutorialMessage(
                  'Elle est bloquée. Libérez d’abord la tuile lumineuse.',
                );
              }}
            >
              <TileFace face="bamboo-5" />
              <span>bloquée</span>
            </button>
            <button
              className="tutorial-tile free"
              onClick={() => {
                if (!blockedSeen) {
                  setTutorialMessage('Essayez d’abord la tuile sombre.');
                  return;
                }
                setStep(2);
                setTutorialMessage(
                  'Associez les deux saisons, puis les deux fleurs.',
                );
              }}
            >
              <TileFace face="bamboo-5" />
              <span>libre</span>
            </button>
          </div>
        </div>
      )}
      {step === 2 && (
        <div className="tutorial-scene">
          <strong>3. Saisons et fleurs</strong>
          <p>
            Deux saisons différentes s’associent. Toutes les fleurs s’associent
            aussi entre elles.
          </p>
          <div className="tutorial-tiles bonus-tiles">
            {bonusFaces.map((face) => {
              const group = face.startsWith('season-') ? 'seasons' : 'flowers';
              const removed = bonusDone.includes(group);
              return (
                <button
                  className={`tutorial-tile free ${bonusSelected === face ? 'chosen' : ''} ${removed ? 'removed' : ''}`}
                  disabled={removed}
                  key={face}
                  onClick={() => chooseBonus(face)}
                  aria-label={faceLabel(face)}
                >
                  <TileFace face={face} />
                </button>
              );
            })}
          </div>
        </div>
      )}
      {step === 3 && (
        <div className="tutorial-finish">
          <span>
            <Check />
          </span>
          <strong>Vous êtes prêt.</strong>
          <p>
            Libérez le jardin à votre rythme. Les aides restent disponibles.
          </p>
          <button className="gold-button" onClick={onComplete}>
            Entrer dans la clairière <ChevronRight />
          </button>
        </div>
      )}
      <output className="tutorial-message" aria-live="polite">
        {tutorialMessage}
      </output>
    </div>
  );
}

function MiniBoard({ level }: { level: number }) {
  const tiles = layout(level);
  const bounds = boardBounds(tiles);
  const columns = Math.round((bounds.width - 100) / 72) + 1;
  const rows = Math.round((bounds.height - 118) / 90) + 1;
  return (
    <svg
      viewBox={`0 0 ${columns * 15 + 8} ${rows * 14 + 8}`}
      className="mini-board"
      aria-hidden="true"
    >
      {tiles.map((t) => (
        <rect
          key={t.id}
          x={(t.x - bounds.minX) * 15 + 7 - t.z * 1.8}
          y={(t.y - bounds.minY) * 14 + 4 - t.z * 1.5}
          width="13"
          height="12"
          rx="2"
          fill={t.z ? '#e6cc91' : '#d2dfcf'}
          opacity={0.5 + t.z * 0.15}
          stroke="#173d37"
          strokeWidth=".8"
        />
      ))}
    </svg>
  );
}

export default function Home() {
  const [game, dispatch] = useReducer(reducer, undefined, () =>
    newSession(0, 2026),
  );
  const [ready, setReady] = useState(false);
  const [best, setBest] = useState<Record<string, number>>({});
  const [bestTimes, setBestTimes] = useState<Record<string, number>>({});
  const [medals, setMedals] = useState<MedalRecord>({});
  const [dailyResults, setDailyResults] = useState<DailyResults>({});
  const [stats, setStats] = useState<LocalStats>(EMPTY_STATS);
  const [comfort, setComfort] = useState<ComfortSettings>(DEFAULT_COMFORT);
  const [tutorialSeen, setTutorialSeen] = useState(false);
  const [atTitle, setAtTitle] = useState(true);
  const [hasJourney, setHasJourney] = useState(false);
  const [tutorialNext, setTutorialNext] = useState<'game' | 'levels'>('game');
  const [newGameSelection, setNewGameSelection] = useState(false);
  const [sound, setSound] = useState(true);
  const [selected, setSelected] = useState<number | null>(null);
  const [hint, setHint] = useState<Pair | null>(null);
  const [panel, setPanel] = useState<Panel>(null);
  const [message, setMessage] = useState(
    'Associez deux tuiles identiques et libres.',
  );
  const [vanishing, setVanishing] = useState<Pair | null>(null);
  const [victoryDismissed, setVictoryDismissed] = useState(false);
  const [visible, setVisible] = useState(true);
  const [storageUnavailable, setStorageUnavailable] = useState(false);
  const [installPrompt, setInstallPrompt] = useState<InstallPrompt | null>(
    null,
  );
  const [installed, setInstalled] = useState(false);
  const soundRef = useRef<JadeAudio | null>(null);
  const actionTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const busy = useRef(false);
  const free = useMemo(() => freeTiles(game.tiles), [game.tiles]);
  const pairs = useMemo(() => matchingPairs(game.tiles), [game.tiles]);
  const freeIds = new Set(free.map((t) => t.id));
  const remaining = game.tiles.filter((t) => !t.removed).length;
  const shufflesLeft = Math.max(0, MAX_SHUFFLES - game.shuffles);
  const hintsLeft = Math.max(0, MAX_HINTS - game.hints);
  const won = remaining === 0;
  const bounds = boardBounds(game.tiles);
  const level = LEVELS[game.level];
  const difficulty = DIFFICULTY_PROFILES[game.level];
  const today = dailyChallenge();
  const isDaily = game.mode === 'daily';
  const dailyResult = dailyResults[today.key];
  const dailyStreak = currentDailyStreak(dailyResults);
  const todayInProgress =
    isDaily && game.dailyKey === today.key && !won && hasJourney;
  const victory = ready && !atTitle && won && !victoryDismissed;
  const paused =
    atTitle ||
    panel !== null ||
    !visible ||
    victory ||
    (!!vanishing && remaining === 2);
  const completeCount = Object.keys(best).length;
  const completedBest = isDaily ? best : { ...best, [game.level]: stars(game) };
  const newlyUnlocked = isDaily
    ? []
    : LEVELS.map((candidate, index) => ({ candidate, index }))
        .filter(({ index }) => !isLevelUnlocked(index, best))
        .filter(({ index }) => isLevelUnlocked(index, completedBest));

  useEffect(() => {
    let cancelled = false;
    queueMicrotask(() => {
      if (cancelled) return;
      try {
        localStorage.removeItem('jardin-de-jade-v1');
        localStorage.removeItem('jardin-de-jade-v2');
        localStorage.removeItem('jardin-de-jade-v3');
        localStorage.removeItem('jardin-de-jade-v4');
        localStorage.removeItem('jardin-de-jade-v5');
        const saved = readSave(localStorage.getItem(SAVE_KEY));
        if (saved) {
          setHasJourney(true);
          const currentDaily = localDateKey();
          if (
            saved.session.mode === 'daily' &&
            saved.session.dailyKey !== currentDaily
          )
            dispatch({ type: 'start', level: 0, seed: seedNow() });
          else dispatch({ type: 'restore', session: saved.session });
          const completed = saved.session.tiles.every((t) => t.removed);
          setBest(
            completed && saved.session.mode === 'campaign'
              ? {
                  ...saved.best,
                  [saved.session.level]: Math.max(
                    saved.best[saved.session.level] ?? 0,
                    stars(saved.session),
                  ),
                }
              : saved.best,
          );
          setBestTimes(
            saved.session.mode === 'campaign'
              ? recordTime(saved.bestTimes, saved.session)
              : saved.bestTimes,
          );
          setMedals(
            saved.session.mode === 'campaign'
              ? recordMedals(saved.medals, saved.session)
              : saved.medals,
          );
          setDailyResults(saved.dailyResults);
          setStats(saved.stats);
          setComfort(saved.comfort);
          setTutorialSeen(saved.tutorialSeen);
          setSound(saved.sound);
        } else {
          dispatch({ type: 'start', level: 0, seed: seedNow() });
        }
      } catch {
        setStorageUnavailable(true);
      }
      setReady(true);
    });
    const onVisibility = () => {
      setVisible(!document.hidden);
      if (document.hidden) soundRef.current?.stop();
    };
    queueMicrotask(onVisibility);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      cancelled = true;
      document.removeEventListener('visibilitychange', onVisibility);
      if (actionTimer.current) clearTimeout(actionTimer.current);
      soundRef.current?.dispose();
      soundRef.current = null;
    };
  }, []);
  useEffect(() => {
    let cancelled = false;
    const standalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      Boolean((navigator as Navigator & { standalone?: boolean }).standalone);
    queueMicrotask(() => {
      if (!cancelled) setInstalled(standalone);
    });
    const offerInstall = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as InstallPrompt);
    };
    const confirmInstall = () => {
      setInstalled(true);
      setInstallPrompt(null);
    };
    window.addEventListener('beforeinstallprompt', offerInstall);
    window.addEventListener('appinstalled', confirmInstall);
    if ('serviceWorker' in navigator)
      navigator.serviceWorker.register('service-worker.js').catch(() => {});
    return () => {
      cancelled = true;
      window.removeEventListener('beforeinstallprompt', offerInstall);
      window.removeEventListener('appinstalled', confirmInstall);
    };
  }, []);
  useEffect(() => {
    if (!ready) return;
    try {
      const data: Save = {
        version: 6,
        session: game,
        best,
        bestTimes,
        medals,
        dailyResults,
        stats,
        comfort,
        tutorialSeen,
        sound,
      };
      localStorage.setItem(SAVE_KEY, JSON.stringify(data));
    } catch {
      queueMicrotask(() => setStorageUnavailable(true));
    }
  }, [
    game,
    best,
    bestTimes,
    medals,
    dailyResults,
    stats,
    comfort,
    tutorialSeen,
    sound,
    ready,
  ]);
  useEffect(() => {
    if (!ready || paused || won) return;
    const interval = setInterval(() => dispatch({ type: 'tick' }), 1000);
    return () => clearInterval(interval);
  }, [ready, paused, won]);
  useEffect(() => {
    function key(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setSelected(null);
        setHint(null);
      }
      if (
        (e.key === 'ArrowLeft' ||
          e.key === 'ArrowRight' ||
          e.key === 'ArrowUp' ||
          e.key === 'ArrowDown') &&
        e.target instanceof HTMLElement &&
        e.target.classList.contains('tile')
      ) {
        e.preventDefault();
        const buttons = Array.from(
          document.querySelectorAll<HTMLButtonElement>(
            '.tile.free:not(.vanishing)',
          ),
        );
        const index = buttons.indexOf(e.target as HTMLButtonElement);
        const offset = e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 1;
        buttons[(index + offset + buttons.length) % buttons.length]?.focus();
      }
    }
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  }, []);

  function playSound(cue: SoundCue, force = false) {
    if ((!sound && !force) || document.hidden) return;
    soundRef.current ??= new JadeAudio();
    soundRef.current.setEnabled(true);
    soundRef.current.play(cue);
  }
  function toggleSound() {
    const enabled = !sound;
    setSound(enabled);
    soundRef.current?.setEnabled(enabled);
    if (enabled) playSound('select', true);
  }
  async function installGame() {
    if (!installPrompt) {
      setPanel('install');
      return;
    }
    await installPrompt.prompt();
    const choice = await installPrompt.userChoice;
    setInstallPrompt(null);
    if (choice.outcome === 'accepted') setInstalled(true);
    else setPanel('install');
  }
  function clearSelection() {
    setSelected(null);
    setHint(null);
  }
  function start(levelIndex: number, replay = false) {
    if (!isLevelUnlocked(levelIndex, best)) return;
    soundRef.current?.stop();
    playSound('start');
    if (actionTimer.current) clearTimeout(actionTimer.current);
    busy.current = false;
    setAtTitle(false);
    setHasJourney(true);
    setNewGameSelection(false);
    setVanishing(null);
    dispatch({
      type: 'start',
      level: levelIndex,
      seed: replay ? game.seed : seedNow(),
      mode: 'campaign',
    });
    clearSelection();
    setPanel(null);
    setVictoryDismissed(false);
    setMessage('Associez deux tuiles identiques et libres.');
  }
  function startDaily() {
    soundRef.current?.stop();
    playSound('start');
    if (actionTimer.current) clearTimeout(actionTimer.current);
    busy.current = false;
    setAtTitle(false);
    setHasJourney(true);
    setVanishing(null);
    dispatch({
      type: 'start',
      level: today.level,
      seed: today.seed,
      mode: 'daily',
      dailyKey: today.key,
    });
    clearSelection();
    setPanel(null);
    setVictoryDismissed(false);
    setMessage(
      'Défi quotidien : la même disposition vous attend toute la journée.',
    );
  }
  function enterDaily() {
    if (todayInProgress) {
      setAtTitle(false);
      setPanel(null);
    } else startDaily();
  }
  function beginJourney() {
    setAtTitle(false);
    setHasJourney(true);
    setNewGameSelection(true);
    if (tutorialSeen) setPanel('levels');
    else {
      setTutorialNext('levels');
      setPanel('tutorial');
    }
  }
  function openTutorial(next: 'game' | 'levels' = 'game') {
    setTutorialNext(next);
    setPanel('tutorial');
  }
  function pick(tile: Tile) {
    if (busy.current || !ready || paused) return;
    if (!freeIds.has(tile.id)) {
      playSound('blocked');
      setMessage(
        'Cette tuile est bloquée : libérez le dessus et au moins un côté.',
      );
      return;
    }
    setHint(null);
    if (selected === tile.id) {
      playSound('select');
      setSelected(null);
      setMessage('Sélection annulée.');
      return;
    }
    const previous = game.tiles.find((t) => t.id === selected);
    if (
      previous &&
      facesMatch(previous.face, tile.face) &&
      isFree(previous, game.tiles)
    ) {
      const pair: Pair = [previous.id, tile.id];
      busy.current = true;
      setVanishing(pair);
      setSelected(null);
      playSound(remaining === 2 ? 'win' : 'match');
      setMessage(pairFoundMessage(previous.face, tile.face));
      actionTimer.current = setTimeout(() => {
        dispatch({ type: 'match', pair });
        if (remaining === 2) {
          setPanel(null);
          const finished = reducer(game, { type: 'match', pair });
          if (!game.completionRecorded) {
            setStats((current) => recordLocalStats(current, finished));
            if (finished.mode === 'daily')
              setDailyResults((current) => recordDaily(current, finished));
            else {
              setBestTimes((current) => recordTime(current, finished));
              setMedals((current) => recordMedals(current, finished));
            }
          }
        }
        if (
          remaining === 2 &&
          game.mode === 'campaign' &&
          !game.completionRecorded
        )
          setBest((current) => ({
            ...current,
            [game.level]: Math.max(current[game.level] ?? 0, stars(game)),
          }));
        setVanishing(null);
        busy.current = false;
        actionTimer.current = null;
      }, 200);
    } else {
      setSelected(tile.id);
      playSound(previous ? 'blocked' : 'select');
      setMessage(
        previous
          ? 'Ces motifs sont différents. Choisissez une tuile identique.'
          : `${faceLabel(tile.face)} sélectionné : trouvez son double.`,
      );
    }
  }
  function showHint() {
    if (busy.current || !pairs.length || hintsLeft === 0) return;
    playSound('hint');
    const certificate = game.solution.find((pair) =>
      pairs.some((p) => p.includes(pair[0]) && p.includes(pair[1])),
    );
    setHint(certificate ?? pairs[0]);
    setSelected(null);
    dispatch({ type: 'hint' });
    setMessage(
      `Deux tuiles dorées peuvent être associées. +${HINT_PENALTY_SECONDS} secondes. Indices restants : ${hintsLeft - 1}.`,
    );
  }
  function undo() {
    if (busy.current || !game.history.length) return;
    playSound('undo');
    dispatch({ type: 'undo' });
    clearSelection();
    setVictoryDismissed(false);
    setMessage('Dernière action annulée.');
  }
  function mix() {
    if (busy.current || won || shufflesLeft === 0) return;
    playSound('shuffle');
    dispatch({ type: 'shuffle', seed: seedNow() });
    clearSelection();
    setMessage(
      `Tuiles redistribuées. +${SHUFFLE_PENALTY_SECONDS} secondes de pénalité. Mélanges restants : ${shufflesLeft - 1}.`,
    );
  }
  const modalTitle =
    panel === 'levels'
      ? 'Votre promenade'
      : panel === 'help'
        ? 'L’art de faire une paire'
        : panel === 'daily'
          ? 'Défi quotidien'
          : panel === 'tutorial'
            ? 'Premiers pas'
            : panel === 'stats'
              ? 'Votre carnet de voyage'
              : panel === 'comfort'
                ? 'Confort de jeu'
                : panel === 'pause'
                  ? 'Le jardin vous attend'
                  : panel === 'install'
                    ? 'Installer Jardin de Jade'
                    : 'Recommencer ce jardin ?';
  return (
    <main
      className="garden-app"
      data-garden-theme={level.theme}
      data-large-tiles={comfort.largeTiles}
      data-high-contrast={comfort.highContrast}
    >
      {atTitle && (
        <section className="title-screen" aria-label="Menu principal">
          <div className="title-emblem" aria-hidden="true">
            <Leaf />
          </div>
          <p className="title-kicker">MAHJONG SOLITAIRE</p>
          <h1>Jardin de Jade</h1>
          <p className="title-intro">
            Libérez les tuiles et cheminez à travers quinze jardins.
          </p>
          <div className="title-menu">
            {hasJourney && !won && (
              <button
                className="title-primary"
                onClick={() => setAtTitle(false)}
              >
                <Play />
                <span>
                  <strong>Continuer</strong>
                  <small>
                    {isDaily ? 'Défi du jour' : level.name} ·{' '}
                    {formatTime(game.seconds)}
                  </small>
                </span>
                <ChevronRight />
              </button>
            )}
            <button className="title-secondary" onClick={beginJourney}>
              <Grid2X2 />
              <span>
                <strong>Nouvelle partie</strong>
                <small>Choisir un jardin sur la carte</small>
              </span>
              <ChevronRight />
            </button>
            <button className="title-secondary" onClick={enterDaily}>
              <CalendarDays />
              <span>
                <strong>
                  {todayInProgress ? 'Reprendre le défi' : 'Défi du jour'}
                </strong>
                <small>
                  {dailyResult
                    ? `Record ${formatTime(dailyResult.bestTime)}`
                    : formatDailyDate(today.key)}
                </small>
              </span>
              <ChevronRight />
            </button>
          </div>
          <div className="title-shortcuts" aria-label="Options">
            <button onClick={() => openTutorial('game')}>
              <BookOpen /> Didacticiel
            </button>
            <button onClick={() => setPanel('stats')}>
              <BarChart3 /> Statistiques
            </button>
            <button onClick={() => setPanel('comfort')}>
              <Settings2 /> Confort
            </button>
            {!installed && (
              <button onClick={installGame}>
                <Download /> Installer
              </button>
            )}
          </div>
          <button
            className="title-sound"
            aria-label={sound ? 'Désactiver le son' : 'Activer le son'}
            aria-pressed={sound}
            onClick={toggleSound}
          >
            {sound ? <Volume2 /> : <VolumeX />}
          </button>
          <p className="title-local-note">
            Progression conservée sur cet appareil
          </p>
        </section>
      )}
      <div className={atTitle ? 'game-view title-hidden' : 'game-view'}>
        <header className="topbar">
          <button
            className="brand"
            onClick={() => setAtTitle(true)}
            aria-label="Retourner au menu principal"
          >
            <span className="brand-mark">
              <Leaf />
            </span>
            <span>
              Jardin de Jade<small>MAHJONG SOLITAIRE</small>
            </span>
          </button>
          <div className="header-actions">
            <button
              className="quiet-button daily-button"
              onClick={() => setPanel('daily')}
              aria-label={`Défi du jour, série actuelle ${dailyStreak}`}
            >
              <CalendarDays />
              <span>Défi du jour</span>
              {dailyStreak > 0 && <b>{dailyStreak}</b>}
            </button>
            {!installed && (
              <button
                className="quiet-button install-button"
                onClick={installGame}
                aria-label="Installer le jeu sur cet appareil"
                title="Installer le jeu"
              >
                <Download />
                <span>Installer</span>
              </button>
            )}
            <button
              className="quiet-button help-button"
              onClick={() => setPanel('help')}
              aria-label="Comment jouer"
            >
              <CircleHelp />
              <span>Comment jouer</span>
            </button>
            <button
              className="quiet-button icon-button"
              aria-label="Voir les statistiques"
              title="Statistiques"
              onClick={() => setPanel('stats')}
            >
              <BarChart3 />
            </button>
            <button
              className="quiet-button icon-button"
              aria-label="Régler le confort de jeu"
              title="Confort de jeu"
              onClick={() => setPanel('comfort')}
            >
              <Settings2 />
            </button>
            <button
              className="quiet-button icon-button sound-toggle"
              aria-label={sound ? 'Désactiver le son' : 'Activer le son'}
              aria-pressed={sound}
              title={sound ? 'Couper les bruitages' : 'Activer les bruitages'}
              onClick={toggleSound}
            >
              {sound ? <Volume2 /> : <VolumeX />}
            </button>
          </div>
        </header>
        <section className="game-shell" aria-label="Partie de Mahjong">
          <div className="level-heading">
            <button
              className="level-tag"
              onClick={() => setPanel(isDaily ? 'daily' : 'levels')}
            >
              {isDaily ? (
                <>DÉFI DU JOUR</>
              ) : (
                <>
                  JARDIN {String(game.level + 1).padStart(2, '0')}{' '}
                  <span>/ {LEVELS.length}</span>
                </>
              )}
              <ChevronRight size={14} />
            </button>
            <h1>{level.name}</h1>
            <span className="ambience-name">{THEME_LABELS[level.theme]}</span>
            <p>
              {isDaily ? formatDailyDate(game.dailyKey!) : level.subtitle}{' '}
              <span className="heading-dot">·</span> {difficulty.label} · défi{' '}
              {formatDifficulty(difficulty.score)}/5
            </p>
            <p className="best-time">
              <Trophy size={14} />
              {(isDaily
                ? dailyResults[game.dailyKey!]?.bestTime
                : bestTimes[game.level]) !== undefined
                ? `Meilleur temps : ${formatTime(isDaily ? dailyResults[game.dailyKey!]!.bestTime : bestTimes[game.level])}`
                : 'Meilleur temps : à établir'}
            </p>
          </div>
          <div className="game-stats">
            <span>
              <b>{remaining}</b> <span>tuiles restantes</span>
            </span>
            <span>
              <b>{pairs.length}</b> <span>paires libres</span>
            </span>
            <span className="clock-stat">
              <b>{comfort.hideTimer ? '••:••' : formatTime(game.seconds)}</b>
              {game.penaltySeconds > 0 && (
                <small
                  className="time-penalty"
                  title="Pénalités déjà incluses dans le chronomètre"
                >
                  dont +{game.penaltySeconds} s
                </small>
              )}
              <button
                aria-label="Mettre en pause"
                onClick={() => setPanel('pause')}
                disabled={won}
              >
                <Pause size={15} />
              </button>
            </span>
          </div>
          <div className="board-area">
            <fieldset
              className={`board ${panel === 'pause' ? 'paused-board' : ''}`}
              aria-label={`Plateau, ${remaining} tuiles restantes`}
              style={
                {
                  '--board-ratio': bounds.width / bounds.height,
                  aspectRatio: `${bounds.width} / ${bounds.height}`,
                } as CSSProperties
              }
            >
              {game.tiles
                .filter((t) => !t.removed)
                .map((tile) => (
                  <button
                    key={tile.id}
                    type="button"
                    data-tile-id={tile.id}
                    data-face={tile.face}
                    data-layer={tile.z}
                    aria-label={`${faceLabel(tile.face)}, ${freeIds.has(tile.id) ? 'libre' : 'bloquée'}, étage ${tile.z + 1}`}
                    aria-pressed={selected === tile.id}
                    aria-disabled={!freeIds.has(tile.id) || paused}
                    tabIndex={freeIds.has(tile.id) && !paused ? 0 : -1}
                    onClick={() => pick(tile)}
                    className={`tile ${freeIds.has(tile.id) ? 'free' : 'blocked'} ${selected === tile.id ? 'selected' : ''} ${hint?.includes(tile.id) ? 'hinted' : ''} ${vanishing?.includes(tile.id) ? 'vanishing' : ''}`}
                    style={{
                      left: `${((20 + (tile.x - bounds.minX) * 72 + tile.z * TILE_LAYER_OFFSET_X) / bounds.width) * 100}%`,
                      top: `${((22 + (tile.y - bounds.minY) * 90 - tile.z * TILE_LAYER_OFFSET_Y) / bounds.height) * 100}%`,
                      width: `${(66 / bounds.width) * 100}%`,
                      height: `${(84 / bounds.height) * 100}%`,
                      zIndex: tile.z * 1000 + tile.y * 10 + tile.x,
                    }}
                  >
                    <TileFace face={tile.face} />
                    <span className="selected-check" aria-hidden="true">
                      <Check size={11} />
                    </span>
                  </button>
                ))}
              {won && (
                <div className="empty-garden">
                  <Leaf size={48} />
                  <p>Le jardin est libéré.</p>
                  <button
                    className="gold-button"
                    onClick={() => setPanel(isDaily ? 'daily' : 'levels')}
                  >
                    {isDaily ? 'Voir le défi du jour' : 'Voir la promenade'}{' '}
                    <ChevronRight size={18} />
                  </button>
                </div>
              )}
            </fieldset>
          </div>
          {!won && pairs.length === 0 && !vanishing ? (
            <output className="stuck-message">
              <span>
                {shufflesLeft > 0
                  ? 'Aucune paire libre. Un nouveau regard ?'
                  : 'Aucune paire libre et plus de mélange. Annulez un coup ou recommencez.'}
              </span>
              {shufflesLeft > 0 && (
                <button onClick={mix}>
                  Mélanger (+{SHUFFLE_PENALTY_SECONDS} s)
                </button>
              )}
              <button disabled={!game.history.length} onClick={undo}>
                Annuler
              </button>
              {shufflesLeft === 0 && (
                <button onClick={() => setPanel('restart')}>Recommencer</button>
              )}
            </output>
          ) : (
            <output className="board-message" aria-live="polite">
              {message}
            </output>
          )}
          <nav className="toolbar" aria-label="Aides de jeu">
            <button
              onClick={showHint}
              disabled={won || !!vanishing || !pairs.length || hintsLeft === 0}
              aria-label={`Indice : ${hintsLeft} utilisations restantes, pénalité de ${HINT_PENALTY_SECONDS} secondes`}
            >
              <Lightbulb />
              <span>Indice</span>
              <small className="shuffle-cost">
                {hintsLeft}/{MAX_HINTS} · +{HINT_PENALTY_SECONDS} s
              </small>
            </button>
            <button
              onClick={undo}
              disabled={!game.history.length || !!vanishing}
            >
              <Undo2 />
              <span>Annuler</span>
            </button>
            <button
              onClick={mix}
              disabled={won || !!vanishing || shufflesLeft === 0}
              aria-label={`Mélanger : ${shufflesLeft} utilisation${shufflesLeft > 1 ? 's' : ''} restante${shufflesLeft > 1 ? 's' : ''}, pénalité de ${SHUFFLE_PENALTY_SECONDS} secondes`}
            >
              <Shuffle />
              <span>Mélanger</span>
              <small className="shuffle-cost">
                {shufflesLeft}/{MAX_SHUFFLES} · +{SHUFFLE_PENALTY_SECONDS} s
              </small>
            </button>
            <button onClick={() => setPanel('levels')}>
              <Grid2X2 />
              <span>Jardins</span>
            </button>
          </nav>
          <div className="under-controls">
            <span>
              <span className="status-dot" />
              {storageUnavailable
                ? 'Sauvegarde indisponible sur ce navigateur'
                : 'Progression sauvegardée sur cet appareil'}
            </span>
            <button onClick={() => setPanel('restart')}>
              <RotateCcw size={13} /> Recommencer
            </button>
          </div>
        </section>
        <footer>
          <span className="ornament">—</span> Prenez votre temps. Le jardin
          n’est pas pressé. <span className="ornament">—</span>
        </footer>
      </div>
      <Dialog
        open={panel !== null}
        onOpenChange={(open) => {
          if (!open) {
            if (panel === 'levels') setNewGameSelection(false);
            setPanel(null);
          }
        }}
      >
        <DialogContent
          showCloseButton={false}
          className={`jade-dialog ${panel === 'levels' ? 'levels-dialog' : ''}`}
        >
          <DialogClose className="dialog-close" aria-label="Fermer">
            <X size={20} />
          </DialogClose>
          <span className="eyebrow">JARDIN DE JADE</span>
          <DialogTitle className="modal-title">{modalTitle}</DialogTitle>
          <DialogDescription className="modal-description">
            {panel === 'levels'
              ? `${completeCount} jardin${completeCount > 1 ? 's' : ''} terminé${completeCount > 1 ? 's' : ''} sur ${LEVELS.length}. Chaque réussite ouvre une nouvelle voie dans le jardin.`
              : panel === 'help'
                ? 'Retirez toutes les tuiles en associant leurs motifs.'
                : panel === 'daily'
                  ? 'Une disposition unique, identique pendant toute cette journée.'
                  : panel === 'tutorial'
                    ? 'Trois gestes suffisent pour apprendre les règles essentielles.'
                    : panel === 'stats'
                      ? 'Vos résultats restent uniquement sur cet appareil.'
                      : panel === 'comfort'
                        ? 'Adaptez l’affichage sans modifier les règles du jeu.'
                        : panel === 'pause'
                          ? 'Le temps est suspendu. Revenez quand vous le souhaitez.'
                          : panel === 'install'
                            ? 'Gardez le jeu parmi vos applications et retrouvez votre progression sur cet appareil.'
                            : 'La partie en cours sera remplacée. Vos jardins déjà terminés restent enregistrés.'}
          </DialogDescription>
          {panel === 'levels' && (
            <div className="level-path" aria-label="Carte des jardins">
              <div className="campaign-intro">
                <span className="campaign-compass" aria-hidden="true">
                  <Leaf />
                </span>
                <span>
                  <strong>Le sentier du jade</strong>
                  <small>
                    Chaque embranchement mène vers un nouveau paysage.
                  </small>
                </span>
              </div>
              {CAMPAIGN_STAGES.map(({ rank, rows }) => (
                <section className="level-stage" data-rank={rank} key={rank}>
                  <div className="stage-marker">
                    <span>ÉTAPE {rank}</span>
                    <i aria-hidden="true" />
                  </div>
                  {rows.map((row, rowIndex) => (
                    <div className="level-row" key={`${rank}-${rowIndex}`}>
                      {row.map(({ level: l, index: i }) => (
                        <button
                          key={l.name}
                          data-theme={l.theme}
                          className={`level-card ${i === game.level ? 'current' : ''} ${!isLevelUnlocked(i, best) ? 'locked' : ''}`}
                          disabled={!isLevelUnlocked(i, best)}
                          onClick={() =>
                            i === game.level && !won && !newGameSelection
                              ? setPanel(null)
                              : start(i)
                          }
                        >
                          <span className="level-card-number">
                            {String(i + 1).padStart(2, '0')}
                            {!isLevelUnlocked(i, best) && (
                              <LockKeyhole size={16} />
                            )}
                            {best[i] && (
                              <span
                                className="tiny-stars"
                                aria-label={`${best[i]} étoiles`}
                              >
                                {'★'.repeat(best[i])}
                              </span>
                            )}
                          </span>
                          <MiniBoard level={i} />
                          <strong>{l.name}</strong>
                          <span>
                            {DIFFICULTY_PROFILES[i].label} · défi{' '}
                            {formatDifficulty(DIFFICULTY_PROFILES[i].score)}/5 ·{' '}
                            {layout(i).length} tuiles
                          </span>
                          <span
                            className="medal-rack"
                            aria-label={`${medals[i]?.length ?? 0} médailles sur ${MEDAL_DEFINITIONS.length}`}
                          >
                            {MEDAL_DEFINITIONS.map((medal) => (
                              <i
                                key={medal.id}
                                className={
                                  medals[i]?.includes(medal.id) ? 'earned' : ''
                                }
                                title={`${medal.name} : ${medal.description}`}
                              >
                                <MedalGlyph id={medal.id} />
                              </i>
                            ))}
                          </span>
                          {!isLevelUnlocked(i, best) ? (
                            <small className="lock-reason">
                              Terminez{' '}
                              {l.requires
                                .map((required) => LEVELS[required].name)
                                .join(' et ')}
                            </small>
                          ) : bestTimes[i] !== undefined ? (
                            <small className="level-record">
                              Meilleur temps : {formatTime(bestTimes[i])}
                            </small>
                          ) : null}
                          {i === game.level && !won && (
                            <small>Reprendre la partie</small>
                          )}
                        </button>
                      ))}
                    </div>
                  ))}
                </section>
              ))}
            </div>
          )}
          {panel === 'daily' && (
            <div className="daily-panel">
              <div className="daily-date">
                <CalendarDays />
                <span>
                  <small>{formatDailyDate(today.key)}</small>
                  <strong>{LEVELS[today.level].name}</strong>
                </span>
              </div>
              <div className="daily-facts">
                <span>
                  <Flame />
                  <b>{dailyStreak}</b>
                  Série actuelle
                </span>
                <span>
                  <Trophy />
                  <b>{dailyResult ? formatTime(dailyResult.bestTime) : '—'}</b>
                  Meilleur temps
                </span>
                <span>
                  <Star />
                  <b>{dailyResult?.bestStars ?? 0}/3</b>
                  Meilleur score
                </span>
              </div>
              <p>
                Le jardin et la distribution sont calculés à partir de la date
                locale. Vous pouvez le rejouer, mais une seule nouvelle épreuve
                apparaîtra demain.
              </p>
              <button className="gold-button" onClick={enterDaily}>
                {todayInProgress
                  ? 'Reprendre le défi'
                  : dailyResult
                    ? 'Rejouer le défi'
                    : 'Commencer le défi'}
                <ChevronRight />
              </button>
            </div>
          )}
          {panel === 'tutorial' && (
            <Tutorial
              onComplete={() => {
                setTutorialSeen(true);
                setPanel(tutorialNext === 'levels' ? 'levels' : null);
              }}
            />
          )}
          {panel === 'stats' && (
            <div className="stats-panel">
              <div
                className="progress-ring"
                style={
                  {
                    '--progress': `${(completeCount / LEVELS.length) * 360}deg`,
                  } as CSSProperties
                }
              >
                <span>
                  <b>{Math.round((completeCount / LEVELS.length) * 100)}%</b>
                  campagne
                </span>
              </div>
              <div className="stats-grid">
                <span>
                  <b>{stats.completedGames}</b>Parties terminées
                </span>
                <span>
                  <b>
                    {Object.values(best).filter((value) => value === 3).length}
                  </b>
                  Jardins parfaits
                </span>
                <span>
                  <b>{formatLongTime(stats.totalSeconds)}</b>Temps cumulé
                </span>
                <span>
                  <b>{stats.hintsUsed + stats.shufflesUsed}</b>Aides utilisées
                </span>
                <span>
                  <b>{Object.values(medals).flat().length}</b>Médailles gagnées
                </span>
                <span>
                  <b>{Object.keys(dailyResults).length}</b>Défis quotidiens
                </span>
              </div>
              <div className="streak-summary">
                <Flame /> Plus longue série quotidienne :{' '}
                <strong>
                  {longestDailyStreak(dailyResults)} jour
                  {longestDailyStreak(dailyResults) > 1 ? 's' : ''}
                </strong>
              </div>
            </div>
          )}
          {panel === 'comfort' && (
            <div className="comfort-panel">
              <button
                aria-pressed={comfort.largeTiles}
                onClick={() =>
                  setComfort((current) => ({
                    ...current,
                    largeTiles: !current.largeTiles,
                  }))
                }
              >
                <ZoomIn />
                <span>
                  <strong>Grandes tuiles</strong>
                  <small>
                    Agrandit le plateau ; un léger défilement peut apparaître
                    sur téléphone.
                  </small>
                </span>
                <i>{comfort.largeTiles ? 'Activé' : 'Désactivé'}</i>
              </button>
              <button
                aria-pressed={comfort.highContrast}
                onClick={() =>
                  setComfort((current) => ({
                    ...current,
                    highContrast: !current.highContrast,
                  }))
                }
              >
                <Eye />
                <span>
                  <strong>Contraste renforcé</strong>
                  <small>
                    Distingue davantage les tuiles libres et bloquées.
                  </small>
                </span>
                <i>{comfort.highContrast ? 'Activé' : 'Désactivé'}</i>
              </button>
              <button
                aria-pressed={comfort.hideTimer}
                onClick={() =>
                  setComfort((current) => ({
                    ...current,
                    hideTimer: !current.hideTimer,
                  }))
                }
              >
                <Clock3 />
                <span>
                  <strong>Chronomètre discret</strong>
                  <small>
                    Masque le temps pendant la partie ; il reste enregistré.
                  </small>
                </span>
                <i>{comfort.hideTimer ? 'Activé' : 'Désactivé'}</i>
              </button>
            </div>
          )}
          {panel === 'help' && (
            <div className="rules">
              <div className="example-pair">
                <div className="sample-tile">
                  <TileFace face="dot-3" />
                </div>
                <span>+</span>
                <div className="sample-tile">
                  <TileFace face="dot-3" />
                </div>
                <Check />
              </div>
              <ol>
                <li>
                  <strong>Repérez deux motifs identiques.</strong> Touchez ou
                  cliquez sur la première tuile, puis sur sa jumelle.
                </li>
                <li>
                  <strong>Une tuile libre est plus lumineuse.</strong> Rien ne
                  doit la recouvrir, et son côté gauche ou droit doit être
                  dégagé.
                </li>
                <li>
                  <strong>Libérez tout le jardin.</strong> Si vous êtes bloqué,
                  annulez un coup ou mélangez les tuiles restantes.
                </li>
              </ol>
              <p>
                Les vents et dragons doivent correspondre exactement. Un indice
                montre une paire jouable, sans garantir la suite de vos choix.
              </p>
              <p>
                Terminer un jardin débloque les chemins qui en partent.
                Certaines étapes réunissent deux branches : il faut alors avoir
                terminé les deux jardins précédents.
              </p>
              <p>
                La difficulté est mesurée sur vingt distributions : durée du
                jardin, empilement, nombre de choix, coups forcés et choix qui
                peuvent conduire à une impasse.
              </p>
              <p>
                Quatre médailles secondaires récompensent une victoire sans
                indice, sans mélange, sans annulation et avant le temps cible du
                jardin.
              </p>
              <p className="star-rules">
                ★★★ Sans aide · ★★ Avec indices · ★ Avec mélange
                <br />
                Aucune limite de temps. Annuler ne retire pas d’étoile.
                <br />
                {MAX_HINTS} indices par partie, +{HINT_PENALTY_SECONDS} secondes
                chacun. Les pénalités et utilisations restent consommées après
                une annulation.
                <br />
                {MAX_SHUFFLES} mélanges par partie, +{SHUFFLE_PENALTY_SECONDS}{' '}
                secondes chacun. Annuler conserve la pénalité et ne rend pas de
                mélange. Recommencer une partie réinitialise le quota et le
                temps.
              </p>
              <p className="keyboard-note">
                Clavier : Tab ou flèches pour parcourir les tuiles libres,
                Entrée ou Espace pour choisir, Échap pour désélectionner.
              </p>
              <button
                className="outline-button tutorial-replay"
                onClick={() => openTutorial('game')}
              >
                <BookOpen /> Revoir le didacticiel
              </button>
              <button className="gold-button" onClick={() => setPanel(null)}>
                À moi de jouer <ChevronRight size={18} />
              </button>
            </div>
          )}
          {panel === 'pause' && (
            <div className="pause-content">
              <Leaf size={46} />
              <b>{formatTime(game.seconds)}</b>
              <button className="gold-button" onClick={() => setPanel(null)}>
                <Play size={18} /> Reprendre la partie
              </button>
            </div>
          )}
          {panel === 'install' && (
            <div className="install-help">
              <Download size={46} />
              <p>
                Sur <strong>iPhone ou iPad</strong>, ouvrez cette page dans
                Safari, touchez le bouton de partage, puis choisissez
                <strong> « Sur l’écran d’accueil »</strong>.
              </p>
              <p>
                Sur <strong>ordinateur ou Android</strong>, ouvrez le menu du
                navigateur et choisissez <strong>« Installer »</strong> ou
                <strong> « Ajouter à l’écran d’accueil »</strong>.
              </p>
              <p className="offline-note">
                Après une première ouverture, le jeu peut fonctionner sans
                connexion. La progression reste enregistrée sur l’appareil.
              </p>
              <button className="gold-button" onClick={() => setPanel(null)}>
                J’ai compris
              </button>
            </div>
          )}
          {panel === 'restart' && (
            <div className="restart-actions">
              <button
                className="gold-button"
                onClick={() =>
                  isDaily ? startDaily() : start(game.level, true)
                }
              >
                <RotateCcw size={18} />
                {isDaily
                  ? 'Recommencer le défi'
                  : 'Rejouer la même disposition'}
              </button>
              {!isDaily && (
                <button
                  className="outline-button"
                  onClick={() => start(game.level)}
                >
                  Nouvelle distribution
                </button>
              )}
              <button className="text-button" onClick={() => setPanel(null)}>
                Continuer ma partie
              </button>
            </div>
          )}
        </DialogContent>
      </Dialog>
      <Dialog
        open={victory}
        onOpenChange={(open) => {
          if (!open) setVictoryDismissed(true);
        }}
      >
        <DialogContent
          showCloseButton={false}
          className="jade-dialog victory-dialog"
        >
          <DialogClose className="dialog-close" aria-label="Fermer">
            <X />
          </DialogClose>
          <span className="victory-emblem">
            <Leaf size={35} />
          </span>
          <span className="eyebrow">
            {isDaily
              ? 'DÉFI QUOTIDIEN TERMINÉ'
              : `JARDIN ${String(game.level + 1).padStart(2, '0')} TERMINÉ`}
          </span>
          <DialogTitle className="modal-title">
            {isDaily
              ? 'Le défi du jour est relevé.'
              : 'Un peu plus de sérénité.'}
          </DialogTitle>
          <DialogDescription className="modal-description">
            Toutes les tuiles ont trouvé leur double.
          </DialogDescription>
          <div
            className="victory-stars"
            aria-label={`${stars(game)} étoiles sur 3`}
          >
            {[1, 2, 3].map((n) => (
              <Star
                key={n}
                className={n <= stars(game) ? 'earned' : ''}
                fill={n <= stars(game) ? 'currentColor' : 'none'}
              />
            ))}
          </div>
          <div className="victory-stats">
            <span>
              <b>{formatTime(game.seconds)}</b>Temps
            </span>
            <span>
              <b>{game.moves}</b>Paires
            </span>
            <span>
              <b>{game.hints + game.shuffles}</b>Aides
            </span>
          </div>
          {!isDaily && (
            <div className="victory-medals">
              <strong>Médailles obtenues</strong>
              <div>
                {MEDAL_DEFINITIONS.map((medal) => {
                  const obtained = earnedMedals(game).includes(medal.id);
                  return (
                    <span className={obtained ? 'earned' : ''} key={medal.id}>
                      <i>
                        <MedalGlyph id={medal.id} size={18} />
                      </i>
                      <small>{medal.name}</small>
                    </span>
                  );
                })}
              </div>
              <small>Temps cible : {formatTime(targetTime(game.level))}</small>
            </div>
          )}
          {isDaily && (
            <div className="daily-victory">
              <Flame />
              <span>
                <b>
                  {currentDailyStreak(dailyResults)} jour
                  {currentDailyStreak(dailyResults) > 1 ? 's' : ''}
                </b>
                Série quotidienne
              </span>
            </div>
          )}
          <p className="victory-record">
            <Trophy size={18} />
            Meilleur temps :{' '}
            {formatTime(
              isDaily
                ? (dailyResults[game.dailyKey!]?.bestTime ?? game.seconds)
                : (bestTimes[game.level] ?? game.seconds),
            )}
          </p>
          {newlyUnlocked.length > 0 && (
            <p className="unlock-notice">
              {newlyUnlocked.length === 1
                ? 'Nouveau jardin'
                : 'Nouveaux jardins'}{' '}
              :{' '}
              {newlyUnlocked
                .map(({ candidate }) => candidate.name)
                .join(' et ')}
            </p>
          )}
          {game.penaltySeconds > 0 && (
            <p className="penalty-summary">
              Temps total incluant {game.penaltySeconds} secondes de pénalité.
            </p>
          )}
          <button
            className="gold-button"
            onClick={() =>
              isDaily
                ? (setVictoryDismissed(true), setPanel('daily'))
                : newlyUnlocked.length === 1
                  ? start(newlyUnlocked[0].index)
                  : (setVictoryDismissed(true), setPanel('levels'))
            }
          >
            {isDaily
              ? 'Voir le défi du jour'
              : newlyUnlocked.length === 1
                ? 'Le jardin suivant'
                : 'Choisir la suite'}
            <ChevronRight size={18} />
          </button>
          <button
            className="text-button"
            onClick={() => {
              setVictoryDismissed(true);
              setPanel('levels');
            }}
          >
            <ArrowLeft size={15} /> Tous les jardins
          </button>
        </DialogContent>
      </Dialog>
    </main>
  );
}
