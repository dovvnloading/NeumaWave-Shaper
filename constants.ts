
export const CANVAS_WIDTH = 800;
export const CANVAS_HEIGHT = 400;
export const WAVE_SAMPLES = 512; // Number of samples in the wavetable
export const FFT_SIZE = 256; // Number of harmonics - Increased for sharper wave shapes

// Neumorphic Colors
export const COLOR_BG = '#efeeee';
export const COLOR_SHADOW_LIGHT = '#ffffff';
export const COLOR_SHADOW_DARK = '#d1d9e6';
export const COLOR_ACCENT = '#3b82f6';
export const COLOR_TEXT = '#5c6b7f';

// Default Unison Settings
export const DEFAULT_UNISON = {
  voices: 1,
  detune: 25,
  spread: 50,
  blend: 100,
  mode: 'classic' as const
};

// FL Studio Style Keyboard Mapping
// Row 1 (Bottom): Z X C V B N M -> C4 ... B4
// Row 2 (Top): Q W E R T Y U I O P -> C5 ... E6
export const NOTES = [
  // Octave 4
  { note: 'C4', freq: 261.63, key: 'z', type: 'white' },
  { note: 'C#4', freq: 277.18, key: 's', type: 'black' },
  { note: 'D4', freq: 293.66, key: 'x', type: 'white' },
  { note: 'D#4', freq: 311.13, key: 'd', type: 'black' },
  { note: 'E4', freq: 329.63, key: 'c', type: 'white' },
  { note: 'F4', freq: 349.23, key: 'v', type: 'white' },
  { note: 'F#4', freq: 369.99, key: 'g', type: 'black' },
  { note: 'G4', freq: 392.00, key: 'b', type: 'white' },
  { note: 'G#4', freq: 415.30, key: 'h', type: 'black' },
  { note: 'A4', freq: 440.00, key: 'n', type: 'white' },
  { note: 'A#4', freq: 466.16, key: 'j', type: 'black' },
  { note: 'B4', freq: 493.88, key: 'm', type: 'white' },
  
  // Octave 5
  { note: 'C5', freq: 523.25, key: 'q', type: 'white' },
  { note: 'C#5', freq: 554.37, key: '2', type: 'black' },
  { note: 'D5', freq: 587.33, key: 'w', type: 'white' },
  { note: 'D#5', freq: 622.25, key: '3', type: 'black' },
  { note: 'E5', freq: 659.25, key: 'e', type: 'white' },
  { note: 'F5', freq: 698.46, key: 'r', type: 'white' },
  { note: 'F#5', freq: 739.99, key: '5', type: 'black' },
  { note: 'G5', freq: 783.99, key: 't', type: 'white' },
  { note: 'G#5', freq: 830.61, key: '6', type: 'black' },
  { note: 'A5', freq: 880.00, key: 'y', type: 'white' },
  { note: 'A#5', freq: 932.33, key: '7', type: 'black' },
  { note: 'B5', freq: 987.77, key: 'u', type: 'white' },

  // Octave 6 (Partial)
  { note: 'C6', freq: 1046.50, key: 'i', type: 'white' },
  { note: 'C#6', freq: 1108.73, key: '9', type: 'black' },
  { note: 'D6', freq: 1174.66, key: 'o', type: 'white' },
  { note: 'D#6', freq: 1244.51, key: '0', type: 'black' },
  { note: 'E6', freq: 1318.51, key: 'p', type: 'white' }
];

export const KEY_TO_NOTE: Record<string, typeof NOTES[0]> = {};
NOTES.forEach(n => KEY_TO_NOTE[n.key] = n);