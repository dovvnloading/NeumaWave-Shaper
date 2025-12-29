
import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';

interface TooltipProps {
  content: string | React.ReactNode;
  children: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
  className?: string;
  delay?: number;
}

export const Tooltip: React.FC<TooltipProps> = ({ 
  content, 
  children, 
  position = 'top', 
  className = '', 
  delay = 300 
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0, height: 0 });
  const triggerRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<number | null>(null);

  if (!content) return <>{children}</>;

  const handleMouseEnter = () => {
    timeoutRef.current = window.setTimeout(() => {
      if (triggerRef.current) {
        const rect = triggerRef.current.getBoundingClientRect();
        const scrollX = window.scrollX;
        const scrollY = window.scrollY;
        
        setCoords({
          top: rect.top + scrollY,
          left: rect.left + scrollX,
          width: rect.width,
          height: rect.height
        });
        setIsVisible(true);
      }
    }, delay);
  };

  const handleMouseLeave = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setIsVisible(false);
  };

  useEffect(() => {
    // Hide tooltip on scroll/resize to prevent detached floating behavior
    const handleScrollOrResize = () => {
        if(isVisible) setIsVisible(false);
    };
    
    window.addEventListener('scroll', handleScrollOrResize, true);
    window.addEventListener('resize', handleScrollOrResize);
    
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      window.removeEventListener('scroll', handleScrollOrResize, true);
      window.removeEventListener('resize', handleScrollOrResize);
    };
  }, [isVisible]);

  // Positioning Logic
  const getPositionStyle = () => {
      const centerX = coords.left + coords.width / 2;
      const centerY = coords.top + coords.height / 2;
      
      switch (position) {
          case 'top': return { top: coords.top - 8, left: centerX };
          case 'bottom': return { top: coords.top + coords.height + 8, left: centerX };
          case 'left': return { top: centerY, left: coords.left - 8 };
          case 'right': return { top: centerY, left: coords.left + coords.width + 8 };
          default: return { top: 0, left: 0 };
      }
  };

  const transformClass = {
      top: '-translate-x-1/2 -translate-y-full',
      bottom: '-translate-x-1/2',
      left: '-translate-x-full -translate-y-1/2',
      right: '-translate-y-1/2'
  };

  const arrowClass = {
    top: 'top-full left-1/2 -translate-x-1/2 border-t-gray-800 border-l-transparent border-r-transparent border-b-transparent',
    bottom: 'bottom-full left-1/2 -translate-x-1/2 border-b-gray-800 border-l-transparent border-r-transparent border-t-transparent',
    left: 'left-full top-1/2 -translate-y-1/2 border-l-gray-800 border-t-transparent border-b-transparent border-r-transparent',
    right: 'right-full top-1/2 -translate-y-1/2 border-r-gray-800 border-t-transparent border-b-transparent border-l-transparent'
  };

  return (
    <>
      <div 
        ref={triggerRef}
        className={`relative flex items-center justify-center ${className}`}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {children}
      </div>
      
      {isVisible && createPortal(
        <div 
            className={`absolute z-[9999] pointer-events-none ${transformClass[position]}`}
            style={getPositionStyle()}
        >
             <div className="animate-in fade-in zoom-in-95 duration-200 relative bg-gray-800/95 backdrop-blur-sm text-gray-100 text-[10px] font-semibold tracking-wide px-2.5 py-1.5 rounded-lg shadow-[0_10px_25px_-5px_rgba(0,0,0,0.3)] border border-white/10 whitespace-nowrap">
                {content}
                <div className={`absolute w-0 h-0 border-[5px] ${arrowClass[position]}`}></div>
             </div>
        </div>,
        document.body
      )}
    </>
  );
};
