
import React from 'react';
import { NOTES } from '../constants';

interface PianoProps {
  activeNotes: Set<string>;
  onNoteOn: (note: string) => void;
  onNoteOff: (note: string) => void;
}

export const Piano: React.FC<PianoProps> = ({ activeNotes, onNoteOn, onNoteOff }) => {
  const whiteKeys = NOTES.filter((n) => n.type === 'white');
  const blackKeys = NOTES.filter((n) => n.type === 'black');
  const widthPerWhiteKey = 100 / whiteKeys.length;

  return (
    <div className="relative w-full h-full min-h-[5rem] select-none">
      {/* Keyboard Bezel */}
      <div className="w-full h-full rounded-b-[1.5rem] rounded-t-lg bg-[#efeeee] shadow-[inset_3px_3px_6px_#d1d9e6,inset_-3px_-3px_6px_#ffffff] p-1 overflow-hidden">
        
        {/* White Keys */}
        <div className="flex w-full h-full">
            {whiteKeys.map((n) => {
            const isActive = activeNotes.has(n.key);
            return (
                <div
                key={n.note}
                onMouseDown={(e) => { if(e.button === 0) { e.preventDefault(); if (!activeNotes.has(n.key)) onNoteOn(n.key); } }}
                onMouseUp={() => onNoteOff(n.key)}
                onMouseLeave={() => activeNotes.has(n.key) && onNoteOff(n.key)}
                onTouchStart={(e) => { e.preventDefault(); if (!activeNotes.has(n.key)) onNoteOn(n.key); }}
                onTouchEnd={(e) => { e.preventDefault(); onNoteOff(n.key); }}
                style={{ width: `${widthPerWhiteKey}%` }}
                className={`
                    relative h-full border-r border-gray-300/50 last:border-r-0 
                    cursor-pointer transition-colors duration-75 ease-out rounded-b-sm
                    ${isActive 
                    ? 'bg-blue-100/50 shadow-[inset_0_5px_10px_rgba(0,0,0,0.1)]' 
                    : 'bg-[#f7f9fc] hover:bg-white'
                    }
                `}
                >
                <div className="absolute bottom-1 w-full text-center">
                    <span className="text-[8px] font-bold text-gray-300">{n.key.toUpperCase()}</span>
                </div>
                </div>
            );
            })}
        </div>

        {/* Black Keys */}
        <div className="absolute top-1 left-1 right-1 h-[60%] pointer-events-none">
            {blackKeys.map((n) => {
            const isActive = activeNotes.has(n.key);
            const indexInFull = NOTES.indexOf(n);
            const whiteKeysBefore = NOTES.slice(0, indexInFull).filter(x => x.type === 'white').length;
            const leftPos = whiteKeysBefore * widthPerWhiteKey;

            return (
                <div
                key={n.note}
                className="pointer-events-auto absolute z-20 top-0 -translate-x-1/2 cursor-pointer group"
                style={{
                    left: `${leftPos}%`,
                    width: `${widthPerWhiteKey * 0.6}%`,
                    height: '100%'
                }}
                onMouseDown={(e) => { if(e.button === 0) { e.preventDefault(); e.stopPropagation(); if (!isActive) onNoteOn(n.key); } }}
                onMouseUp={(e) => { e.stopPropagation(); onNoteOff(n.key); }}
                onMouseLeave={() => isActive && onNoteOff(n.key)}
                onTouchStart={(e) => { e.preventDefault(); e.stopPropagation(); if (!isActive) onNoteOn(n.key); }}
                onTouchEnd={(e) => { e.preventDefault(); e.stopPropagation(); onNoteOff(n.key); }}
                >
                <div className={`
                    w-full h-full rounded-b-sm transition-all duration-100 ease-out border-b-4 border-l border-r border-gray-900/50
                    ${isActive 
                    ? 'bg-gray-800 mt-0.5 border-b-0 shadow-inner' 
                    : 'bg-gray-700 shadow-[2px_2px_4px_rgba(0,0,0,0.3)] group-hover:bg-gray-600'
                    }
                `}>
                </div>
                </div>
            );
            })}
        </div>

      </div>
    </div>
  );
};
