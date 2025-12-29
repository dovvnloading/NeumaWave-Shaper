
export interface WaveformData {
  samples: number[]; // Normalized -1 to 1
}

export interface AudioState {
  isPlaying: boolean;
  frequency: number;
  gain: number;
  detune: number;
}

export interface Point {
  x: number;
  y: number;
}

export type UnisonMode = 'classic' | 'uniform' | 'fifth' | 'octave';

export interface UnisonConfig {
  voices: number; // 1-9
  detune: number; // 0-100
  spread: number; // 0-100
  blend: number; // 0-100
  mode: UnisonMode;
}

export interface OscillatorConfig {
  id: number; // 0, 1, 2
  label: string; // 'A', 'B', 'C'
  volume: number; // 0 to 100
  detune: number; // -100 to 100 cents
  octave: number; // -2 to +2
  samples: number[]; // The waveform data
  enabled: boolean;
  unison: UnisonConfig;
}

export interface EnvelopeSettings {
  attack: number;
  release: number;
  masterVolume: number;
}

export type FilterType = 'lowpass' | 'highpass' | 'bandpass';

export interface FilterSettings {
  cutoff: number; // 0 to 1 (normalized, log scaled in engine)
  resonance: number; // 0 to 100
  type: FilterType;
}

export interface FXSettings {
  delayTime: number;
  delayFeedback: number;
  delayMix: number;
  reverbSize: number;
  reverbMix: number;
  isDelaySynced: boolean;
  delaySyncIndex: number;
}

export interface Preset {
  id: string;
  name: string;
  oscillators: OscillatorConfig[];
  envelope: EnvelopeSettings;
  filter: FilterSettings;
  fx: FXSettings;
}
