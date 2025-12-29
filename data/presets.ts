
import { Preset, FilterSettings, UnisonConfig } from '../types';
import { WAVE_SAMPLES, DEFAULT_UNISON } from '../constants';

// --- MATH UTILS & GENERATORS ---

const PI2 = Math.PI * 2;

// Basic Shapes
const createSine = () => new Array(WAVE_SAMPLES).fill(0).map((_, i) => Math.sin((i / WAVE_SAMPLES) * PI2));
const createSaw = () => new Array(WAVE_SAMPLES).fill(0).map((_, i) => 1 - 2 * (i / WAVE_SAMPLES));
const createSquare = () => new Array(WAVE_SAMPLES).fill(0).map((_, i) => i < WAVE_SAMPLES / 2 ? 0.8 : -0.8);
const createTriangle = () => new Array(WAVE_SAMPLES).fill(0).map((_, i) => {
  const t = i / WAVE_SAMPLES;
  return 1 - 4 * Math.abs(Math.round(t) - t);
});
const createPulse = (width: number) => new Array(WAVE_SAMPLES).fill(0).map((_, i) => (i < WAVE_SAMPLES * width) ? 0.9 : -0.9);
const createNoise = () => new Array(WAVE_SAMPLES).fill(0).map(() => (Math.random() * 2) - 1);

// Additive Synthesis Helper (Organ-like, Bell-like)
const createAdditive = (harmonics: number[]) => new Array(WAVE_SAMPLES).fill(0).map((_, i) => {
    let val = 0;
    const t = (i / WAVE_SAMPLES) * PI2;
    harmonics.forEach((amp, hIndex) => {
        val += amp * Math.sin(t * (hIndex + 1));
    });
    // Normalize roughly
    return val / Math.max(1, harmonics.reduce((a, b) => a + b, 0));
});

// FM Synthesis Helper (Static Snapshot for texture)
const createFM = (carrierMult: number, modMult: number, index: number) => new Array(WAVE_SAMPLES).fill(0).map((_, i) => {
    const t = (i / WAVE_SAMPLES) * PI2;
    return Math.sin(carrierMult * t + index * Math.sin(modMult * t));
});

// Pseudo-Sync (Static Windowing)
const createSync = (freq: number) => new Array(WAVE_SAMPLES).fill(0).map((_, i) => {
    const t = (i / WAVE_SAMPLES) * PI2 * freq;
    // Windowing to prevent clicking at edges for static wave
    const window = 1 - Math.cos((i / WAVE_SAMPLES) * PI2); 
    return Math.sin(t % PI2) * window; 
});

// --- HELPERS ---

const withUnison = (osc: any, overrides?: Partial<UnisonConfig>) => ({
    ...osc,
    unison: { ...DEFAULT_UNISON, ...overrides }
});

const FILTER_OPEN: FilterSettings = { cutoff: 1.0, resonance: 0, type: 'lowpass' };

// --- THE LIBRARY ---

export const DEFAULT_PRESETS: Preset[] = [
  // 1. INIT
  {
    id: 'init-sine',
    name: 'INIT SINE',
    oscillators: [
      withUnison({ id: 0, label: 'OSC A', volume: 80, detune: 0, octave: 0, samples: createSine(), enabled: true }),
      withUnison({ id: 1, label: 'OSC B', volume: 0, detune: 0, octave: 0, samples: createSine(), enabled: true }),
      withUnison({ id: 2, label: 'OSC C', volume: 0, detune: 0, octave: 0, samples: createSine(), enabled: true }),
    ],
    envelope: { attack: 0.05, release: 0.1, masterVolume: 80 },
    filter: FILTER_OPEN,
    fx: { delayTime: 0.3, delayFeedback: 30, delayMix: 0, reverbSize: 1.5, reverbMix: 0, isDelaySynced: false, delaySyncIndex: 4 }
  },

  // 2. PADS
  {
    id: 'glass-pad',
    name: 'GLASS PAD',
    oscillators: [
      withUnison({ id: 0, label: 'OSC A', volume: 70, detune: 5, octave: 0, samples: createTriangle(), enabled: true }, { voices: 3, detune: 15, spread: 50 }),
      withUnison({ id: 1, label: 'OSC B', volume: 70, detune: -5, octave: 0, samples: createSine(), enabled: true }, { voices: 3, detune: 15, spread: 50 }),
      withUnison({ id: 2, label: 'OSC C', volume: 50, detune: 0, octave: 1, samples: createAdditive([1, 0, 0.5]), enabled: true }),
    ],
    envelope: { attack: 0.6, release: 1.5, masterVolume: 75 },
    filter: { cutoff: 0.7, resonance: 10, type: 'lowpass' },
    fx: { delayTime: 0.5, delayFeedback: 40, delayMix: 25, reverbSize: 4.0, reverbMix: 50, isDelaySynced: false, delaySyncIndex: 4 }
  },
  {
    id: 'saw-strings',
    name: 'ANALOG STRINGS',
    oscillators: [
      withUnison({ id: 0, label: 'OSC A', volume: 60, detune: 0, octave: 0, samples: createSaw(), enabled: true }, { voices: 5, detune: 25, spread: 70 }),
      withUnison({ id: 1, label: 'OSC B', volume: 60, detune: 0, octave: 0, samples: createSaw(), enabled: true }, { voices: 5, detune: 40, spread: 70 }),
      withUnison({ id: 2, label: 'OSC C', volume: 40, detune: 0, octave: -1, samples: createSaw(), enabled: true }),
    ],
    envelope: { attack: 0.4, release: 0.8, masterVolume: 70 },
    filter: { cutoff: 0.6, resonance: 0, type: 'lowpass' },
    fx: { delayTime: 0.25, delayFeedback: 20, delayMix: 10, reverbSize: 2.5, reverbMix: 30, isDelaySynced: true, delaySyncIndex: 4 }
  },

  // 3. LEADS
  {
    id: 'supersaw-lead',
    name: 'SUPERSAW LEAD',
    oscillators: [
      withUnison({ id: 0, label: 'OSC A', volume: 80, detune: 0, octave: 0, samples: createSaw(), enabled: true }, { voices: 7, detune: 50, spread: 100, mode: 'classic' }),
      withUnison({ id: 1, label: 'OSC B', volume: 80, detune: 0, octave: 0, samples: createSaw(), enabled: true }, { voices: 7, detune: 30, spread: 80, mode: 'classic' }),
      withUnison({ id: 2, label: 'OSC C', volume: 40, detune: 0, octave: 1, samples: createSquare(), enabled: true }),
    ],
    envelope: { attack: 0.02, release: 0.4, masterVolume: 65 },
    filter: FILTER_OPEN,
    fx: { delayTime: 0.35, delayFeedback: 45, delayMix: 30, reverbSize: 2.0, reverbMix: 25, isDelaySynced: true, delaySyncIndex: 5 }
  },
  {
    id: 'square-pluck',
    name: 'SQUARE PLUCK',
    oscillators: [
      withUnison({ id: 0, label: 'OSC A', volume: 90, detune: 0, octave: 0, samples: createSquare(), enabled: true }),
      withUnison({ id: 1, label: 'OSC B', volume: 70, detune: 5, octave: 0, samples: createPulse(0.25), enabled: true }),
      withUnison({ id: 2, label: 'OSC C', volume: 0, detune: 0, octave: -1, samples: createSine(), enabled: true }),
    ],
    envelope: { attack: 0.01, release: 0.3, masterVolume: 80 },
    filter: { cutoff: 0.8, resonance: 0, type: 'lowpass' },
    fx: { delayTime: 0.375, delayFeedback: 40, delayMix: 35, reverbSize: 1.0, reverbMix: 15, isDelaySynced: true, delaySyncIndex: 5 }
  },
  {
    id: 'chiptune',
    name: 'RETRO 8-BIT',
    oscillators: [
      withUnison({ id: 0, label: 'OSC A', volume: 85, detune: 0, octave: 0, samples: createPulse(0.5), enabled: true }),
      withUnison({ id: 1, label: 'OSC B', volume: 85, detune: 5, octave: 1, samples: createPulse(0.25), enabled: true }),
      withUnison({ id: 2, label: 'OSC C', volume: 40, detune: -5, octave: -1, samples: createPulse(0.125), enabled: true }),
    ],
    envelope: { attack: 0.01, release: 0.1, masterVolume: 75 },
    filter: FILTER_OPEN,
    fx: { delayTime: 0.1, delayFeedback: 0, delayMix: 0, reverbSize: 0.1, reverbMix: 0, isDelaySynced: false, delaySyncIndex: 4 }
  },

  // 4. BASS
  {
    id: 'deep-bass',
    name: 'DEEP HOUSE BASS',
    oscillators: [
      withUnison({ id: 0, label: 'OSC A', volume: 100, detune: 0, octave: -2, samples: createSine(), enabled: true }),
      withUnison({ id: 1, label: 'OSC B', volume: 60, detune: 0, octave: -1, samples: createTriangle(), enabled: true }),
      withUnison({ id: 2, label: 'OSC C', volume: 40, detune: 0, octave: -1, samples: createFM(1, 2, 1), enabled: true }), // Texture
    ],
    envelope: { attack: 0.01, release: 0.3, masterVolume: 90 },
    filter: { cutoff: 0.6, resonance: 0, type: 'lowpass' },
    fx: { delayTime: 0, delayFeedback: 0, delayMix: 0, reverbSize: 0.5, reverbMix: 5, isDelaySynced: false, delaySyncIndex: 4 }
  },
  {
    id: 'res-bass',
    name: 'RESONANT BASS',
    oscillators: [
      withUnison({ id: 0, label: 'OSC A', volume: 90, detune: 0, octave: -1, samples: createSaw(), enabled: true }),
      withUnison({ id: 1, label: 'OSC B', volume: 60, detune: 0, octave: -1, samples: createSquare(), enabled: true }),
      withUnison({ id: 2, label: 'OSC C', volume: 50, detune: 0, octave: -2, samples: createSine(), enabled: true }),
    ],
    envelope: { attack: 0.01, release: 0.2, masterVolume: 80 },
    filter: { cutoff: 0.3, resonance: 60, type: 'lowpass' },
    fx: { delayTime: 0, delayFeedback: 0, delayMix: 0, reverbSize: 0.1, reverbMix: 0, isDelaySynced: false, delaySyncIndex: 4 }
  },

  // 5. KEYS & FX
  {
    id: 'e-piano',
    name: 'DREAM KEYS',
    oscillators: [
      withUnison({ id: 0, label: 'OSC A', volume: 80, detune: 0, octave: 0, samples: createFM(1, 1, 0.5), enabled: true }),
      withUnison({ id: 1, label: 'OSC B', volume: 60, detune: 5, octave: 0, samples: createSine(), enabled: true }, { voices: 3, detune: 10 }),
      withUnison({ id: 2, label: 'OSC C', volume: 0, detune: 0, octave: 0, samples: createSine(), enabled: true }),
    ],
    envelope: { attack: 0.05, release: 0.8, masterVolume: 75 },
    filter: { cutoff: 0.8, resonance: 0, type: 'lowpass' },
    fx: { delayTime: 0.4, delayFeedback: 40, delayMix: 30, reverbSize: 2.5, reverbMix: 40, isDelaySynced: true, delaySyncIndex: 5 }
  },
  {
    id: 'organ',
    name: 'DRAWBAR ORGAN',
    oscillators: [
      withUnison({ id: 0, label: 'OSC A', volume: 80, detune: 2, octave: 0, samples: createAdditive([1, 0, 0.5, 0, 0.2]), enabled: true }),
      withUnison({ id: 1, label: 'OSC B', volume: 80, detune: -2, octave: 1, samples: createAdditive([1, 0.5, 0, 0.2]), enabled: true }),
      withUnison({ id: 2, label: 'OSC C', volume: 60, detune: 0, octave: -1, samples: createSine(), enabled: true }),
    ],
    envelope: { attack: 0.02, release: 0.2, masterVolume: 70 },
    filter: FILTER_OPEN,
    fx: { delayTime: 0.1, delayFeedback: 20, delayMix: 15, reverbSize: 1.5, reverbMix: 20, isDelaySynced: false, delaySyncIndex: 4 }
  },
  {
    id: 'bell',
    name: 'FM BELL',
    oscillators: [
      withUnison({ id: 0, label: 'OSC A', volume: 90, detune: 0, octave: 1, samples: createFM(1, 1.414, 2), enabled: true }),
      withUnison({ id: 1, label: 'OSC B', volume: 70, detune: 0, octave: 1, samples: createSine(), enabled: true }),
      withUnison({ id: 2, label: 'OSC C', volume: 40, detune: 0, octave: 2, samples: createFM(1, 3.14, 1), enabled: true }),
    ],
    envelope: { attack: 0.01, release: 1.5, masterVolume: 75 },
    filter: FILTER_OPEN,
    fx: { delayTime: 0.35, delayFeedback: 30, delayMix: 20, reverbSize: 3.0, reverbMix: 40, isDelaySynced: true, delaySyncIndex: 4 }
  },
  {
    id: 'horror',
    name: 'DARK DRONE',
    oscillators: [
      withUnison({ id: 0, label: 'OSC A', volume: 80, detune: 0, octave: -1, samples: createSaw(), enabled: true }, { voices: 3, detune: 20, mode: 'fifth' }),
      withUnison({ id: 1, label: 'OSC B', volume: 60, detune: 0, octave: -2, samples: createAdditive([1, 0.5, 0.25, 0.1, 0.05]), enabled: true }),
      withUnison({ id: 2, label: 'OSC C', volume: 50, detune: 0, octave: -1, samples: createNoise(), enabled: true }),
    ],
    envelope: { attack: 2.0, release: 4.0, masterVolume: 80 },
    filter: { cutoff: 0.4, resonance: 20, type: 'lowpass' },
    fx: { delayTime: 0.6, delayFeedback: 60, delayMix: 40, reverbSize: 5.0, reverbMix: 60, isDelaySynced: false, delaySyncIndex: 4 }
  }
];
