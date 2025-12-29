
import React from 'react';
import { NeumorphicKnob } from './NeumorphicKnob';
import { UnisonConfig, UnisonMode } from '../types';
import { Layers } from 'lucide-react';
import { Tooltip } from './Tooltip';

interface UnisonControlProps {
  config: UnisonConfig;
  onChange: (newConfig: UnisonConfig) => void;
}

export const UnisonControl: React.FC<UnisonControlProps> = ({ config, onChange }) => {
  
  const update = (key: keyof UnisonConfig, val: any) => {
    onChange({ ...config, [key]: val });
  };

  const modes: { id: UnisonMode; desc: string }[] = [
      { id: 'classic', desc: 'Standard Detune' },
      { id: 'uniform', desc: 'Linear Spread' },
      { id: 'fifth', desc: 'Harmonic Fifths' },
      { id: 'octave', desc: 'Octave Stacking' }
  ];

  return (
    <div className="flex flex-col h-full">
         <div className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-1.5 px-1">
            <Layers size={10}/> UNISON
        </div>

        <div className="flex-1 flex flex-col justify-between gap-2">
            
            {/* Visualizer / Mode Selector Header */}
            <div className="flex items-center justify-between bg-[#efeeee] p-2 rounded-lg shadow-[inset_2px_2px_4px_#d1d9e6,inset_-2px_-2px_4px_#ffffff]">
                {/* Voice Count Slider (Horizontal) */}
                <div className="flex flex-col gap-0.5 w-1/2">
                    <span className="text-[8px] font-bold text-gray-400">VOICES: {config.voices}</span>
                    <Tooltip content="Number of stacked voices" position="top">
                        <input 
                            type="range" 
                            min="1" max="9" step="1"
                            value={config.voices}
                            onChange={(e) => update('voices', parseInt(e.target.value))}
                            className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-500"
                        />
                    </Tooltip>
                </div>

                {/* Mode Toggles */}
                <div className="flex gap-1">
                    {modes.map(m => (
                        <Tooltip key={m.id} content={m.desc} position="top">
                            <button
                                onClick={() => update('mode', m.id)}
                                className={`w-6 h-6 rounded flex items-center justify-center text-[8px] font-bold transition-all
                                    ${config.mode === m.id
                                        ? 'bg-[#efeeee] text-blue-500 shadow-[inset_1px_1px_3px_#d1d9e6,inset_-1px_-1px_3px_#ffffff]' 
                                        : 'text-gray-400 hover:text-gray-600'
                                    }
                                `}
                            >
                                {m.id[0].toUpperCase()}
                            </button>
                        </Tooltip>
                    ))}
                </div>
            </div>

            {/* Knobs Row */}
            <div className="flex justify-around items-center">
                 <NeumorphicKnob 
                    value={config.detune} min={0} max={100} 
                    onChange={(v) => update('detune', v)} 
                    label="THICK" unit="%" 
                    tooltip="Pitch Detuning Amount"
                />
                 <NeumorphicKnob 
                    value={config.spread} min={0} max={100} 
                    onChange={(v) => update('spread', v)} 
                    label="WIDTH" unit="%" 
                    tooltip="Stereo Panorama Spread"
                />
                 <NeumorphicKnob 
                    value={config.blend} min={0} max={100} 
                    onChange={(v) => update('blend', v)} 
                    label="BLEND" unit="%" 
                    tooltip="Dry/Wet Mix"
                />
            </div>
        </div>
    </div>
  );
};
