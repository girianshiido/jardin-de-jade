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

const SAVE_KEY = 'jardin-de-jade-v4';
const seedNow = () => Date.now() % 2147483647;
const formatTime = (s: number) =>
  `${Math.floor(s / 60)
    .toString()
    .padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;
const pairFoundMessage = (firstFace: string, secondFace: string) => {
  if (firstFace.startsWith('season-') && secondFace.startsWith('season-'))
    return `Paire de saisons trouvée : ${faceLabel(firstFace)} et ${faceLabel(secondFace)} !`;
  if (firstFace.startsWith('flower-') && secondFace.startsWith('flower-'))
    return `Paire de fleurs trouvée : ${faceLabel(firstFace)} et ${faceLabel(secondFace)} !`;
  return `Paire trouvée : ${faceLabel(secondFace)} !`;
};
type Panel = 'help' | 'levels' | 'pause' | 'restart' | 'install' | null;
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
  const victory = ready && won && !victoryDismissed;
  const paused =
    panel !== null || !visible || victory || (!!vanishing && remaining === 2);
  const completeCount = Object.keys(best).length;
  const completedBest = { ...best, [game.level]: stars(game) };
  const newlyUnlocked = LEVELS.map((candidate, index) => ({ candidate, index }))
    .filter(({ index }) => !isLevelUnlocked(index, best))
    .filter(({ index }) => isLevelUnlocked(index, completedBest));

  useEffect(() => {
    let cancelled = false;
    queueMicrotask(() => {
      if (cancelled) return;
      try {
        localStorage.removeItem('jardin-de-jade-v1');
        localStorage.removeItem('jardin-de-jade-v3');
        const saved = readSave(localStorage.getItem(SAVE_KEY));
        if (saved) {
          dispatch({ type: 'restore', session: saved.session });
          const completed = saved.session.tiles.every((t) => t.removed);
          setBest(
            completed
              ? {
                  ...saved.best,
                  [saved.session.level]: Math.max(
                    saved.best[saved.session.level] ?? 0,
                    stars(saved.session),
                  ),
                }
              : saved.best,
          );
          setBestTimes(recordTime(saved.bestTimes, saved.session));
          setSound(saved.sound);
        } else dispatch({ type: 'start', level: 0, seed: seedNow() });
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
      const data: Save = { version: 4, session: game, best, bestTimes, sound };
      localStorage.setItem(SAVE_KEY, JSON.stringify(data));
    } catch {
      queueMicrotask(() => setStorageUnavailable(true));
    }
  }, [game, best, bestTimes, sound, ready]);
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
    setVanishing(null);
    dispatch({
      type: 'start',
      level: levelIndex,
      seed: replay ? game.seed : seedNow(),
    });
    clearSelection();
    setPanel(null);
    setVictoryDismissed(false);
    setMessage('Associez deux tuiles identiques et libres.');
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
          setBestTimes((current) => recordTime(current, finished));
        }
        if (remaining === 2)
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
        : panel === 'pause'
          ? 'Le jardin vous attend'
          : panel === 'install'
            ? 'Installer Jardin de Jade'
            : 'Recommencer ce jardin ?';
  return (
    <main className="garden-app">
      <header className="topbar">
        <button
          className="brand"
          onClick={() => setPanel('levels')}
          aria-label="Jardin de Jade, choisir un jardin"
        >
          <span className="brand-mark">
            <Leaf />
          </span>
          <span>
            Jardin de Jade<small>MAHJONG SOLITAIRE</small>
          </span>
        </button>
        <div className="header-actions">
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
          >
            <CircleHelp />
            <span>Comment jouer</span>
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
          <button className="level-tag" onClick={() => setPanel('levels')}>
            JARDIN {String(game.level + 1).padStart(2, '0')}{' '}
            <span>/ {LEVELS.length}</span>
            <ChevronRight size={14} />
          </button>
          <h1>{level.name}</h1>
          <p>
            {level.subtitle} <span className="heading-dot">·</span>{' '}
            {level.difficulty}
          </p>
          <p className="best-time">
            <Trophy size={14} />
            {bestTimes[game.level] !== undefined
              ? `Meilleur temps : ${formatTime(bestTimes[game.level])}`
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
            <b>{formatTime(game.seconds)}</b>
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
                  onClick={() => setPanel('levels')}
                >
                  Voir la promenade <ChevronRight size={18} />
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
          <button onClick={undo} disabled={!game.history.length || !!vanishing}>
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
        <span className="ornament">—</span> Prenez votre temps. Le jardin n’est
        pas pressé. <span className="ornament">—</span>
      </footer>
      <Dialog
        open={panel !== null}
        onOpenChange={(open) => {
          if (!open) setPanel(null);
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
                : panel === 'pause'
                  ? 'Le temps est suspendu. Revenez quand vous le souhaitez.'
                  : panel === 'install'
                    ? 'Gardez le jeu parmi vos applications et retrouvez votre progression sur cet appareil.'
                    : 'La partie en cours sera remplacée. Vos jardins déjà terminés restent enregistrés.'}
          </DialogDescription>
          {panel === 'levels' && (
            <div className="level-path">
              {CAMPAIGN_STAGES.map(({ rank, rows }) => (
                <section className="level-stage" key={rank}>
                  <div className="stage-marker">
                    <span>ÉTAPE {rank}</span>
                    <i aria-hidden="true" />
                  </div>
                  {rows.map((row, rowIndex) => (
                    <div className="level-row" key={`${rank}-${rowIndex}`}>
                      {row.map(({ level: l, index: i }) => (
                        <button
                          key={l.name}
                          className={`level-card ${i === game.level ? 'current' : ''} ${!isLevelUnlocked(i, best) ? 'locked' : ''}`}
                          disabled={!isLevelUnlocked(i, best)}
                          onClick={() =>
                            i === game.level && !won ? setPanel(null) : start(i)
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
                            {l.difficulty} · {layout(i).length} tuiles
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
                onClick={() => start(game.level, true)}
              >
                <RotateCcw size={18} /> Rejouer la même disposition
              </button>
              <button
                className="outline-button"
                onClick={() => start(game.level)}
              >
                Nouvelle distribution
              </button>
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
            JARDIN {String(game.level + 1).padStart(2, '0')} TERMINÉ
          </span>
          <DialogTitle className="modal-title">
            Un peu plus de sérénité.
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
          <p className="victory-record">
            <Trophy size={18} />
            Meilleur temps : {formatTime(bestTimes[game.level] ?? game.seconds)}
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
              newlyUnlocked.length === 1
                ? start(newlyUnlocked[0].index)
                : (setVictoryDismissed(true), setPanel('levels'))
            }
          >
            {newlyUnlocked.length === 1
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
