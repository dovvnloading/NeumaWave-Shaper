
import { FFT_SIZE, WAVE_SAMPLES } from '../constants';
import { UnisonConfig, FilterType } from '../types';

interface Voice {
  // Array of arrays: Index is Oscillator ID (0-2), inner array is Unison Stack
  oscillators: OscillatorNode[][]; 
  // Panners for unison spread
  panners: StereoPannerNode[][];
  // Main volume gain for each Oscillator ID
  oscGains: GainNode[]; 
  envelopeGain: GainNode;
  frequency: number;
}

class AudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private softClipper: WaveShaperNode | null = null;
  private compressor: DynamicsCompressorNode | null = null;
  private analyser: AnalyserNode | null = null;
  
  // FX Nodes
  private fxInput: GainNode | null = null;
  
  // Filter Nodes
  private filterNode: BiquadFilterNode | null = null;
  private filterOutput: GainNode | null = null;

  private delayNode: DelayNode | null = null;
  private delayFeedback: GainNode | null = null;
  private delayDry: GainNode | null = null;
  private delayWet: GainNode | null = null;

  private reverbNode: ConvolverNode | null = null;
  private reverbDry: GainNode | null = null;
  private reverbWet: GainNode | null = null;

  // State
  private activeVoices: Map<string, Voice> = new Map();
  
  // Storage for the 3 separate waveforms (PeriodicWave objects)
  private customWaves: (PeriodicWave | null)[] = [null, null, null];
  
  // Current Parameter State
  private oscVolumes: number[] = [0.25, 0, 0]; 
  private oscDetunes: number[] = [0, 0, 0];
  private oscOctaves: number[] = [0, 0, 0];
  
  // Current Unison State (Per Osc)
  private oscUnison: (UnisonConfig | null)[] = [null, null, null];

  // Global Modifiers
  private pitchBendAmount: number = 0; // -1 to 1 range

  // Global & Envelope
  public attack: number = 0.1;
  public release: number = 0.4;
  public globalVolume: number = 0.5;

  // FFT Helpers
  private real: Float32Array;
  private imag: Float32Array;

  // Constants for Gain Staging
  private readonly HEADROOM_FACTOR = 0.3; 

  constructor() {
    this.real = new Float32Array(FFT_SIZE);
    this.imag = new Float32Array(FFT_SIZE);
  }

  public init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // --- MASTER CHAIN ---
      
      this.compressor = this.ctx.createDynamicsCompressor();
      this.compressor.threshold.value = -12; 
      this.compressor.knee.value = 30;
      this.compressor.ratio.value = 12; 
      this.compressor.attack.value = 0.003;
      this.compressor.release.value = 0.25;

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = this.globalVolume;

      this.softClipper = this.ctx.createWaveShaper();
      this.softClipper.curve = this.makeSoftClipCurve();
      this.softClipper.oversample = '4x'; 

      this.analyser = this.ctx.createAnalyser();
      this.analyser.fftSize = 2048;

      // --- FILTER SECTION ---
      // Placing filter before time-based effects (delay/reverb) ensures effects trails aren't cut abruptly
      this.filterNode = this.ctx.createBiquadFilter();
      this.filterNode.type = 'lowpass';
      this.filterNode.frequency.value = 20000;
      this.filterNode.Q.value = 0;

      // FX Bus Entry
      this.fxInput = this.ctx.createGain();
      this.fxInput.gain.value = 0.8; 
      
      this.filterOutput = this.ctx.createGain();

      // Connect FX Input -> Filter -> Filter Output
      this.fxInput.connect(this.filterNode);
      this.filterNode.connect(this.filterOutput);

      // --- DELAY SETUP ---
      this.delayNode = this.ctx.createDelay(10.0);
      this.delayFeedback = this.ctx.createGain();
      this.delayDry = this.ctx.createGain();
      this.delayWet = this.ctx.createGain();
      
      this.delayNode.delayTime.value = 0.3;
      this.delayFeedback.gain.value = 0.3;
      this.delayDry.gain.value = 1.0;
      this.delayWet.gain.value = 0.0;

      // Connect Filter Output to Delay chain
      this.filterOutput.connect(this.delayDry);
      this.filterOutput.connect(this.delayNode);
      
      this.delayNode.connect(this.delayFeedback);
      this.delayFeedback.connect(this.delayNode);
      this.delayNode.connect(this.delayWet);

      const delayOutput = this.ctx.createGain();
      this.delayDry.connect(delayOutput);
      this.delayWet.connect(delayOutput);

      // --- REVERB SETUP ---
      this.reverbNode = this.ctx.createConvolver();
      this.reverbDry = this.ctx.createGain();
      this.reverbWet = this.ctx.createGain();

      this.reverbDry.gain.value = 1.0;
      this.reverbWet.gain.value = 0.0;
      this.updateReverbImpulse(2.0); 

      delayOutput.connect(this.reverbDry);
      delayOutput.connect(this.reverbNode);
      this.reverbNode.connect(this.reverbWet);

      const reverbOutput = this.ctx.createGain();
      this.reverbDry.connect(reverbOutput);
      this.reverbWet.connect(reverbOutput);

      // --- FINAL CONNECTION ---
      reverbOutput.connect(this.softClipper);
      this.softClipper.connect(this.masterGain);
      this.masterGain.connect(this.compressor);
      this.compressor.connect(this.analyser);
      this.analyser.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  // --- FILTER CONTROLS ---
  
  public setFilterType(type: FilterType) {
    if (!this.filterNode) return;
    this.filterNode.type = type;
  }

  public setFilterCutoff(normalizedValue: number) {
    if (!this.ctx || !this.filterNode) return;
    // Logarithmic mapping for "musical" feel
    // Maps 0..1 to approx 20Hz..20000Hz
    const minFreq = 20;
    const maxFreq = 20000;
    // Use an exponential curve: F = A * B^x
    const frequency = minFreq * Math.pow(maxFreq / minFreq, normalizedValue);
    
    // Smooth transition to prevent zipper noise
    this.filterNode.frequency.setTargetAtTime(frequency, this.ctx.currentTime, 0.05);
  }

  public setFilterResonance(amount: number) {
    if (!this.ctx || !this.filterNode) return;
    // Q factor usually ranges 0 to 30ish for self oscillation
    const q = (amount / 100) * 20; 
    this.filterNode.Q.setTargetAtTime(q, this.ctx.currentTime, 0.05);
  }

  // --- FX CONTROLS ---

  public setDelayTime(seconds: number) {
    if (!this.ctx || !this.delayNode) return;
    // Prevent 0 delay time which can cause issues
    const safeTime = Math.max(0.001, seconds);
    this.delayNode.delayTime.setTargetAtTime(safeTime, this.ctx.currentTime, 0.05);
  }

  public setDelayFeedback(amount: number) {
    if (!this.ctx || !this.delayFeedback) return;
    this.delayFeedback.gain.setTargetAtTime(Math.min(amount, 0.95), this.ctx.currentTime, 0.05);
  }

  public setDelayMix(mix: number) {
     if (!this.ctx || !this.delayWet || !this.delayDry) return;
     this.delayWet.gain.setTargetAtTime(mix, this.ctx.currentTime, 0.05);
     this.delayDry.gain.setTargetAtTime(1 - mix, this.ctx.currentTime, 0.05);
  }

  public setReverbSize(duration: number) {
     if (!this.ctx) return;
     this.updateReverbImpulse(duration);
  }

  public setReverbMix(mix: number) {
     if (!this.ctx || !this.reverbWet || !this.reverbDry) return;
     this.reverbWet.gain.setTargetAtTime(mix, this.ctx.currentTime, 0.05);
     this.reverbDry.gain.setTargetAtTime(1 - mix, this.ctx.currentTime, 0.05);
  }

  private updateReverbImpulse(duration: number) {
    if (!this.ctx || !this.reverbNode) return;
    
    // Handle very small duration (essentially off) or valid duration
    // AudioContext.createBuffer requires length >= 1
    const safeDuration = Math.max(0.001, duration);
    const rate = this.ctx.sampleRate;
    const length = Math.floor(rate * safeDuration);
    
    if (length < 1) return;

    const impulse = this.ctx.createBuffer(2, length, rate);
    const left = impulse.getChannelData(0);
    const right = impulse.getChannelData(1);

    for (let i = 0; i < length; i++) {
        const n = i / length;
        const e = Math.pow(1 - n, 2);
        left[i] = (Math.random() * 2 - 1) * e;
        right[i] = (Math.random() * 2 - 1) * e;
    }
    this.reverbNode.buffer = impulse;
  }

  // --- CORE AUDIO ---

  private makeSoftClipCurve(): Float32Array {
    const n_samples = 65536;
    const curve = new Float32Array(n_samples);
    for (let i = 0; i < n_samples; i++) {
      const x = -1 + (i / (n_samples - 1)) * 2;
      curve[i] = Math.tanh(x * 1.5); 
    }
    return curve;
  }

  public getAnalyser() {
    return this.analyser;
  }

  private computePeriodicWave(samples: number[]) {
    if (!this.ctx) return null;
    this.real.fill(0);
    this.imag.fill(0);
    const N = samples.length;
    
    for (let k = 1; k < FFT_SIZE; k++) {
      let sumReal = 0;
      let sumImag = 0;
      for (let n = 0; n < N; n++) {
        const theta = (2 * Math.PI * k * n) / N;
        sumReal += samples[n] * Math.cos(theta);
        sumImag += samples[n] * Math.sin(theta);
      }
      this.real[k] = (sumReal / N) * 2; 
      this.imag[k] = (sumImag / N) * 2;
    }
    return this.ctx.createPeriodicWave(this.real, this.imag, { disableNormalization: false });
  }

  public updateWaveform(oscIndex: number, samples: number[]) {
    if (!this.ctx) this.init(); 
    if (!this.ctx) return;
    const wave = this.computePeriodicWave(samples);
    this.customWaves[oscIndex] = wave;
    
    // Update active voices
    this.activeVoices.forEach((voice) => {
      // Each oscIndex has an ARRAY of oscillators in the voice
      const unisonStack = voice.oscillators[oscIndex];
      if (unisonStack && wave) {
        unisonStack.forEach(osc => {
             try { osc.setPeriodicWave(wave); } catch(e){}
        });
      }
    });
  }

  public setOscVolume(index: number, val: number) {
    const scaledVal = val * this.HEADROOM_FACTOR;
    this.oscVolumes[index] = scaledVal;
    if (this.ctx) {
      const now = this.ctx.currentTime;
      this.activeVoices.forEach(voice => {
         if (voice.oscGains[index]) voice.oscGains[index].gain.setTargetAtTime(scaledVal, now, 0.05);
      });
    }
  }

  // Returns base detune in cents based on Octave, Fine, Bend
  private getBaseDetune(index: number): number {
    return this.oscDetunes[index] + (this.oscOctaves[index] * 1200) + (this.pitchBendAmount * 200);
  }

  public setOscUnison(index: number, config: UnisonConfig) {
      this.oscUnison[index] = config;
      // In a more complex engine, we might crossfade or re-allocate. 
      // For now, noteOn reads this. Real-time unison modification is complex without restarting notes,
      // but we can support live detune updates.
  }

  public setOscDetune(index: number, val: number) {
    this.oscDetunes[index] = val;
    this.updatePitch(index);
  }

  public setOscOctave(index: number, val: number) {
    this.oscOctaves[index] = val;
    this.updatePitch(index);
  }

  public setPitchBend(val: number) {
    this.pitchBendAmount = val;
    for(let i = 0; i < 3; i++) {
      this.updatePitch(i);
    }
  }

  // Update pitch for all active unison voices of an oscillator
  private updatePitch(index: number) {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const baseDetune = this.getBaseDetune(index);
    const uConfig = this.oscUnison[index];

    this.activeVoices.forEach(voice => {
        const stack = voice.oscillators[index];
        if (!stack) return;
        
        stack.forEach((osc, i) => {
             // Re-calculate the specific unison offset for this voice index
             const unisonOffset = uConfig ? this.getUnisonDetuneOffset(i, uConfig.voices, uConfig.detune, uConfig.mode) : 0;
             osc.detune.setTargetAtTime(baseDetune + unisonOffset, now, 0.05);
        });
    });
  }

  // --- UNISON LOGIC ---

  private getUnisonDetuneOffset(index: number, total: number, amount: number, mode: string): number {
      if (total <= 1) return 0;
      
      const maxCents = amount; // Map 0-100 amount to cents roughly. Maybe 100 = 100 cents (semitone) or 200.
                               // Let's scale: 100 = 1 semitone (100 cents) for subtlety, or 2 semitones.
      const range = maxCents * 2; // +/- range

      // Center index
      const center = (total - 1) / 2;
      const normalizedPos = (index - center) / center; // -1 to 1

      switch (mode) {
          case 'uniform':
              return normalizedPos * range;
          case 'fifth':
               // Special harmonic tuning: Mix of root and fifths
               if (index === center) return 0;
               if (index % 2 === 0) return 700 + (Math.random() * 10); // +7 semitones approx
               return -700 + (Math.random() * 10);
          case 'octave':
               if (index === center) return 0;
               return (index % 2 === 0 ? 1200 : -1200) + (normalizedPos * 10);
          case 'classic':
          default:
              // Exponential-ish spread usually puts more voices near center
              return (normalizedPos * normalizedPos * Math.sign(normalizedPos)) * range;
      }
  }

  private getUnisonPan(index: number, total: number, spreadAmount: number, mode: string): number {
      if (total <= 1) return 0;
      const spread = spreadAmount / 100;
      const center = (total - 1) / 2;
      
      // Standard alternating L/R spread often sounds best
      // 0=Center, 1=L, 2=R, 3=LL, 4=RR...
      // Or just linear spread
      const normalizedPos = (index - center) / center; // -1 to 1
      return normalizedPos * spread;
  }

  public noteOn(noteId: string, frequency: number) {
    this.init();
    if (!this.ctx || !this.fxInput) return;

    if (this.activeVoices.has(noteId)) {
      this.noteOff(noteId);
    }

    // Structure
    const voiceOscs: OscillatorNode[][] = [[], [], []];
    const voicePanners: StereoPannerNode[][] = [[], [], []];
    const oscGains: GainNode[] = [];
    const envelopeGain = this.ctx.createGain();

    // Envelope Setup
    envelopeGain.gain.setValueAtTime(0, this.ctx.currentTime);
    envelopeGain.gain.linearRampToValueAtTime(1.0, this.ctx.currentTime + this.attack);
    
    envelopeGain.connect(this.fxInput);

    // Build Oscillators
    for (let oscId = 0; oscId < 3; oscId++) {
        // Gain for this entire oscillator stack
        const mixGain = this.ctx.createGain();
        mixGain.gain.value = this.oscVolumes[oscId];
        mixGain.connect(envelopeGain);
        oscGains.push(mixGain);

        // Unison Config
        const uConfig = this.oscUnison[oscId];
        const count = uConfig ? uConfig.voices : 1;
        const blend = uConfig ? uConfig.blend / 100 : 1;
        
        // Gain compensation for unison: 1 / sqrt(N) to maintain constant power
        const stackGain = count > 1 ? (1 / Math.sqrt(count)) : 1.0;
        
        const baseDetune = this.getBaseDetune(oscId);

        for (let u = 0; u < count; u++) {
             const osc = this.ctx.createOscillator();
             osc.frequency.value = frequency;

             // Detune
             const uDetune = uConfig ? this.getUnisonDetuneOffset(u, count, uConfig.detune, uConfig.mode) : 0;
             osc.detune.value = baseDetune + uDetune;

             // Wave
             if (this.customWaves[oscId]) {
                 osc.setPeriodicWave(this.customWaves[oscId]!);
             }

             // Pan
             const panVal = uConfig ? this.getUnisonPan(u, count, uConfig.spread, uConfig.mode) : 0;
             const panner = this.ctx.createStereoPanner();
             panner.pan.value = panVal;

             // Unison Voice Gain (Blend logic could be complex, assume simple Mix)
             // If blend is 0, we only want center voice? 
             // Let's assume blend simply acts as volume for the stack, 
             // but usually unison blend mixes dry (1 voice) with wet (multi voice).
             // For this engine, we just render all voices. 
             
             // Connect: Osc -> Panner -> MixGain
             osc.connect(panner);
             
             // Individual voice gain inside the stack (for compensation)
             const vGain = this.ctx.createGain();
             vGain.gain.value = stackGain;
             
             panner.connect(vGain);
             vGain.connect(mixGain);

             osc.start();
             
             voiceOscs[oscId].push(osc);
             voicePanners[oscId].push(panner);
        }
    }

    this.activeVoices.set(noteId, { 
        oscillators: voiceOscs, 
        panners: voicePanners, 
        oscGains, 
        envelopeGain, 
        frequency 
    });
  }

  public noteOff(noteId: string) {
    if (!this.ctx) return;
    const voice = this.activeVoices.get(noteId);
    if (voice) {
      const stopTime = this.ctx.currentTime + this.release;
      
      voice.envelopeGain.gain.cancelScheduledValues(this.ctx.currentTime);
      voice.envelopeGain.gain.setValueAtTime(voice.envelopeGain.gain.value, this.ctx.currentTime);
      voice.envelopeGain.gain.exponentialRampToValueAtTime(0.001, stopTime);
      
      // Schedule stop for ALL oscillators in the stacks
      voice.oscillators.forEach(stack => {
          stack.forEach(osc => osc.stop(stopTime));
      });
      
      setTimeout(() => {
        voice.oscillators.forEach(stack => {
             stack.forEach(osc => osc.disconnect());
        });
        voice.panners.forEach(stack => stack.forEach(p => p.disconnect()));
        voice.oscGains.forEach(g => g.disconnect());
        voice.envelopeGain.disconnect();
      }, this.release * 1000 + 100);

      this.activeVoices.delete(noteId);
    }
  }

  public setMasterVolume(val: number) {
    this.globalVolume = val;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(val, this.ctx.currentTime, 0.02);
    }
  }

  public setAttack(val: number) { this.attack = val; }
  public setRelease(val: number) { this.release = val; }
}

export const audioEngine = new AudioEngine();
