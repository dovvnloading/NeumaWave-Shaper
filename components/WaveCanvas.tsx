
import React, { useRef, useEffect, useState, useCallback } from 'react';
import { WAVE_SAMPLES } from '../constants';
import * as WaveMath from '../utils/waveMath';
import { 
  Wand2, RotateCcw, ArrowLeftRight, FlipVertical, 
  Maximize, Activity, Zap, Wind, 
  Waves, Gauge, BoxSelect, Scissors, 
  FoldVertical, CheckSquare
} from 'lucide-react';
import { Tooltip } from './Tooltip';

interface WaveCanvasProps {
  samples: number[];
  onWaveChange: (samples: number[]) => void;
  isPlaying: boolean;
  analyserNode: AnalyserNode | null;
  color?: string;
}

export const WaveCanvas: React.FC<WaveCanvasProps> = ({ samples, onWaveChange, isPlaying, analyserNode }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const localWaveData = useRef<number[]>([...samples]);
  const lastPos = useRef<{x: number, y: number} | null>(null);
  
  // Context Menu State
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);
  
  // Logical dimensions (CSS pixels)
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    // Only update local data from props if NOT currently drawing to prevent fighting/jitter
    if (!isDrawing) {
        localWaveData.current = [...samples];
    }
  }, [samples, isDrawing]);

  // Handle High DPI Canvas Scaling
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        // Get logical size
        const { width, height } = entry.contentRect;
        setDimensions({ width, height });
      }
    });
    
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  // Update canvas resolution whenever dimensions change
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || dimensions.width === 0) return;

    const dpr = window.devicePixelRatio || 1;
    
    // Set actual render size (physical pixels)
    canvas.width = dimensions.width * dpr;
    canvas.height = dimensions.height * dpr;
    
    // Scale context to match logical coordinate system
    const ctx = canvas.getContext('2d');
    if (ctx) {
        ctx.scale(dpr, dpr);
    }
  }, [dimensions]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || dimensions.width === 0) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { width, height } = dimensions;

    // Clear (using logical coords)
    ctx.clearRect(0, 0, width, height);

    // --- Background ---
    ctx.fillStyle = '#efeeee';
    ctx.fillRect(0, 0, width, height);

    // --- Grid System (Pressed / Inset Look) ---
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 6]); // Dashed for technical feel
    
    // Vertical Lines
    ctx.beginPath();
    ctx.strokeStyle = 'rgba(163, 177, 198, 0.3)'; // Darker part of inset
    for (let i = 1; i < 8; i++) {
        const x = (width / 8) * i;
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
    }
    ctx.stroke();

    // Horizontal Lines
    ctx.beginPath();
    for (let i = 1; i < 4; i++) {
        const y = (height / 4) * i;
        if (i !== 2) { // Skip center
            ctx.moveTo(0, y);
            ctx.lineTo(width, y);
        }
    }
    ctx.stroke();
    
    // Zero Crossing (Stronger Inset)
    ctx.beginPath();
    ctx.setLineDash([]);
    ctx.lineWidth = 2;
    ctx.strokeStyle = 'rgba(163, 177, 198, 0.4)';
    ctx.moveTo(0, height / 2);
    ctx.lineTo(width, height / 2);
    ctx.stroke();
    
    // Add light highlight to grid lines for "engraved" look (optional, keeping clean for now)

    // --- Waveform Path Construction ---
    const getX = (i: number) => (i / (WAVE_SAMPLES - 1)) * width;
    const amplitudeScale = (height / 2) * 0.85; // Keep away from edges
    const getY = (val: number) => (height / 2) - (val * amplitudeScale);

    const path = new Path2D();
    path.moveTo(getX(0), getY(localWaveData.current[0]));

    // Quadratic curve interpolation for fluidity
    for (let i = 0; i < WAVE_SAMPLES - 1; i++) {
      const pCurrentX = getX(i);
      const pCurrentY = getY(localWaveData.current[i]);
      
      const pNextX = getX(i + 1);
      const pNextY = getY(localWaveData.current[i + 1]);

      const midX = (pCurrentX + pNextX) / 2;
      const midY = (pCurrentY + pNextY) / 2;
      
      path.quadraticCurveTo(pCurrentX, pCurrentY, midX, midY);
    }
    
    const lastX = getX(WAVE_SAMPLES - 1);
    const lastY = getY(localWaveData.current[WAVE_SAMPLES - 1]);
    path.lineTo(lastX, lastY);

    // --- EXTRUDED NEUMORPHIC RENDERING ---
    // The goal is a tube-like shape protruding from the screen.
    
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    const TUBE_WIDTH = 14;

    // 1. Cast Shadow (Bottom-Right) - Lifts the object
    ctx.save();
    ctx.translate(6, 6);
    ctx.strokeStyle = '#d1d9e6'; // Dark shadow
    ctx.lineWidth = TUBE_WIDTH;
    ctx.filter = 'blur(5px)';
    ctx.stroke(path);
    ctx.restore();

    // 2. Cast Highlight (Top-Left) - Cancels shadow, adds ambient light
    ctx.save();
    ctx.translate(-6, -6);
    ctx.strokeStyle = '#ffffff'; // Light shadow
    ctx.lineWidth = TUBE_WIDTH;
    ctx.filter = 'blur(5px)';
    ctx.stroke(path);
    ctx.restore();

    // 3. The Physical Body (Matches Background)
    // This draws the "solid" part of the tube
    ctx.save();
    ctx.strokeStyle = '#efeeee';
    ctx.lineWidth = TUBE_WIDTH;
    ctx.stroke(path);
    ctx.restore();

    // 4. Volume/Curvature Shading
    // Top-Left Specular Ridge (Shiny Plastic look)
    ctx.save();
    ctx.translate(-2, -2);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)'; // Sharp highlight
    ctx.lineWidth = 3; // Thinner than body
    ctx.filter = 'blur(1px)';
    ctx.stroke(path);
    ctx.restore();

    // Bottom-Right Ambient Occlusion (Soft shadow on the tube itself)
    ctx.save();
    ctx.translate(2, 2);
    ctx.strokeStyle = 'rgba(163, 177, 198, 0.5)'; // Soft shade
    ctx.lineWidth = 3;
    ctx.filter = 'blur(2px)';
    ctx.stroke(path);
    ctx.restore();

    // 5. Core Filament (The "Signal")
    // A thin line inside the tube to give it a "tech" feel and color accent
    ctx.save();
    const grad = ctx.createLinearGradient(0, 0, width, 0);
    grad.addColorStop(0, '#3b82f6');
    grad.addColorStop(0.5, '#60a5fa');
    grad.addColorStop(1, '#3b82f6');
    
    ctx.strokeStyle = grad;
    ctx.lineWidth = 1.5;
    ctx.globalAlpha = 0.8;
    ctx.stroke(path);
    ctx.restore();

    // --- Cursor / Interaction ---
    if (lastPos.current) {
         ctx.save();
         
         if (isDrawing) {
            // Active Drawing Cursor (Glowing Orb)
            ctx.shadowColor = '#3b82f6';
            ctx.shadowBlur = 15;
            
            ctx.beginPath();
            ctx.arc(lastPos.current.x, lastPos.current.y, 6, 0, Math.PI * 2);
            ctx.fillStyle = '#3b82f6';
            ctx.fill();
            
            // Inner white dot
            ctx.beginPath();
            ctx.arc(lastPos.current.x, lastPos.current.y, 2, 0, Math.PI * 2);
            ctx.fillStyle = '#ffffff';
            ctx.fill();
         } else {
             // Hover Cursor (Reticle)
             ctx.shadowColor = 'rgba(59,130,246,0.5)';
             ctx.shadowBlur = 5;
             ctx.strokeStyle = '#3b82f6';
             ctx.lineWidth = 1.5;
             
             // Circle
             ctx.beginPath();
             ctx.arc(lastPos.current.x, lastPos.current.y, 8, 0, Math.PI * 2);
             ctx.stroke();
             
             // Crosshairs
             ctx.beginPath();
             ctx.moveTo(lastPos.current.x - 12, lastPos.current.y);
             ctx.lineTo(lastPos.current.x - 4, lastPos.current.y);
             ctx.moveTo(lastPos.current.x + 4, lastPos.current.y);
             ctx.lineTo(lastPos.current.x + 12, lastPos.current.y);
             ctx.moveTo(lastPos.current.x, lastPos.current.y - 12);
             ctx.lineTo(lastPos.current.x, lastPos.current.y - 4);
             ctx.moveTo(lastPos.current.x, lastPos.current.y + 4);
             ctx.lineTo(lastPos.current.x, lastPos.current.y + 12);
             ctx.stroke();

             // Center dot
             ctx.fillStyle = '#3b82f6';
             ctx.beginPath();
             ctx.arc(lastPos.current.x, lastPos.current.y, 1.5, 0, Math.PI * 2);
             ctx.fill();
         }
         
         ctx.restore();
    }

    // --- Real-time Oscilloscope Overlay ---
    // Drawn ON TOP of the extruded wave, perhaps as a glowing ghost projection
    if (isPlaying && analyserNode) {
      const bufferLength = analyserNode.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      analyserNode.getByteTimeDomainData(dataArray);

      ctx.save();
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.5)'; // Cyan ghost
      ctx.lineWidth = 2;
      ctx.shadowColor = '#38bdf8';
      ctx.shadowBlur = 10;
      
      // Dashed line for the real-time view to differentiate from the editable shape
      ctx.setLineDash([2, 2]);

      const sliceWidth = width / bufferLength;
      let x = 0;
      
      for (let i = 0; i < bufferLength; i++) {
        const v = dataArray[i] / 128.0;
        const y = v * (height / 2); 

        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
        
        x += sliceWidth;
      }
      ctx.stroke();
      ctx.restore();
    }

  }, [dimensions, isPlaying, analyserNode, isDrawing]);

  // Animation Loop
  useEffect(() => {
    let animationId: number;
    const render = () => {
      draw();
      animationId = requestAnimationFrame(render);
    };
    render();
    return () => cancelAnimationFrame(animationId);
  }, [draw]);
  
  // Context Menu Handler
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    // Position relative to container
    // Shift slightly to right/down to avoid cursor overlap
    let x = e.clientX - rect.left + 5;
    let y = e.clientY - rect.top + 5;
    
    // Bounds Check (Simple)
    if (x > rect.width - 180) x = rect.width - 180;
    if (y > rect.height - 300) y = rect.height - 300;

    setContextMenu({ x, y });
  };
  
  // Close menu on global click
  useEffect(() => {
    const handleClick = () => setContextMenu(null);
    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, []);

  const applyGen = (fn: () => number[]) => {
    const newData = fn();
    localWaveData.current = newData;
    onWaveChange([...newData]);
  };

  const applyMod = (fn: (d: number[]) => number[]) => {
    const newData = fn([...localWaveData.current]);
    localWaveData.current = newData;
    onWaveChange([...newData]);
  };

  // Input Handling
  const getCanvasCoords = (e: React.PointerEvent) => {
      const canvas = canvasRef.current;
      if (!canvas) return { x: 0, y: 0 };
      const rect = canvas.getBoundingClientRect();
      return {
          x: e.clientX - rect.left,
          y: e.clientY - rect.top
      };
  };

  const updateWaveData = (mouseX: number, mouseY: number, width: number, height: number) => {
    const amplitudeScale = (height / 2) * 0.85;
    
    // x -> index
    const index = Math.floor((mouseX / width) * (WAVE_SAMPLES - 1));
    
    // y -> value (-1 to 1)
    const val = (height / 2 - mouseY) / amplitudeScale;
    const clampedVal = Math.max(-1, Math.min(1, val));

    if (index >= 0 && index < WAVE_SAMPLES) {
        localWaveData.current[index] = clampedVal;
    }
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0) return; // Only draw on left click
    
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (canvas) canvas.setPointerCapture(e.pointerId);
    
    const { x, y } = getCanvasCoords(e);
    lastPos.current = { x, y };
    
    updateWaveData(x, y, dimensions.width, dimensions.height);
    onWaveChange([...localWaveData.current]);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    const { x, y } = getCanvasCoords(e);
    
    if (isDrawing) {
        // Linear Interpolation for drawing speed
        if (lastPos.current) {
            const dx = x - lastPos.current.x;
            const dy = y - lastPos.current.y;
            const dist = Math.sqrt(dx*dx + dy*dy);
            const steps = Math.ceil(dist); 

            for (let i = 0; i <= steps; i++) {
                const t = i / steps;
                const curX = lastPos.current.x + dx * t;
                const curY = lastPos.current.y + dy * t;
                updateWaveData(curX, curY, dimensions.width, dimensions.height);
            }
        } else {
            updateWaveData(x, y, dimensions.width, dimensions.height);
        }
        onWaveChange([...localWaveData.current]);
    }
    
    // Always update position for cursor visual
    lastPos.current = { x, y };
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    setIsDrawing(false);
    // Don't nullify lastPos here to keep cursor visible after release
    const canvas = canvasRef.current;
    if (canvas) canvas.releasePointerCapture(e.pointerId);
  };

  const handlePointerLeave = (e: React.PointerEvent) => {
    if (!isDrawing) {
      lastPos.current = null;
    }
  };

  return (
    <div 
        ref={containerRef} 
        className="w-full h-full relative cursor-none"
        onContextMenu={handleContextMenu}
    >
      <canvas
        ref={canvasRef}
        className="block touch-none active:cursor-none"
        style={{ width: '100%', height: '100%' }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerLeave}
      />

      {/* Context Menu Overlay */}
      {contextMenu && (
        <div 
            style={{ top: contextMenu.y, left: contextMenu.x }}
            className="absolute z-50 bg-[#efeeee] rounded-2xl shadow-[6px_6px_12px_#c8d0e7,-6px_-6px_12px_#ffffff] border border-white/50 p-2 min-w-[200px] flex flex-col gap-1 origin-top-left animate-in fade-in zoom-in-95 duration-100 cursor-default"
            onPointerDown={(e) => e.stopPropagation()} // Prevent drawing when clicking menu
        >
            {/* Generators */}
            <div className="text-[9px] font-bold text-gray-400 uppercase tracking-widest px-2 py-1 flex items-center gap-1">
                <Wand2 size={10} /> GENERATE
            </div>
            <div className="grid grid-cols-2 gap-2 mb-2">
                <MenuItem icon={<Activity size={14}/>} label="SINE" onClick={() => applyGen(WaveMath.generateSine)} tooltip="Pure fundamental tone" />
                <MenuItem icon={<Zap size={14}/>} label="TRI" onClick={() => applyGen(WaveMath.generateTriangle)} tooltip="Odd harmonics, bright" />
                <MenuItem icon={<BoxSelect size={14}/>} label="SQR" onClick={() => applyGen(WaveMath.generateSquare)} tooltip="Odd harmonics, hollow" />
                <MenuItem icon={<Activity size={14} className="scale-y-[-1]"/>} label="SAW" onClick={() => applyGen(WaveMath.generateSaw)} tooltip="All harmonics, rich" />
                <MenuItem icon={<Wind size={14}/>} label="NOISE" onClick={() => applyGen(WaveMath.generateNoise)} tooltip="Random chaotic signal" />
                <MenuItem icon={<Activity size={14}/>} label="PULSE" onClick={() => applyGen(WaveMath.generatePulse)} tooltip="Narrow square wave" />
            </div>

            <div className="h-[1px] bg-gray-300/30 mx-2 my-1"></div>

            {/* Modifiers */}
            <div className="text-[9px] font-bold text-gray-400 uppercase tracking-widest px-2 py-1 flex items-center gap-1">
                <Scissors size={10} /> MODIFY
            </div>
            <MenuItem icon={<Maximize size={14}/>} label="NORMALIZE" onClick={() => applyMod(WaveMath.normalize)} tooltip="Maximize amplitude" />
            <MenuItem icon={<Waves size={14}/>} label="SMOOTH" onClick={() => applyMod(WaveMath.smooth)} tooltip="Remove sharp edges" />
            <MenuItem icon={<FlipVertical size={14}/>} label="INVERT" onClick={() => applyMod(WaveMath.invert)} tooltip="Flip phase" />
            <MenuItem icon={<ArrowLeftRight size={14}/>} label="REVERSE" onClick={() => applyMod(WaveMath.reverse)} tooltip="Play backwards" />
            
            <div className="h-[1px] bg-gray-300/30 mx-2 my-1"></div>

            {/* FX */}
             <div className="text-[9px] font-bold text-gray-400 uppercase tracking-widest px-2 py-1 flex items-center gap-1">
                <Gauge size={10} /> PROCESS
            </div>
            <MenuItem icon={<Gauge size={14}/>} label="DRIVE" onClick={() => applyMod(WaveMath.drive)} tooltip="Soft saturation" />
            <MenuItem icon={<FoldVertical size={14}/>} label="FOLD" onClick={() => applyMod(WaveMath.fold)} tooltip="Wavefolding distortion" />
            <MenuItem icon={<CheckSquare size={14}/>} label="QUANTIZE" onClick={() => applyMod(WaveMath.quantize)} tooltip="Bitcrush effect" />
            
        </div>
      )}
    </div>
  );
};

// Helper Component for Menu Items
const MenuItem: React.FC<{ icon: React.ReactNode, label: string, onClick: () => void, tooltip?: string }> = ({ icon, label, onClick, tooltip }) => (
    <Tooltip content={tooltip} position="right">
        <button 
            onClick={onClick}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold text-gray-600 hover:text-blue-500 hover:bg-[#efeeee] hover:shadow-[inset_2px_2px_4px_#d1d9e6,inset_-2px_-2px_4px_#ffffff] transition-all text-left group"
        >
            <span className="text-gray-400 group-hover:text-blue-500 transition-colors">{icon}</span>
            {label}
        </button>
    </Tooltip>
);