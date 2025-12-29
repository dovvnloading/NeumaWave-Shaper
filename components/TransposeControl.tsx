import React from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';

interface TransposeControlProps {
  value: number; // Octaves
  onChange: (val: number) => void;
  className?: string;
}

export const TransposeControl: React.FC<TransposeControlProps> = ({ value, onChange, className = '' }) => {
  
  const handleUp = () => {
    if (value < 3) onChange(value + 1); // Max +3 octaves
  };

  const handleDown = () => {
    if (value > -3) onChange(value - 1); // Min -3 octaves
  };

  return (
    <div className={`flex flex-col items-center justify-between h-full py-1 ${className}`}>
        {/* Up Button */}
        <button 
            onClick={handleUp}
            className="w-10 h-8 rounded-t-lg rounded-b-sm bg-[#efeeee] shadow-[3px_3px_6px_#d1d9e6,-3px_-3px_6px_#ffffff] active:shadow-[inset_2px_2px_4px_#d1d9e6,inset_-2px_-2px_4px_#ffffff] flex items-center justify-center text-gray-500 hover:text-blue-500 transition-colors"
        >
            <ChevronUp size={16} />
        </button>

        {/* Display */}
        <div className="flex-1 w-10 mx-1 my-1 rounded-sm bg-[#efeeee] shadow-[inset_2px_2px_4px_#d1d9e6,inset_-2px_-2px_4px_#ffffff] flex items-center justify-center">
            <span className={`text-sm font-bold font-mono ${value === 0 ? 'text-gray-400' : 'text-blue-500'}`}>
                {value > 0 ? `+${value}` : value}
            </span>
        </div>

        {/* Down Button */}
        <button 
            onClick={handleDown}
            className="w-10 h-8 rounded-b-lg rounded-t-sm bg-[#efeeee] shadow-[3px_3px_6px_#d1d9e6,-3px_-3px_6px_#ffffff] active:shadow-[inset_2px_2px_4px_#d1d9e6,inset_-2px_-2px_4px_#ffffff] flex items-center justify-center text-gray-500 hover:text-blue-500 transition-colors"
        >
            <ChevronDown size={16} />
        </button>
        
        <span className="text-[9px] font-bold text-gray-400 tracking-widest mt-2">OCTAVE</span>
    </div>
  );
};