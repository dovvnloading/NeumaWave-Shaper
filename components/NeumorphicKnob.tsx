
import React, { useState, useEffect, useRef } from 'react';
import { Tooltip } from './Tooltip';

interface NeumorphicKnobProps {
  value: number;
  min: number;
  max: number;
  onChange: (val: number) => void;
  label: string;
  unit?: string;
  customValueDisplay?: string;
  tooltip?: string;
}

export const NeumorphicKnob: React.FC<NeumorphicKnobProps> = ({ 
  value, min, max, onChange, label, unit, customValueDisplay, tooltip
}) => {
  const [angle, setAngle] = useState(0);
  
  // Refs for drag state
  const isDraggingRef = useRef(false);
  const startY = useRef<number>(0);
  const startValue = useRef<number>(0);

  // Convert value to angle (-135 to 135 degrees)
  useEffect(() => {
    const percentage = (value - min) / (max - min);
    const newAngle = -135 + (percentage * 270);
    setAngle(newAngle);
  }, [value, min, max]);

  const handlePointerDown = (e: React.PointerEvent) => {
    isDraggingRef.current = true;
    startY.current = e.clientY;
    startValue.current = value;
    
    // Capture pointer
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    
    document.body.style.cursor = 'ns-resize';
    e.preventDefault();
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDraggingRef.current) return;
    
    const deltaY = startY.current - e.clientY;
    const range = max - min;
    const sensitivity = 0.006; // Tuned for smooth control
    const deltaValue = deltaY * range * sensitivity;
    
    let newValue = startValue.current + deltaValue;
    newValue = Math.max(min, Math.min(max, newValue));
    
    onChange(newValue);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!isDraggingRef.current) return;
    
    isDraggingRef.current = false;
    (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    document.body.style.cursor = '';
  };

  const displayValue = customValueDisplay !== undefined 
    ? customValueDisplay 
    : (Math.abs(max - min) < 10 ? value.toFixed(1) : Math.round(value).toString());

  return (
    <Tooltip content={tooltip} position="top">
      <div className="flex flex-col items-center gap-1.5">
        <div 
          className="relative w-11 h-11 rounded-full flex items-center justify-center cursor-ns-resize touch-none select-none transition-transform active:scale-95 duration-100"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
        >
          {/* Outer Ring/Plate */}
          <div className="absolute inset-0 rounded-full bg-[#efeeee] shadow-[3px_3px_6px_#d1d9e6,-3px_-3px_6px_#ffffff]"></div>
          
          {/* Tick Marks Ring (Decor) */}
          <div className="absolute inset-1 rounded-full border border-gray-300 opacity-20"></div>

          {/* The Rotating Knob */}
          <div 
            className="absolute w-7 h-7 rounded-full bg-[#efeeee] shadow-[inset_1px_1px_3px_#d1d9e6,inset_-1px_-1px_3px_#ffffff]"
            style={{ transform: `rotate(${angle}deg)` }}
          >
             {/* Indicator */}
             <div className="absolute top-1 left-1/2 -translate-x-1/2 w-0.5 h-2 bg-blue-500 rounded-full shadow-[0_0_4px_rgba(59,130,246,0.6)]"></div>
          </div>
        </div>
        
        <div className="flex flex-col items-center -mt-0.5">
          <span className="text-[10px] font-bold text-gray-600 leading-none">{displayValue}<span className="text-[8px] text-gray-400 ml-0.5">{unit}</span></span>
          <span className="text-[8px] font-bold text-gray-400 uppercase tracking-wider scale-90 origin-top mt-0.5">{label}</span>
        </div>
      </div>
    </Tooltip>
  );
};
