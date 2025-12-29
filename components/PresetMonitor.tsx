
import React, { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Save, ChevronDown, Check } from 'lucide-react';
import { Preset } from '../types';
import { Tooltip } from './Tooltip';

interface PresetMonitorProps {
  currentPresetName: string;
  presetIndex: number;
  totalPresets: number;
  presets: Preset[];
  onNext: () => void;
  onPrev: () => void;
  onSave: () => void;
  onSelect: (index: number) => void;
}

export const PresetMonitor: React.FC<PresetMonitorProps> = ({ 
  currentPresetName, 
  presetIndex, 
  totalPresets,
  presets, 
  onNext, 
  onPrev,
  onSave,
  onSelect
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
        document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
        document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className="w-full relative flex items-center justify-center" ref={dropdownRef}>
      {/* Chassis Housing */}
      <div className="relative w-full bg-[#efeeee] rounded-lg shadow-[inset_2px_2px_5px_#d1d9e6,inset_-2px_-2px_5px_#ffffff] p-1.5 flex items-center gap-2 border border-white/20">
        
        {/* The Screen Module / Trigger */}
        <Tooltip content="Select Preset" position="bottom" className="flex-1">
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className="w-full relative bg-[#1a1b1e] rounded shadow-[inset_2px_2px_6px_#000000] px-2 py-1 overflow-hidden group h-9 flex items-center justify-between cursor-pointer hover:bg-[#25262a] transition-colors outline-none focus:ring-1 ring-blue-500/50"
            >
                {/* Screen Effects */}
                <div className="absolute inset-0 pointer-events-none z-10 opacity-20 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_4px,3px_100%]"></div>
                
                {/* Index */}
                <span className="relative z-20 text-cyan-400/50 text-[10px] font-mono">{String(presetIndex + 1).padStart(2, '0')}</span>
                
                {/* Main Display Text */}
                <span className="relative z-20 flex-1 text-center text-sm font-mono font-bold text-cyan-400 tracking-wider uppercase drop-shadow-[0_0_5px_rgba(34,211,238,0.6)] whitespace-nowrap truncate mx-2">
                    {currentPresetName}
                </span>

                {/* Dropdown Indicator */}
                <ChevronDown size={12} className={`relative z-20 text-cyan-400/70 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>
        </Tooltip>

        {/* Control Cluster */}
        <div className="flex items-center gap-1.5">
            <Tooltip content="Previous Preset" position="bottom">
                <button 
                    onClick={onPrev}
                    className="w-6 h-6 rounded bg-[#efeeee] shadow-[2px_2px_4px_#d1d9e6,-2px_-2px_4px_#ffffff] active:shadow-[inset_1px_1px_2px_#d1d9e6,inset_-1px_-1px_2px_#ffffff] flex items-center justify-center text-gray-500 hover:text-cyan-600 transition-colors"
                >
                    <ChevronLeft size={14} />
                </button>
            </Tooltip>
            
            <Tooltip content="Next Preset" position="bottom">
                <button 
                    onClick={onNext}
                    className="w-6 h-6 rounded bg-[#efeeee] shadow-[2px_2px_4px_#d1d9e6,-2px_-2px_4px_#ffffff] active:shadow-[inset_1px_1px_2px_#d1d9e6,inset_-1px_-1px_2px_#ffffff] flex items-center justify-center text-gray-500 hover:text-cyan-600 transition-colors"
                >
                    <ChevronRight size={14} />
                </button>
            </Tooltip>

            <Tooltip content="Save Current State" position="bottom">
                <button 
                    onClick={onSave}
                    className="w-6 h-6 rounded bg-[#efeeee] shadow-[2px_2px_4px_#d1d9e6,-2px_-2px_4px_#ffffff] active:shadow-[inset_1px_1px_2px_#d1d9e6,inset_-1px_-1px_2px_#ffffff] flex items-center justify-center text-gray-400 hover:text-blue-500 transition-colors ml-1"
                >
                    <Save size={12} />
                </button>
            </Tooltip>
        </div>
      </div>

      {/* Neumorphic Dropdown List */}
      {isOpen && (
        <div className="absolute top-full mt-2 left-0 w-full z-50 rounded-xl bg-[#efeeee] shadow-[6px_6px_12px_#c8d0e7,-6px_-6px_12px_#ffffff] border border-white/50 p-2 animate-in fade-in zoom-in-95 duration-100 flex flex-col gap-1 max-h-[300px] overflow-y-auto">
            {presets.map((preset, index) => {
                const isActive = index === presetIndex;
                return (
                    <button
                        key={preset.id}
                        onClick={() => {
                            onSelect(index);
                            setIsOpen(false);
                        }}
                        className={`
                            text-xs font-bold px-3 py-2 rounded-lg text-left transition-all flex items-center justify-between group
                            ${isActive 
                                ? 'text-blue-500 bg-[#efeeee] shadow-[inset_2px_2px_4px_#d1d9e6,inset_-2px_-2px_4px_#ffffff]' 
                                : 'text-gray-500 hover:text-blue-500 hover:bg-[#efeeee] hover:shadow-[3px_3px_6px_#d1d9e6,-3px_-3px_6px_#ffffff]'
                            }
                        `}
                    >
                        <span className="flex items-center gap-2">
                            <span className={`text-[10px] ${isActive ? 'text-blue-400' : 'text-gray-300'}`}>
                                {String(index + 1).padStart(2, '0')}
                            </span>
                            {preset.name}
                        </span>
                        {isActive && <Check size={12} className="text-blue-500" />}
                    </button>
                );
            })}
        </div>
      )}
    </div>
  );
};
