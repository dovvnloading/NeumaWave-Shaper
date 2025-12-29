
import React, { useState, useEffect, useCallback } from 'react';
import { WaveCanvas } from './components/WaveCanvas';
import { NeumorphicButton } from './components/NeumorphicButton';
import { NeumorphicKnob } from './components/NeumorphicKnob';
import { Piano } from './components/Piano';
import { PresetMonitor } from './components/PresetMonitor';
import { PitchBend } from './components/PitchBend';
import { TransposeControl } from './components/TransposeControl';
import { UnisonControl } from './components/UnisonControl';
import { DraggableNumber } from './components/DraggableNumber';
import { FilterControl } from './components/FilterControl';
import { InfoModal } from './components/InfoModal';
import { audioEngine } from './services/audioEngine';
import { Activity, Zap, Sliders, Settings2, Timer, Waves, Info } from 'lucide-react';
import { KEY_TO_NOTE, DEFAULT_UNISON } from './constants';
import { OscillatorConfig, Preset, UnisonConfig, FilterSettings } from './types';
import { DEFAULT_PRESETS } from './data/presets';
import { Tooltip } from './components/Tooltip';

const SYNC_OPTIONS = [
  { label: '1/1', mult: 4.0 },
  { label: '1/2.', mult: 3.0 },
  { label: '1/2', mult: 2.0 },
  { label: '1/4.', mult: 1.5 },
  { label: '1/4', mult: 1.0 },
  { label: '1/8.', mult: 0.75 },
  { label: '1/8', mult: 0.5 },
  { label: '1/16', mult: 0.25 }
];

const App: React.FC = () => {
  const [isAudioContextReady, setIsAudioContextReady] = useState(false);
  const [activeNotes, setActiveNotes] = useState<Set<string>>(new Set());
  const [showInfo, setShowInfo] = useState(false);
  
  // Performance State
  const [transpose, setTranspose] = useState(0); 

  // Preset State
  const [presets, setPresets] = useState<Preset[]>(DEFAULT_PRESETS);
  const [currentPresetIndex, setCurrentPresetIndex] = useState(0);

  // Global Params
  const [masterVolume, setMasterVolume] = useState(60);
  const [bpm, setBpm] = useState(120);
  const [attack, setAttack] = useState(0.1);
  const [release, setRelease] = useState(0.4);
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null);

  // Filter Params
  const [filterSettings, setFilterSettings] = useState<FilterSettings>(DEFAULT_PRESETS[0].filter);

  // FX Params
  const [delayTime, setDelayTime] = useState(0.35); 
  const [delaySyncIndex, setDelaySyncIndex] = useState(4); 
  const [isDelaySynced, setIsDelaySynced] = useState(false);
  const [delayFeedback, setDelayFeedback] = useState(40);
  const [delayMix, setDelayMix] = useState(0);

  const [reverbSize, setReverbSize] = useState(2.5);
  const [reverbMix, setReverbMix] = useState(0);

  // 3-Oscillator State
  const [oscillators, setOscillators] = useState<OscillatorConfig[]>(DEFAULT_PRESETS[0].oscillators);
  const [selectedOscId, setSelectedOscId] = useState<number>(0);

  const selectedOsc = oscillators[selectedOscId];

  // Load Preset Logic
  const loadPreset = useCallback((preset: Preset) => {
    // 1. Oscillators
    const oscsCopy = JSON.parse(JSON.stringify(preset.oscillators));
    setOscillators(oscsCopy);
    
    oscsCopy.forEach((osc: OscillatorConfig) => {
        audioEngine.updateWaveform(osc.id, osc.samples);
        audioEngine.setOscVolume(osc.id, osc.volume / 100);
        audioEngine.setOscDetune(osc.id, osc.detune);
        audioEngine.setOscOctave(osc.id, osc.octave);
        const u = osc.unison || { ...DEFAULT_UNISON };
        audioEngine.setOscUnison(osc.id, u);
    });

    // 2. Envelope
    setAttack(preset.envelope.attack);
    setRelease(preset.envelope.release);
    setMasterVolume(preset.envelope.masterVolume);
    audioEngine.setAttack(preset.envelope.attack);
    audioEngine.setRelease(preset.envelope.release);
    audioEngine.setMasterVolume(preset.envelope.masterVolume / 100);

    // 3. Filter
    const filter = preset.filter || { cutoff: 1.0, resonance: 0, type: 'lowpass' };
    setFilterSettings(filter);
    audioEngine.setFilterType(filter.type);
    audioEngine.setFilterCutoff(filter.cutoff);
    audioEngine.setFilterResonance(filter.resonance);

    // 4. FX
    setDelayTime(preset.fx.delayTime);
    setDelayFeedback(preset.fx.delayFeedback);
    setDelayMix(preset.fx.delayMix);
    setIsDelaySynced(preset.fx.isDelaySynced);
    setDelaySyncIndex(preset.fx.delaySyncIndex);
    
    setReverbSize(preset.fx.reverbSize);
    setReverbMix(preset.fx.reverbMix);

    audioEngine.setDelayFeedback(preset.fx.delayFeedback / 100);
    audioEngine.setDelayMix(preset.fx.delayMix / 100);
    audioEngine.setReverbSize(preset.fx.reverbSize);
    audioEngine.setReverbMix(preset.fx.reverbMix / 100);
    
  }, []);

  const handleNextPreset = () => {
    const nextIndex = (currentPresetIndex + 1) % presets.length;
    setCurrentPresetIndex(nextIndex);
    loadPreset(presets[nextIndex]);
  };

  const handlePrevPreset = () => {
    const prevIndex = (currentPresetIndex - 1 + presets.length) % presets.length;
    setCurrentPresetIndex(prevIndex);
    loadPreset(presets[prevIndex]);
  };

  const handleSelectPreset = (index: number) => {
    setCurrentPresetIndex(index);
    loadPreset(presets[index]);
  };

  const handleSavePreset = () => {
    const newPreset: Preset = {
        id: `custom-${Date.now()}`,
        name: `USER ${presets.length + 1}`,
        oscillators: JSON.parse(JSON.stringify(oscillators)),
        envelope: { attack, release, masterVolume },
        filter: { ...filterSettings },
        fx: { delayTime, delayFeedback, delayMix, reverbSize, reverbMix, isDelaySynced, delaySyncIndex }
    };
    setPresets([...presets, newPreset]);
    setCurrentPresetIndex(presets.length);
  };

  useEffect(() => {
    setAnalyser(audioEngine.getAnalyser());
    loadPreset(DEFAULT_PRESETS[0]);
  }, [loadPreset]); 

  const updateDelay = useCallback(() => {
    let seconds = delayTime;
    if (isDelaySynced) {
        const beatSec = 60 / bpm;
        seconds = beatSec * SYNC_OPTIONS[delaySyncIndex].mult;
    }
    audioEngine.setDelayTime(seconds);
  }, [delayTime, delaySyncIndex, isDelaySynced, bpm]);

  useEffect(() => {
    updateDelay();
  }, [updateDelay]);

  const initAudio = () => {
    if (!isAudioContextReady) {
        audioEngine.init();
        setIsAudioContextReady(true);
    }
  };

  const handleNoteOn = useCallback((key: string) => {
    initAudio();
    const noteData = KEY_TO_NOTE[key.toLowerCase()];
    if (noteData) {
      const transposedFreq = noteData.freq * Math.pow(2, transpose);
      audioEngine.noteOn(noteData.key, transposedFreq);
      setActiveNotes(prev => new Set(prev).add(noteData.key));
    }
  }, [isAudioContextReady, transpose]);

  const handleNoteOff = useCallback((key: string) => {
    const noteData = KEY_TO_NOTE[key.toLowerCase()];
    if (noteData) {
      audioEngine.noteOff(noteData.key);
      setActiveNotes(prev => {
        const next = new Set(prev);
        next.delete(noteData.key);
        return next;
      });
    }
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.repeat) return;
      if (KEY_TO_NOTE[e.key.toLowerCase()]) {
        handleNoteOn(e.key.toLowerCase());
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
        if (KEY_TO_NOTE[e.key.toLowerCase()]) {
          handleNoteOff(e.key.toLowerCase());
        }
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [handleNoteOn, handleNoteOff]);

  // Global Controls
  const handleMasterVolume = (val: number) => {
    setMasterVolume(val);
    audioEngine.setMasterVolume(val / 100);
  };
  const handleAttack = (val: number) => {
    setAttack(val);
    audioEngine.setAttack(val);
  };
  const handleRelease = (val: number) => {
    setRelease(val);
    audioEngine.setRelease(val);
  };

  const updateOscillator = (id: number, updates: Partial<OscillatorConfig>) => {
      setOscillators(prev => prev.map(osc => {
          if (osc.id === id) {
              const newConfig = { ...osc, ...updates };
              
              if (updates.volume !== undefined) audioEngine.setOscVolume(id, updates.volume / 100);
              if (updates.detune !== undefined) audioEngine.setOscDetune(id, updates.detune);
              if (updates.octave !== undefined) audioEngine.setOscOctave(id, updates.octave);
              if (updates.samples !== undefined) audioEngine.updateWaveform(id, updates.samples);
              if (updates.unison !== undefined) audioEngine.setOscUnison(id, updates.unison);
              
              return newConfig;
          }
          return osc;
      }));
  };

  const updateFilter = (newSettings: FilterSettings) => {
      setFilterSettings(newSettings);
      audioEngine.setFilterType(newSettings.type);
      audioEngine.setFilterCutoff(newSettings.cutoff);
      audioEngine.setFilterResonance(newSettings.resonance);
  };

  // FX Handlers
  const handleDelayFeedback = (v: number) => { setDelayFeedback(v); audioEngine.setDelayFeedback(v / 100); };
  const handleDelayMix = (v: number) => { setDelayMix(v); audioEngine.setDelayMix(v / 100); };
  const handleReverbSize = (v: number) => { setReverbSize(v); audioEngine.setReverbSize(v); };
  const handleReverbMix = (v: number) => { setReverbMix(v); audioEngine.setReverbMix(v / 100); };
  const handlePitchBend = (val: number) => { audioEngine.setPitchBend(val); };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#efeeee] p-4 font-sans text-gray-600 select-none">
      
      {/* Chassis - Compacted */}
      <div className="w-full max-w-6xl bg-[#efeeee] rounded-[1.5rem] shadow-[20px_20px_60px_#c8d0e7,-20px_-20px_60px_#ffffff] p-5 relative border border-white/40 flex flex-col gap-4">
        
        {/* Top Section: Header & Monitor */}
        <div className="flex flex-col md:flex-row gap-2 items-center justify-between px-1">
            <div className="flex flex-col gap-1 min-w-[120px]">
                 <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-[#efeeee] shadow-[inset_2px_2px_5px_#d1d9e6,inset_-2px_-2px_5px_#ffffff] flex items-center justify-center text-blue-500">
                        <Zap size={16} fill="currentColor" />
                    </div>
                    <div>
                        <h1 className="text-xl font-black tracking-tighter text-gray-700 leading-none">NEUMA<span className="text-blue-500">WAVE</span></h1>
                    </div>
                </div>
                <div className="flex items-center gap-1.5 ml-1">
                     <div className={`transition-all duration-300 w-1.5 h-1.5 rounded-full ${isAudioContextReady ? 'bg-green-400 shadow-[0_0_8px_#4ade80]' : 'bg-red-400'} `}></div>
                     <span className="text-[9px] font-bold text-gray-400">{isAudioContextReady ? 'READY' : 'STANDBY'}</span>
                </div>
            </div>
            
            <div className="flex-1 w-full max-w-xs z-30">
                 <PresetMonitor 
                    currentPresetName={presets[currentPresetIndex].name}
                    presetIndex={currentPresetIndex}
                    totalPresets={presets.length}
                    presets={presets}
                    onNext={handleNextPreset}
                    onPrev={handlePrevPreset}
                    onSave={handleSavePreset}
                    onSelect={handleSelectPreset}
                 />
            </div>

             <div className="flex items-center gap-2 justify-end min-w-[120px]">
                 {/* Info Button */}
                 <Tooltip content="Credits & Info" position="bottom">
                    <button 
                        onClick={() => setShowInfo(true)}
                        className="w-8 h-8 rounded-full bg-[#efeeee] shadow-[3px_3px_6px_#d1d9e6,-3px_-3px_6px_#ffffff] active:shadow-[inset_2px_2px_4px_#d1d9e6,inset_-2px_-2px_4px_#ffffff] flex items-center justify-center text-gray-400 hover:text-blue-500 transition-colors"
                    >
                        <Info size={16} strokeWidth={2.5} />
                    </button>
                 </Tooltip>

                 <div className="flex items-center gap-2 bg-[#efeeee] px-3 py-1.5 rounded-full shadow-[inset_2px_2px_5px_#d1d9e6,inset_-2px_-2px_5px_#ffffff]">
                    <span className="text-[9px] font-bold text-gray-400 select-none">BPM</span>
                    <Tooltip content="Tempo (Beats Per Minute)" position="bottom">
                        <DraggableNumber 
                            value={bpm} 
                            onChange={setBpm} 
                            min={20} 
                            max={300}
                            className="w-8 text-xs font-bold text-gray-600 text-center"
                        />
                    </Tooltip>
                 </div>
            </div>
        </div>

        {/* Wave Visualizer - Shorter Height */}
        <div className="relative w-full h-[140px] rounded-xl bg-[#efeeee] shadow-[inset_4px_4px_8px_#d1d9e6,inset_-4px_-4px_8px_#ffffff] p-3 overflow-hidden group">
            <div className="absolute top-3 left-3 z-10 pointer-events-none opacity-40 flex items-center gap-2">
                <Activity size={14} className="text-blue-500"/>
                <span className="text-[10px] font-bold tracking-widest text-gray-500">{selectedOsc.label} WAVEFORM DRAW</span>
            </div>
            <WaveCanvas 
              samples={selectedOsc.samples}
              onWaveChange={(newSamples) => updateOscillator(selectedOscId, { samples: newSamples })} 
              isPlaying={activeNotes.size > 0} 
              analyserNode={analyser}
            />
        </div>

        {/* Control Dashboard - Reduced Gap */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
            
            {/* Osc Selector */}
            <div className="md:col-span-2 flex flex-col gap-2 p-3 rounded-xl bg-[#efeeee] shadow-[4px_4px_8px_#d1d9e6,-4px_-4px_8px_#ffffff]">
                <div className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-0.5 flex items-center gap-1.5 px-1">
                    <Sliders size={10}/> SOURCE
                </div>
                <div className="flex flex-col gap-2 h-full justify-center">
                    {oscillators.map(osc => (
                        <NeumorphicButton
                            key={osc.id}
                            label={osc.label}
                            active={selectedOscId === osc.id}
                            onClick={() => setSelectedOscId(osc.id)}
                            className="w-full text-left text-[10px] py-2 px-3 justify-start"
                            icon={<div className={`w-1.5 h-1.5 rounded-full mr-2 ${selectedOscId === osc.id ? 'bg-blue-500' : 'bg-gray-300'}`}></div>}
                            tooltip={`Edit ${osc.label} Parameters`}
                        />
                    ))}
                </div>
            </div>

            {/* Osc Params & Unison */}
            <div className="md:col-span-10 p-3 rounded-xl bg-[#efeeee] shadow-[4px_4px_8px_#d1d9e6,-4px_-4px_8px_#ffffff] grid grid-cols-2 gap-4">
                {/* Standard Modifiers */}
                <div className="flex flex-col border-r border-gray-200/50 pr-4">
                    <div className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-1.5 px-1">
                        <Settings2 size={10}/> TUNING & LEVEL
                    </div>
                    <div className="flex justify-around items-center flex-1">
                        <NeumorphicKnob 
                            value={selectedOsc.volume} min={0} max={100} 
                            onChange={(v) => updateOscillator(selectedOscId, { volume: v })} 
                            label="LEVEL" unit="%" 
                            tooltip="Oscillator Volume"
                        />
                        <NeumorphicKnob 
                            value={selectedOsc.octave} min={-2} max={2} 
                            onChange={(v) => updateOscillator(selectedOscId, { octave: Math.round(v) })} 
                            label="OCTAVE" unit="" 
                            tooltip="Octave Shift"
                        />
                        <NeumorphicKnob 
                            value={selectedOsc.detune} min={-100} max={100} 
                            onChange={(v) => updateOscillator(selectedOscId, { detune: v })} 
                            label="FINE" unit="c" 
                            tooltip="Fine Detune (Cents)"
                        />
                    </div>
                </div>

                {/* Spectral Unison */}
                <div className="pl-2">
                    <UnisonControl 
                        config={selectedOsc.unison}
                        onChange={(newUnison) => updateOscillator(selectedOscId, { unison: newUnison })}
                    />
                </div>
            </div>
        </div>

        {/* FX Rack & Envelope & Filter Row - Compact Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            
            {/* Global Envelope */}
            <div className="p-3 rounded-xl bg-[#efeeee] shadow-[4px_4px_8px_#d1d9e6,-4px_-4px_8px_#ffffff] flex flex-col">
                 <div className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-1.5 px-1">
                    <Activity size={10}/> ENVELOPE
                </div>
                <div className="flex justify-around items-center flex-1">
                     <NeumorphicKnob 
                        value={attack} min={0.01} max={2.0} 
                        onChange={handleAttack} label="ATT" unit="s" 
                        tooltip="Attack Time"
                    />
                    <NeumorphicKnob 
                        value={release} min={0.1} max={3.0} 
                        onChange={handleRelease} label="REL" unit="s" 
                        tooltip="Release Time"
                    />
                     <NeumorphicKnob 
                        value={masterVolume} min={0} max={100} 
                        onChange={handleMasterVolume} label="MAIN" unit="%" 
                        tooltip="Master Volume"
                    />
                </div>
            </div>

            {/* Filter */}
            <div className="h-full">
                <FilterControl 
                    settings={filterSettings}
                    onChange={updateFilter}
                />
            </div>

            {/* Stereo Delay */}
            <div className="p-3 rounded-xl bg-[#efeeee] shadow-[4px_4px_8px_#d1d9e6,-4px_-4px_8px_#ffffff] flex flex-col relative overflow-hidden">
                <div className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-2 flex items-center justify-between px-1 z-10">
                    <div className="flex items-center gap-1.5"><Timer size={10}/> DELAY</div>
                    <Tooltip content="Sync to BPM" position="top">
                        <button 
                            onClick={() => setIsDelaySynced(!isDelaySynced)}
                            className={`text-[8px] px-2 py-0.5 rounded-full transition-all ${isDelaySynced ? 'bg-blue-500 text-white shadow-md' : 'bg-gray-200 text-gray-500'}`}
                        >
                            SYNC
                        </button>
                    </Tooltip>
                </div>
                <div className="flex justify-around items-center flex-1 z-10">
                     {isDelaySynced ? (
                         <NeumorphicKnob 
                            value={delaySyncIndex} min={0} max={SYNC_OPTIONS.length - 1} 
                            onChange={(v) => setDelaySyncIndex(Math.round(v))} 
                            label="TIME" unit=""
                            customValueDisplay={SYNC_OPTIONS[delaySyncIndex].label}
                            tooltip="Delay Time (Synced)"
                        />
                     ) : (
                        <NeumorphicKnob 
                            value={delayTime} min={0.01} max={2.0} 
                            onChange={setDelayTime} label="TIME" unit="s" 
                            tooltip="Delay Time (Seconds)"
                        />
                     )}
                    <NeumorphicKnob 
                        value={delayFeedback} min={0} max={95} 
                        onChange={handleDelayFeedback} label="FDBK" unit="%" 
                        tooltip="Delay Feedback"
                    />
                    <NeumorphicKnob 
                        value={delayMix} min={0} max={100} 
                        onChange={handleDelayMix} label="MIX" unit="%" 
                        tooltip="Delay Dry/Wet Mix"
                    />
                </div>
                <div className="absolute -bottom-2 -right-2 text-8xl text-gray-300 opacity-5 pointer-events-none rotate-12 font-black">D</div>
            </div>

            {/* Convolution Reverb */}
            <div className="p-3 rounded-xl bg-[#efeeee] shadow-[4px_4px_8px_#d1d9e6,-4px_-4px_8px_#ffffff] flex flex-col relative overflow-hidden">
                <div className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-1.5 px-1 z-10">
                    <Waves size={10}/> REVERB
                </div>
                <div className="flex justify-around items-center flex-1 z-10">
                    <NeumorphicKnob 
                        value={reverbSize} min={0.1} max={5.0} 
                        onChange={handleReverbSize} label="SIZE" unit="s" 
                        tooltip="Reverb Room Size"
                    />
                    <div className="w-[1px] h-8 bg-gray-300/50"></div>
                    <NeumorphicKnob 
                        value={reverbMix} min={0} max={100} 
                        onChange={handleReverbMix} label="MIX" unit="%" 
                        tooltip="Reverb Dry/Wet Mix"
                    />
                </div>
                <div className="absolute -bottom-2 -right-2 text-8xl text-gray-300 opacity-5 pointer-events-none rotate-12 font-black">R</div>
            </div>
        </div>

        {/* Bottom: Piano & Performance Controls - Reduced Height */}
        <div className="pt-1 flex flex-col md:flex-row gap-4 h-auto md:h-24">
            <div className="flex gap-4 h-24 md:h-full">
                <div className="w-12 h-full">
                    <PitchBend onChange={handlePitchBend} />
                </div>
                <div className="w-16 h-full">
                    <TransposeControl value={transpose} onChange={setTranspose} />
                </div>
            </div>
            
            <div className="flex-1 h-24 md:h-full">
                <Piano activeNotes={activeNotes} onNoteOn={handleNoteOn} onNoteOff={handleNoteOff} />
            </div>
        </div>
      
        {/* Info Modal Overlay */}
        {showInfo && <InfoModal onClose={() => setShowInfo(false)} />}

      </div>
    </div>
  );
};

export default App;
