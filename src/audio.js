/**
 * Sound effects engine powered by Web Audio API.
 * 100% self-contained synthesized audio without external audio files.
 */

class SoundController {
  constructor() {
    this.ctx = null;
    this.enabled = true;
    this.initFromStorage();
  }

  initFromStorage() {
    try {
      const saved = localStorage.getItem('2048_sound_enabled');
      if (saved !== null) {
        this.enabled = saved === 'true';
      }
    } catch {
      this.enabled = true;
    }
  }

  toggleSound() {
    this.enabled = !this.enabled;
    try {
      localStorage.setItem('2048_sound_enabled', this.enabled);
    } catch {
      // LocalStorage safety
    }
    return this.enabled;
  }

  ensureContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  playMove() {
    if (!this.enabled) return;
    this.ensureContext();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(140, now);
      osc.frequency.exponentialRampToValueAtTime(180, now + 0.04);

      gain.gain.setValueAtTime(0.04, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.05);
    } catch {
      // AudioContext playback safety
    }
  }

  playMerge(value = 4) {
    if (!this.enabled) return;
    this.ensureContext();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;

      // Map tile values to pentatonic frequencies
      const freqMap = {
        4: 261.63,   // C4
        8: 293.66,   // D4
        16: 329.63,  // E4
        32: 392.00,  // G4
        64: 440.00,  // A4
        128: 523.25, // C5
        256: 587.33, // D5
        512: 659.25, // E5
        1024: 783.99,// G5
        2048: 880.00 // A5
      };

      const baseFreq = freqMap[value] || 600;

      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc1.type = 'sine';
      osc2.type = 'triangle';

      osc1.frequency.setValueAtTime(baseFreq, now);
      osc2.frequency.setValueAtTime(baseFreq * 1.5, now); // Fifth harmonic

      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(this.ctx.destination);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 0.12);
      osc2.stop(now + 0.12);
    } catch {
      // Audio safety
    }
  }

  playUndo() {
    if (!this.enabled) return;
    this.ensureContext();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(320, now);
      osc.frequency.exponentialRampToValueAtTime(200, now + 0.08);

      gain.gain.setValueAtTime(0.06, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.08);
    } catch {
      // Audio safety
    }
  }

  playWin() {
    if (!this.enabled) return;
    this.ensureContext();
    if (!this.ctx) return;

    try {
      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6 fanfare
      const now = this.ctx.currentTime;

      notes.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        const startTime = now + idx * 0.1;
        const endTime = startTime + 0.25;

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, startTime);

        gain.gain.setValueAtTime(0.12, startTime);
        gain.gain.exponentialRampToValueAtTime(0.001, endTime);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(startTime);
        osc.stop(endTime);
      });
    } catch {
      // Audio safety
    }
  }

  playSirenAndJackpot(value = 8) {
    if (!this.enabled) return;
    this.ensureContext();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;

      // ==========================================
      // PART 1: THE SIREN (Wailing alert siren)
      // ==========================================
      const sirenOsc = this.ctx.createOscillator();
      const sirenOsc2 = this.ctx.createOscillator();
      const sirenGain = this.ctx.createGain();
      const sirenFilter = this.ctx.createBiquadFilter();

      sirenFilter.type = 'lowpass';
      sirenFilter.frequency.setValueAtTime(2400, now);

      sirenOsc.type = 'sawtooth';
      sirenOsc2.type = 'triangle';

      // Slight detune for a rich, urgent siren
      sirenOsc.detune.setValueAtTime(0, now);
      sirenOsc2.detune.setValueAtTime(14, now);

      // Pitch sweep cycles: Rapid up and down wailing siren
      // Cycle 1
      sirenOsc.frequency.setValueAtTime(550, now);
      sirenOsc.frequency.linearRampToValueAtTime(1250, now + 0.14);
      sirenOsc.frequency.linearRampToValueAtTime(550, now + 0.28);
      sirenOsc2.frequency.setValueAtTime(550, now);
      sirenOsc2.frequency.linearRampToValueAtTime(1250, now + 0.14);
      sirenOsc2.frequency.linearRampToValueAtTime(550, now + 0.28);

      // Cycle 2 (higher crest)
      sirenOsc.frequency.linearRampToValueAtTime(1450, now + 0.42);
      sirenOsc.frequency.linearRampToValueAtTime(600, now + 0.56);
      sirenOsc2.frequency.linearRampToValueAtTime(1450, now + 0.42);
      sirenOsc2.frequency.linearRampToValueAtTime(600, now + 0.56);

      // Volume envelope for siren
      sirenGain.gain.setValueAtTime(0.01, now);
      sirenGain.gain.linearRampToValueAtTime(0.12, now + 0.05);
      sirenGain.gain.setValueAtTime(0.12, now + 0.45);
      sirenGain.gain.exponentialRampToValueAtTime(0.001, now + 0.60);

      sirenOsc.connect(sirenFilter);
      sirenOsc2.connect(sirenFilter);
      sirenFilter.connect(sirenGain);
      sirenGain.connect(this.ctx.destination);

      sirenOsc.start(now);
      sirenOsc2.start(now);
      sirenOsc.stop(now + 0.60);
      sirenOsc2.stop(now + 0.60);

      // ==========================================
      // PART 2: CASINO JACKPOT CHIMES & COIN PINGS
      // ==========================================
      const jackpotStart = now + 0.28;
      const jackpotChimes = [
        523.25, // C5
        659.25, // E5
        783.99, // G5
        1046.50,// C6
        1318.51,// E6
        1567.98,// G6
        2093.00 // C7
      ];

      jackpotChimes.forEach((freq, idx) => {
        const chimeOsc = this.ctx.createOscillator();
        const chimeGain = this.ctx.createGain();

        const t = jackpotStart + idx * 0.07;
        const duration = 0.22;

        chimeOsc.type = 'sine';
        chimeOsc.frequency.setValueAtTime(freq, t);

        chimeGain.gain.setValueAtTime(0.14, t);
        chimeGain.gain.exponentialRampToValueAtTime(0.001, t + duration);

        chimeOsc.connect(chimeGain);
        chimeGain.connect(this.ctx.destination);

        chimeOsc.start(t);
        chimeOsc.stop(t + duration);
      });

      // Rapid metallic coin bursts (slot machine payout cascade)
      const coinCount = 8;
      const coinStart = jackpotStart + 0.15;
      const coinFreqs = [2400, 3100, 2800, 3500, 2600, 3300, 3800, 4200];

      for (let i = 0; i < coinCount; i++) {
        const coinOsc = this.ctx.createOscillator();
        const coinGain = this.ctx.createGain();

        const t = coinStart + i * 0.055;
        const f = coinFreqs[i % coinFreqs.length];

        coinOsc.type = 'triangle';
        coinOsc.frequency.setValueAtTime(f, t);

        coinGain.gain.setValueAtTime(0.06, t);
        coinGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.04);

        coinOsc.connect(coinGain);
        coinGain.connect(this.ctx.destination);

        coinOsc.start(t);
        coinOsc.stop(t + 0.04);
      }
    } catch {
      // Audio safety
    }
  }

  playGameOver() {
    if (!this.enabled) return;
    this.ensureContext();
    if (!this.ctx) return;

    try {
      const notes = [392.00, 370.0, 329.63, 261.63]; // Descending minor
      const now = this.ctx.currentTime;

      notes.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        const startTime = now + idx * 0.12;
        const endTime = startTime + 0.2;

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, startTime);

        gain.gain.setValueAtTime(0.07, startTime);
        gain.gain.exponentialRampToValueAtTime(0.001, endTime);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(startTime);
        osc.stop(endTime);
      });
    } catch {
      // Audio safety
    }
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { SoundController };
}
