import { WAVE_SAMPLES } from '../constants';

// Generators
export const generateSine = () => Array.from({ length: WAVE_SAMPLES }, (_, i) => Math.sin((i / WAVE_SAMPLES) * Math.PI * 2));

export const generateTriangle = () => Array.from({ length: WAVE_SAMPLES }, (_, i) => {
    const t = i / WAVE_SAMPLES;
    return 1 - 4 * Math.abs(Math.round(t) - t);
});

export const generateSaw = () => Array.from({ length: WAVE_SAMPLES }, (_, i) => 1 - 2 * (i / WAVE_SAMPLES));

export const generateSquare = () => Array.from({ length: WAVE_SAMPLES }, (_, i) => i < WAVE_SAMPLES / 2 ? 0.8 : -0.8);

export const generateNoise = () => Array.from({ length: WAVE_SAMPLES }, () => (Math.random() * 2) - 1);

export const generatePulse = () => Array.from({ length: WAVE_SAMPLES }, (_, i) => i < WAVE_SAMPLES / 4 ? 1.0 : -1.0);

// Modifiers
export const normalize = (data: number[]) => {
    const max = Math.max(...data.map(Math.abs));
    if (max < 0.0001) return data;
    return data.map(x => x / max);
};

export const invert = (data: number[]) => data.map(x => -x);

export const reverse = (data: number[]) => [...data].reverse();

export const rectify = (data: number[]) => data.map(x => Math.abs(x));

export const smooth = (data: number[]) => {
    // 5-point moving average
    return data.map((val, i, arr) => {
        let sum = 0;
        let count = 0;
        for(let offset = -2; offset <= 2; offset++) {
            const idx = i + offset;
            if(idx >= 0 && idx < arr.length) {
                sum += arr[idx];
                count++;
            }
        }
        return sum / count;
    });
};

export const drive = (data: number[]) => data.map(x => Math.tanh(x * 2.5));

export const fold = (data: number[]) => data.map(x => Math.sin(x * 4));

export const quantize = (data: number[]) => {
    const levels = 6;
    return data.map(x => Math.round(x * levels) / levels);
};
