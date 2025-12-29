
import React from 'react';
import { NeumorphicKnob } from './NeumorphicKnob';
import { FilterSettings, FilterType } from '../types';
import { Fingerprint } from 'lucide-react';
import { Tooltip } from './Tooltip';

interface FilterControlProps {
  settings: FilterSettings;
  onChange: (settings: FilterSettings) => void;
}

export const FilterControl: React.FC<FilterControlProps> = ({ settings, onChange }) => {
  
  const update = (key: keyof FilterSettings, value: any) => {
    onChange({ ...settings, [key]: value });
  };

  const types: { id: FilterType; label: string; name: string; icon: React.ReactNode }[] = [
    { 
        id: 'lowpass', 
        label: 'LP',
        name: 'Low Pass',
        icon: (
            <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M1 2 Q 6 2 11 10" />
            </svg>
        )
    },
    { 
        id: 'bandpass', 
        label: 'BP',
        name: 'Band Pass',
        icon: (
            <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2">
                 <path d="M1 10 Q 6 -5 11 10" />
            </svg>
        )
    },
    { 
        id: 'highpass', 
        label: 'HP',
        name: 'High Pass',
        icon: (
            <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2">
                 <path d="M1 10 Q 6 2 11 2" />
            </svg>
        )
    },
  ];

  return (
    <div className="p-3 rounded-xl bg-[#efeeee] shadow-[4px_4px_8px_#d1d9e6,-4px_-4px_8px_#ffffff] flex flex-col relative overflow-hidden h-full">
         <div className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-1.5 px-1 z-10">
            <Fingerprint size={10}/> FILTER
        </div>

        {/* Type Selector */}
        <div className="flex justify-center gap-3 mb-2 z-10">
            {types.map(t => (
                <Tooltip key={t.id} content={t.name} position="top">
                    <button
                        onClick={() => update('type', t.id)}
                        className={`
                            w-8 h-8 rounded-lg flex flex-col items-center justify-center transition-all
                            ${settings.type === t.id 
                                ? 'bg-[#efeeee] text-blue-500 shadow-[inset_2px_2px_4px_#d1d9e6,inset_-2px_-2px_4px_#ffffff]' 
                                : 'bg-[#efeeee] text-gray-400 shadow-[3px_3px_6px_#d1d9e6,-3px_-3px_6px_#ffffff] active:shadow-inner'
                            }
                        `}
                    >
                        <div className="mb-[1px]">{t.icon}</div>
                        <span className="text-[6px] font-bold">{t.label}</span>
                    </button>
                </Tooltip>
            ))}
        </div>

        {/* Knobs */}
        <div className="flex justify-around items-center flex-1 z-10">
             <NeumorphicKnob 
                value={settings.cutoff} min={0} max={1} 
                onChange={(v) => update('cutoff', v)} 
                label="CUTOFF" unit="" 
                tooltip="Filter Frequency"
                customValueDisplay={(Math.round(settings.cutoff * 100)).toString()}
            />
             <NeumorphicKnob 
                value={settings.resonance} min={0} max={100} 
                onChange={(v) => update('resonance', v)} 
                label="RES" unit="%" 
                tooltip="Resonance / Q"
            />
        </div>

        {/* Background Deco */}
        <div className="absolute -bottom-2 -right-2 text-8xl text-gray-300 opacity-5 pointer-events-none -rotate-12 font-black">F</div>
    </div>
  );
};
