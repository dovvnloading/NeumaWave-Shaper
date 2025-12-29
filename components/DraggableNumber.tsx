import React, { useState, useRef, useEffect } from 'react';

interface DraggableNumberProps {
  value: number;
  onChange: (val: number) => void;
  min?: number;
  max?: number;
  className?: string;
  sensitivity?: number; 
}

export const DraggableNumber: React.FC<DraggableNumberProps> = ({ 
  value, 
  onChange, 
  min = 0, 
  max = 999, 
  className = '',
  sensitivity = 4
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [inputValue, setInputValue] = useState(value.toString());
  
  // Use refs for drag state to ensure stability across renders
  const isDraggingRef = useRef(false);
  const startY = useRef<number>(0);
  const startVal = useRef<number>(0);

  useEffect(() => {
    if (!isEditing) {
      setInputValue(value.toString());
    }
  }, [value, isEditing]);

  const handlePointerDown = (e: React.PointerEvent) => {
    if (isEditing) return;
    if (e.button !== 0) return; // Only left click
    
    isDraggingRef.current = true;
    startY.current = e.clientY;
    startVal.current = value;
    
    // Critical: Capture the pointer so we receive events even outside the element
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    
    document.body.style.cursor = 'ns-resize';
    e.preventDefault();
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDraggingRef.current) return;
    
    const delta = startY.current - e.clientY;
    const change = Math.round(delta / sensitivity);
    
    let newValue = startVal.current + change;
    if (min !== undefined) newValue = Math.max(min, newValue);
    if (max !== undefined) newValue = Math.min(max, newValue);
    
    onChange(newValue);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!isDraggingRef.current) return;
    
    isDraggingRef.current = false;
    (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    document.body.style.cursor = '';
  };

  const handleDoubleClick = () => {
    setIsEditing(true);
  };

  const finishEditing = () => {
    setIsEditing(false);
    let newValue = parseFloat(inputValue);
    if (isNaN(newValue)) {
        newValue = value;
    } else {
        if (min !== undefined) newValue = Math.max(min, newValue);
        if (max !== undefined) newValue = Math.min(max, newValue);
    }
    onChange(newValue);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
        finishEditing();
    } else if (e.key === 'Escape') {
        setIsEditing(false);
        setInputValue(value.toString());
    }
  };

  if (isEditing) {
    return (
        <input
            type="number"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onBlur={finishEditing}
            onKeyDown={handleKeyDown}
            className={`outline-none appearance-none m-0 p-0 border-none bg-transparent ${className}`}
            autoFocus
        />
    );
  }

  return (
    <div
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onDoubleClick={handleDoubleClick}
      className={`cursor-ns-resize select-none inline-flex items-center justify-center ${className}`}
      title="Drag to change, Double-click to type"
    >
      {value}
    </div>
  );
};