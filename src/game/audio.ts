/**
 * Procedural Web Audio Engine for Temple Run 3D
 * Generates all sound effects, tribal drums, monster growls, and coin chimes in real-time.
 */

class SoundEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private masterGain: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;

  // Tribal drum loop state
  private drumTimer: number | null = null;
  private drumBeat: number = 0;
  private isDrumsPlaying: boolean = false;
  private currentSpeedMultiplier: number = 1.0;
  private coinStreakCount: number = 0;
  private lastCoinTime: number = 0;

  constructor() {
    // Read muted preference
    try {
      const savedMute = localStorage.getItem('temple_run_muted');
      this.isMuted = savedMute === 'true';
    } catch {
      this.isMuted = false;
    }
  }

  public init() {
    if (this.ctx) return;
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = this.isMuted ? 0 : 0.8;
      this.masterGain.connect(this.ctx.destination);

      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.value = 0.45;
      this.musicGain.connect(this.masterGain);

      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.value = 0.7;
      this.sfxGain.connect(this.masterGain);
    } catch {
      // AudioContext unavailable or blocked
    }
  }

  public resume() {
    this.init();
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    try {
      localStorage.setItem('temple_run_muted', String(this.isMuted));
    } catch {
      // Ignore
    }
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(this.isMuted ? 0 : 0.8, this.ctx.currentTime, 0.05);
    }
    return this.isMuted;
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  // === SFX METHODS ===

  public playCoin() {
    if (this.isMuted || !this.ctx || !this.sfxGain) return;
    this.resume();

    const now = performance.now();
    if (now - this.lastCoinTime < 800) {
      this.coinStreakCount = Math.min(this.coinStreakCount + 1, 8);
    } else {
      this.coinStreakCount = 0;
    }
    this.lastCoinTime = now;

    const baseFreqs = [523.25, 587.33, 659.25, 783.99, 880.0, 1046.5, 1174.66, 1318.5, 1567.98];
    const freq = baseFreqs[this.coinStreakCount % baseFreqs.length];

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(freq * 1.5, this.ctx.currentTime + 0.12);

    gain.gain.setValueAtTime(0.25, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.15);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.15);
  }

  public playJump() {
    if (this.isMuted || !this.ctx || !this.sfxGain) return;
    this.resume();

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(160, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(440, this.ctx.currentTime + 0.18);

    gain.gain.setValueAtTime(0.35, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.22);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.22);

    // Add noise breath
    this.playNoiseWhoosh(0.18, 600, 1600, 0.15);
  }

  public playSlide() {
    if (this.isMuted || !this.ctx || !this.sfxGain) return;
    this.resume();
    this.playNoiseWhoosh(0.35, 300, 100, 0.25);
  }

  public playTurn() {
    if (this.isMuted || !this.ctx || !this.sfxGain) return;
    this.resume();

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(320, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(180, this.ctx.currentTime + 0.15);

    gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.16);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.16);
  }

  public playStumble() {
    if (this.isMuted || !this.ctx || !this.sfxGain) return;
    this.resume();

    // Heavy low punch
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(130, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(40, this.ctx.currentTime + 0.25);

    gain.gain.setValueAtTime(0.5, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.25);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.25);

    // Stumble snap
    this.playNoiseWhoosh(0.12, 1200, 200, 0.3);
  }

  public playDemonRoar() {
    if (this.isMuted || !this.ctx || !this.sfxGain) return;
    this.resume();

    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc1.type = 'sawtooth';
    osc2.type = 'triangle';

    osc1.frequency.setValueAtTime(95, this.ctx.currentTime);
    osc1.frequency.linearRampToValueAtTime(130, this.ctx.currentTime + 0.2);
    osc1.frequency.exponentialRampToValueAtTime(60, this.ctx.currentTime + 0.55);

    osc2.frequency.setValueAtTime(98, this.ctx.currentTime);
    osc2.frequency.linearRampToValueAtTime(135, this.ctx.currentTime + 0.2);
    osc2.frequency.exponentialRampToValueAtTime(63, this.ctx.currentTime + 0.55);

    gain.gain.setValueAtTime(0.45, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.55);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(this.sfxGain);

    osc1.start();
    osc2.start();
    osc1.stop(this.ctx.currentTime + 0.55);
    osc2.stop(this.ctx.currentTime + 0.55);
  }

  public playPowerup() {
    if (this.isMuted || !this.ctx || !this.sfxGain) return;
    this.resume();

    const chords = [392.0, 493.88, 587.33, 783.99, 987.77];
    chords.forEach((note, index) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(note, this.ctx!.currentTime + index * 0.05);

      gain.gain.setValueAtTime(0.001, this.ctx!.currentTime + index * 0.05);
      gain.gain.linearRampToValueAtTime(0.2, this.ctx!.currentTime + index * 0.05 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx!.currentTime + index * 0.05 + 0.35);

      osc.connect(gain);
      gain.connect(this.sfxGain!);
      osc.start(this.ctx!.currentTime + index * 0.05);
      osc.stop(this.ctx!.currentTime + index * 0.05 + 0.35);
    });
  }

  public playGameOver() {
    if (this.isMuted || !this.ctx || !this.sfxGain) return;
    this.resume();

    // Deep death gong
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(80, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(28, this.ctx.currentTime + 1.2);

    gain.gain.setValueAtTime(0.65, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 1.2);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start();
    osc.stop(this.ctx.currentTime + 1.2);
  }

  private playNoiseWhoosh(duration: number, startFreq: number, endFreq: number, volume: number) {
    if (!this.ctx || !this.sfxGain) return;
    try {
      const bufferSize = Math.floor(this.ctx.sampleRate * duration);
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }

      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(startFreq, this.ctx.currentTime);
      filter.frequency.exponentialRampToValueAtTime(Math.max(50, endFreq), this.ctx.currentTime + duration);
      filter.Q.value = 1.2;

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(volume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.sfxGain);

      noise.start();
      noise.stop(this.ctx.currentTime + duration);
    } catch {
      // Ignore
    }
  }

  // === PROCEDURAL TRIBAL DRUMS ===

  public startMusic() {
    this.init();
    if (this.isDrumsPlaying) return;
    this.isDrumsPlaying = true;
    this.drumBeat = 0;
    this.scheduleDrumTick();
  }

  public stopMusic() {
    this.isDrumsPlaying = false;
    if (this.drumTimer !== null) {
      window.clearTimeout(this.drumTimer);
      this.drumTimer = null;
    }
  }

  public updateMusicSpeed(speedMultiplier: number) {
    this.currentSpeedMultiplier = Math.max(0.8, Math.min(2.0, speedMultiplier));
  }

  private scheduleDrumTick() {
    if (!this.isDrumsPlaying) return;

    this.playDrumPattern(this.drumBeat % 16);
    this.drumBeat++;

    // Base interval ~130ms, speeds up with player progression
    const interval = Math.max(70, Math.floor(130 / this.currentSpeedMultiplier));
    this.drumTimer = window.setTimeout(() => {
      this.scheduleDrumTick();
    }, interval);
  }

  private playDrumPattern(step: number) {
    if (this.isMuted || !this.ctx || !this.musicGain) return;

    // Tribal drum patterns:
    // Heavy Bass Taiko on beats 0, 4, 8, 12, with offbeat syncopation on 6, 14
    if (step === 0 || step === 8) {
      this.triggerDrumBass(75, 0.45);
    } else if (step === 4 || step === 12) {
      this.triggerDrumSnare(120, 0.35);
    } else if (step === 6 || step === 14) {
      this.triggerDrumTom(100, 0.28);
    }

    // High tribal shaker / woodblock on odd 16th notes
    if (step % 2 === 1) {
      this.triggerShaker(0.12);
    }
  }

  private triggerDrumBass(freq: number, volume: number) {
    if (!this.ctx || !this.musicGain) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq * 1.5, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(35, this.ctx.currentTime + 0.14);

    gain.gain.setValueAtTime(volume, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.16);

    osc.connect(gain);
    gain.connect(this.musicGain);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.16);
  }

  private triggerDrumSnare(freq: number, volume: number) {
    if (!this.ctx || !this.musicGain) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(55, this.ctx.currentTime + 0.09);

    gain.gain.setValueAtTime(volume, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.11);

    osc.connect(gain);
    gain.connect(this.musicGain);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.11);
  }

  private triggerDrumTom(freq: number, volume: number) {
    if (!this.ctx || !this.musicGain) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(50, this.ctx.currentTime + 0.1);

    gain.gain.setValueAtTime(volume, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.12);

    osc.connect(gain);
    gain.connect(this.musicGain);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.12);
  }

  private triggerShaker(volume: number) {
    if (!this.ctx || !this.musicGain) return;
    try {
      const bufferSize = Math.floor(this.ctx.sampleRate * 0.04);
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
      }
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.value = 3500;

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(volume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.04);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.musicGain);
      noise.start();
    } catch {
      // Ignore
    }
  }
}

export const sound = new SoundEngine();
