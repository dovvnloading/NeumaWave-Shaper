
import React from 'react';
import { Tooltip } from './Tooltip';

interface NeumorphicButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean;
  icon?: React.ReactNode;
  label?: string;
  round?: boolean;
  tooltip?: string;
}

export const NeumorphicButton: React.FC<NeumorphicButtonProps> = ({ 
  active, 
  icon, 
  label, 
  className = '', 
  round = false,
  tooltip,
  ...props 
}) => {
  const baseStyles = "relative overflow-hidden transition-all duration-200 ease-in-out flex items-center justify-center font-bold text-gray-600 focus:outline-none select-none active:scale-[0.98]";
  
  const shapeStyles = round ? "rounded-full p-2" : "rounded-xl px-3 py-1.5 text-xs";

  // Deeper shadows for a more popped-out look, sharper inset for pressed
  const neumorphicFlat = "bg-[#efeeee] shadow-[3px_3px_6px_#d1d9e6,-3px_-3px_6px_#ffffff] hover:shadow-[4px_4px_8px_#d1d9e6,-4px_-4px_8px_#ffffff]";
  const neumorphicPressed = "bg-[#efeeee] text-blue-600 shadow-[inset_2px_2px_4px_#c8d0e7,inset_-2px_-2px_4px_#ffffff]";

  return (
    <Tooltip content={tooltip} position="right">
      <button
        className={`${baseStyles} ${shapeStyles} ${active ? neumorphicPressed : neumorphicFlat} ${className}`}
        {...props}
      >
        {icon && <span className={label ? "mr-1.5" : ""}>{icon}</span>}
        {label}
        
        {/* Active Indicator Dot */}
        {active && (
          <div className="absolute right-2 top-1/2 -translate-y-1/2 w-1 h-1 bg-blue-500 rounded-full shadow-[0_0_4px_rgba(59,130,246,0.8)]"></div>
        )}
      </button>
    </Tooltip>
  );
};
