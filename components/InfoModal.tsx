
import React from 'react';
import { X as CloseIcon, Github, Globe, User, ExternalLink } from 'lucide-react';

interface InfoModalProps {
  onClose: () => void;
}

export const InfoModal: React.FC<InfoModalProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#efeeee]/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-sm bg-[#efeeee] rounded-3xl shadow-[20px_20px_60px_#c8d0e7,-20px_-20px_60px_#ffffff] border border-white/40 p-6 flex flex-col gap-6" 
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Header */}
        <div className="flex items-center justify-between pl-2">
           <h2 className="text-lg font-black text-gray-700 tracking-tighter flex items-center gap-2">
              <span className="text-gray-400 font-normal tracking-widest text-xs uppercase">About</span>
              <span>NEUMA<span className="text-blue-500">WAVE</span></span>
           </h2>
           <button 
             onClick={onClose}
             className="w-10 h-10 rounded-full bg-[#efeeee] shadow-[5px_5px_10px_#d1d9e6,-5px_-5px_10px_#ffffff] flex items-center justify-center text-gray-500 hover:text-red-500 transition-all active:shadow-[inset_2px_2px_5px_#d1d9e6,inset_-2px_-2px_5px_#ffffff] active:scale-95"
           >
             <CloseIcon size={20} />
           </button>
        </div>

        {/* Developer Profile */}
        <div className="flex flex-col items-center gap-3 py-2">
            <div className="relative">
                <div className="w-28 h-28 rounded-full bg-[#efeeee] shadow-[inset_6px_6px_12px_#d1d9e6,inset_-6px_-6px_12px_#ffffff] flex items-center justify-center text-gray-300">
                    <User size={56} strokeWidth={1.5} />
                </div>
                {/* Status Dot */}
                <div className="absolute bottom-1 right-2 w-6 h-6 rounded-full bg-[#efeeee] shadow-[2px_2px_4px_#d1d9e6,-2px_-2px_4px_#ffffff] flex items-center justify-center">
                    <div className="w-3 h-3 bg-blue-500 rounded-full shadow-[0_0_8px_rgba(59,130,246,0.8)]"></div>
                </div>
            </div>
            
            <div className="text-center mt-2">
                <div className="text-[9px] font-bold text-blue-500 uppercase tracking-widest mb-1 bg-blue-100/50 px-2 py-0.5 rounded-full inline-block border border-blue-200/50">Lead Developer</div>
                <h3 className="text-xl font-black text-gray-700">Matthew Robert Wesney</h3>
                <p className="text-xs font-bold text-gray-400 mt-1">Audio Software Engineer</p>
            </div>
        </div>

        {/* Social Links Stack */}
        <div className="flex flex-col gap-3">
             <CreditLink 
                href="https://dovvnloading.github.io/" 
                icon={<Globe size={18} />} 
                label="Personal Webpage" 
                sublabel="Portfolio & Projects"
                color="text-blue-500"
                bgColor="bg-blue-100/50"
             />

             <CreditLink 
                href="https://github.com/dovvnloading" 
                icon={<Github size={18} />} 
                label="Github" 
                sublabel="@dovvnloading"
                color="text-gray-700"
                bgColor="bg-gray-200/50"
             />

             <CreditLink 
                href="https://x.com/D3VAUX" 
                icon={<span className="font-black text-sm">X</span>} 
                label="X (Twitter)" 
                sublabel="@D3VAUX"
                color="text-black"
                bgColor="bg-gray-300/50"
             />
        </div>
        
        {/* Footer */}
        <div className="text-center pt-2 border-t border-gray-200/50">
             <p className="text-[9px] font-bold text-gray-400/50">
                v1.2.0 • BUILT WITH REACT 19 & WEB AUDIO API
             </p>
        </div>

      </div>
    </div>
  );
};

// Helper component for uniform links
const CreditLink = ({ href, icon, label, sublabel, color, bgColor }: any) => (
    <a href={href} target="_blank" rel="noopener noreferrer" className="block group outline-none">
        <div className="flex items-center justify-between px-4 py-3 rounded-2xl bg-[#efeeee] shadow-[5px_5px_10px_#d1d9e6,-5px_-5px_10px_#ffffff] hover:translate-y-[-2px] hover:shadow-[7px_7px_14px_#d1d9e6,-7px_-7px_14px_#ffffff] transition-all active:shadow-[inset_2px_2px_4px_#d1d9e6,inset_-2px_-2px_4px_#ffffff] active:translate-y-0 duration-200">
            <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-xl ${bgColor} flex items-center justify-center ${color} shadow-sm group-hover:scale-110 transition-transform duration-300`}>
                    {icon}
                </div>
                <div className="flex flex-col">
                    <span className="text-xs font-black text-gray-600 group-hover:text-blue-500 transition-colors">{label}</span>
                    <span className="text-[10px] font-bold text-gray-400">{sublabel}</span>
                </div>
            </div>
            <div className="w-8 h-8 rounded-full bg-[#efeeee] shadow-[inset_2px_2px_4px_#d1d9e6,inset_-2px_-2px_4px_#ffffff] flex items-center justify-center text-gray-300 group-hover:text-blue-500 transition-colors">
                 <ExternalLink size={14} />
            </div>
        </div>
     </a>
);
