import React, { useState, useRef, useEffect, useCallback } from 'react';

interface PitchBendProps {
  onChange: (value: number) => void;
  className?: string;
}

export const PitchBend: React.FC<PitchBendProps> = ({ onChange, className = '' }) => {
  const [value, setValue] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);
  const startY = useRef<number>(0);
  const startVal = useRef<number>(0);

  const updateValue = (newValue: number) => {
    // Clamp between -1 and 1
    const clamped = Math.max(-1, Math.min(1, newValue));
    setValue(clamped);
    onChange(clamped);
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    setIsDragging(true);
    startY.current = e.clientY;
    startVal.current = value;
    // Capture pointer to handle dragging outside the element
    (e.target as Element).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    
    // Sensitivity: how many pixels to move full range
    const sensitivity = 150; 
    const deltaY = startY.current - e.clientY; // Up is positive in pitch bend usually
    const deltaVal = deltaY / (sensitivity / 2);
    
    // If we want absolute tracking based on click position relative to center, it's different.
    // Standard Pitch Wheel behavior is relative delta or absolute position on a physical wheel.
    // For a touch strip, let's behave like a spring-loaded fader.
    
    updateValue(startVal.current + deltaVal);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    setIsDragging(false);
    (e.target as Element).releasePointerCapture(e.pointerId);
    
    // Spring back to 0
    const springBack = () => {
        // We'll let CSS transition handle the visual return, 
        // but we need to update state to 0.
        setValue(0);
        onChange(0);
    };
    springBack();
  };

  // Calculate visual offset percentage (0% is center)
  // Value -1 (bottom) -> 100% top ? No. 
  // Let's say track height is 100%. Center is 50%.
  // Value -1 -> 100% (bottom), Value 1 -> 0% (top).
  const percent = 50 - (value * 40); // 40% range up/down (leaving 10% padding)

  return (
    <div className={`flex flex-col items-center gap-2 h-full ${className}`}>
        <div 
            ref={trackRef}
            className="relative w-12 flex-1 rounded-full bg-[#efeeee] shadow-[inset_3px_3px_6px_#d1d9e6,inset_-3px_-3px_6px_#ffffff] overflow-hidden cursor-ns-resize touch-none"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
        >
            {/* Center Indent */}
            <div className="absolute top-1/2 left-2 right-2 h-[2px] bg-gray-300/30 -translate-y-1/2 pointer-events-none"></div>

            {/* The Handle / Fader Cap */}
            <div 
                className={`absolute left-1 right-1 h-8 rounded-md bg-[#efeeee] shadow-[3px_3px_6px_#d1d9e6,-3px_-3px_6px_#ffffff] flex items-center justify-center pointer-events-none transition-all ${isDragging ? 'duration-0' : 'duration-300 ease-out'}`}
                style={{ top: `${percent}%`, transform: 'translateY(-50%)' }}
            >
                {/* Grip Lines */}
                <div className="w-6 h-[2px] bg-gray-400/20 mb-[2px]"></div>
                <div className="w-6 h-[2px] bg-gray-400/20 mt-[2px]"></div>
                
                {/* Active Light */}
                {Math.abs(value) > 0.05 && (
                    <div className={`absolute w-1 h-1 rounded-full bg-blue-500 shadow-[0_0_5px_rgba(59,130,246,0.8)] ${value > 0 ? 'top-1' : 'bottom-1'}`}></div>
                )}
            </div>
        </div>
        <span className="text-[9px] font-bold text-gray-400 tracking-widest">BEND</span>
    </div>
  );
};