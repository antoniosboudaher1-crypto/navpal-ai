
import React from 'react';
import { Mic, MicOff, Sparkles, Radio } from 'lucide-react';

interface OrbitalAssistantProps {
  isActive: boolean;
  state: 'idle' | 'listening' | 'thinking' | 'speaking';
  onClick: () => void;
}

const OrbitalAssistant: React.FC<OrbitalAssistantProps> = ({ isActive, state, onClick }) => {
  
  // Determine ring colors and animations based on state
  const getRingStyles = () => {
    switch (state) {
      case 'listening':
        return {
          outer: 'border-purple-500/30 animate-[spin_3s_linear_infinite]',
          middle: 'border-indigo-500/50 animate-[spin_2s_linear_infinite_reverse]',
          inner: 'bg-purple-500 animate-pulse',
          glow: 'shadow-[0_0_30px_rgba(168,85,247,0.6)]'
        };
      case 'thinking':
        return {
          outer: 'border-blue-400/30 animate-[spin_1s_linear_infinite]',
          middle: 'border-cyan-400/50 animate-[spin_1.5s_linear_infinite]',
          inner: 'bg-blue-500 animate-ping',
          glow: 'shadow-[0_0_30px_rgba(59,130,246,0.6)]'
        };
      case 'speaking':
        return {
          outer: 'border-green-400/30 animate-pulse',
          middle: 'border-emerald-400/50 scale-110 transition-transform duration-300',
          inner: 'bg-green-500 animate-wave', // custom wave animation
          glow: 'shadow-[0_0_40px_rgba(34,197,94,0.6)]'
        };
      default: // idle
        return {
          outer: 'border-slate-600/30',
          middle: 'border-slate-700/50',
          inner: 'bg-slate-700',
          glow: 'shadow-none hover:shadow-[0_0_20px_rgba(255,255,255,0.2)]'
        };
    }
  };

  const styles = getRingStyles();

  return (
    <button 
      onClick={onClick}
      className={`relative w-16 h-16 flex items-center justify-center transition-all duration-500 group ${isActive ? 'scale-110' : 'hover:scale-105'}`}
      title={isActive ? "Disconnect MyPal" : "Hey MyPal"}
    >
      {/* Outer Orbital Ring */}
      <div className={`absolute inset-0 rounded-full border-2 border-dashed transition-all duration-500 ${styles.outer}`} />
      
      {/* Middle Ring */}
      <div className={`absolute inset-2 rounded-full border border-solid transition-all duration-500 ${styles.middle}`} />
      
      {/* Core Orb */}
      <div className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${styles.inner} ${styles.glow}`}>
        {state === 'speaking' ? (
           <div className="flex gap-0.5 h-3 items-center">
              {[1,2,3].map(i => (
                <div key={i} className="w-1 bg-white rounded-full animate-wave" style={{ animationDelay: `${i * 0.1}s`, height: '100%' }} />
              ))}
           </div>
        ) : state === 'thinking' ? (
           <Sparkles className="w-5 h-5 text-white animate-spin" />
        ) : state === 'listening' ? (
           <Radio className="w-5 h-5 text-white" />
        ) : (
           <Mic className="w-5 h-5 text-slate-300 group-hover:text-white" />
        )}
      </div>

      {/* Status Label (Floating) */}
      {isActive && (
        <div className="absolute -bottom-8 whitespace-nowrap bg-black/50 backdrop-blur-md px-2 py-1 rounded-lg border border-white/10 text-[10px] font-mono text-purple-300 uppercase tracking-wider animate-fade-in">
          {state.toUpperCase()}
        </div>
      )}
    </button>
  );
};

export default OrbitalAssistant;
