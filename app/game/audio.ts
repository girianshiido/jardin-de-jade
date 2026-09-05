export type SoundCue =
  | 'select'
  | 'match'
  | 'blocked'
  | 'hint'
  | 'undo'
  | 'shuffle'
  | 'win'
  | 'start';
type Note = {
  frequency: number;
  at: number;
  duration: number;
  volume: number;
  bell?: boolean;
};

// Short, quiet cues in a shared pentatonic palette; all sounds are made locally.
const CUES: Record<SoundCue, Note[]> = {
  select: [{ frequency: 1174.66, at: 0, duration: 0.09, volume: 0.13 }],
  match: [
    { frequency: 587.33, at: 0, duration: 0.32, volume: 0.12, bell: true },
    { frequency: 880, at: 0.085, duration: 0.42, volume: 0.1, bell: true },
  ],
  blocked: [
    { frequency: 220, at: 0, duration: 0.085, volume: 0.08 },
    { frequency: 196, at: 0.055, duration: 0.1, volume: 0.045 },
  ],
  hint: [
    { frequency: 880, at: 0, duration: 0.25, volume: 0.075, bell: true },
    { frequency: 1174.66, at: 0.12, duration: 0.4, volume: 0.065, bell: true },
  ],
  undo: [
    { frequency: 739.99, at: 0, duration: 0.12, volume: 0.085 },
    { frequency: 587.33, at: 0.08, duration: 0.16, volume: 0.065 },
  ],
  shuffle: [0, 0.055, 0.12, 0.19, 0.28].map((at, i) => ({
    frequency: [1046.5, 783.99, 1174.66, 880, 987.77][i],
    at,
    duration: 0.07,
    volume: 0.06,
  })),
  start: [
    { frequency: 587.33, at: 0, duration: 0.25, volume: 0.085, bell: true },
    { frequency: 739.99, at: 0.1, duration: 0.25, volume: 0.06, bell: true },
    { frequency: 880, at: 0.2, duration: 0.38, volume: 0.07, bell: true },
  ],
  win: [
    { frequency: 587.33, at: 0, duration: 0.5, volume: 0.11, bell: true },
    { frequency: 739.99, at: 0.13, duration: 0.5, volume: 0.09, bell: true },
    { frequency: 880, at: 0.26, duration: 0.55, volume: 0.09, bell: true },
    { frequency: 1174.66, at: 0.43, duration: 0.85, volume: 0.08, bell: true },
  ],
};

export class JadeAudio {
  private context: AudioContext | null = null;
  private output: GainNode | null = null;
  private voices = new Set<OscillatorNode>();
  private enabled = true;
  private revision = 0;

  setEnabled(enabled: boolean) {
    this.enabled = enabled;
    if (!enabled) this.stop();
  }

  stop() {
    // Invalidate pending resume callbacks as well as notes already scheduled.
    this.revision++;
    for (const voice of this.voices) {
      try {
        voice.stop();
      } catch {
        /* Already ended. */
      }
    }
    this.voices.clear();
  }

  dispose() {
    this.enabled = false;
    this.stop();
    const context = this.context;
    this.context = null;
    this.output = null;
    if (context && context.state !== 'closed')
      void context.close().catch(() => {});
  }

  play(cue: SoundCue) {
    if (!this.enabled || typeof window === 'undefined') return;
    try {
      if (!this.context || this.context.state === 'closed') {
        const Context =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext })
            .webkitAudioContext;
        if (!Context) return;
        this.context = new Context();
        this.output = this.context.createGain();
        this.output.gain.value = 0.32;
        this.output.connect(this.context.destination);
      }
      const context = this.context;
      const revision = this.revision;
      const schedule = () => {
        if (
          !this.enabled ||
          revision !== this.revision ||
          context !== this.context ||
          context.state !== 'running'
        )
          return;
        // Avoid a build-up of sound during very fast tapping.
        if (this.voices.size > 40) this.stop();
        const at = context.currentTime + 0.008;
        for (const note of CUES[cue]) {
          this.note(
            context,
            note.frequency,
            at + note.at,
            note.duration,
            note.volume,
          );
          // Very quiet, quickly decaying overtones suggest porcelain and a bell.
          this.note(
            context,
            note.frequency * (note.bell ? 2.76 : 1.63),
            at + note.at,
            note.duration * 0.32,
            note.volume * 0.16,
          );
        }
      };
      if (context.state === 'running') schedule();
      else
        void context
          .resume()
          .then(schedule)
          .catch(() => {});
    } catch {
      /* Browsers without audio support can still play the game. */
    }
  }

  private note(
    context: AudioContext,
    frequency: number,
    at: number,
    duration: number,
    volume: number,
  ) {
    if (!this.output) return;
    const voice = context.createOscillator();
    const envelope = context.createGain();
    voice.type = 'sine';
    voice.frequency.setValueAtTime(frequency, at);
    envelope.gain.setValueAtTime(0, at);
    envelope.gain.linearRampToValueAtTime(volume, at + 0.004);
    envelope.gain.exponentialRampToValueAtTime(0.0001, at + duration);
    envelope.gain.linearRampToValueAtTime(0, at + duration + 0.015);
    voice.connect(envelope);
    envelope.connect(this.output);
    this.voices.add(voice);
    voice.onended = () => {
      voice.disconnect();
      envelope.disconnect();
      this.voices.delete(voice);
    };
    voice.start(at);
    voice.stop(at + duration + 0.025);
  }
}
