import React, { useState } from 'react';
import { HelpCircle, ChevronUp, ChevronDown, Zap, GitBranch, ShieldCheck, X } from 'lucide-react';

interface HowToDemoBannerProps {
  onDismiss?: () => void;
}

export const HowToDemoBanner: React.FC<HowToDemoBannerProps> = ({ onDismiss }) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(true);

  if (!isExpanded) {
    return (
      <div className="px-6 py-1.5 bg-[#080d1a] border-b border-[#1b253b] flex items-center justify-between text-xs text-slate-400">
        <button
          onClick={() => setIsExpanded(true)}
          className="flex items-center gap-1.5 text-cyan-400 hover:text-cyan-300 font-medium transition-colors"
        >
          <HelpCircle className="w-3.5 h-3.5" />
          <span>Show 30-Second Judge Demo Guide</span>
          <ChevronDown className="w-3.5 h-3.5" />
        </button>
        <span className="text-[11px] text-slate-500 font-mono">
          Hackathon Project: CascadeShield (PS-03)
        </span>
      </div>
    );
  }

  return (
    <div className="px-6 py-2.5 bg-gradient-to-r from-[#081124] via-[#09152e] to-[#081124] border-b border-cyan-900/40 text-slate-200 relative">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
          <span className="text-xs font-bold text-white uppercase tracking-wider font-['Plus_Jakarta_Sans'] flex items-center gap-1.5">
            <HelpCircle className="w-3.5 h-3.5 text-cyan-400" />
            30-Second Judge Quickstart Guide
          </span>
          <span className="text-[10px] text-cyan-400/80 font-mono bg-cyan-950/70 border border-cyan-800/60 px-1.5 py-0.2 rounded font-semibold">
            PS-03 Prototype
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsExpanded(false)}
            className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-slate-200 transition-colors"
          >
            <span>Hide Guide</span>
            <ChevronUp className="w-3.5 h-3.5" />
          </button>
          {onDismiss && (
            <button
              onClick={onDismiss}
              className="text-slate-500 hover:text-slate-300 transition-colors ml-1"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
        {/* Step 1 */}
        <div className="flex items-start gap-2.5 bg-[#060c1c]/80 p-2.5 rounded border border-cyan-950">
          <div className="w-5 h-5 rounded bg-cyan-950 text-cyan-400 font-mono font-bold text-[11px] flex items-center justify-center shrink-0 border border-cyan-800/80">
            1
          </div>
          <div>
            <div className="font-semibold text-white flex items-center gap-1">
              <Zap className="w-3 h-3 text-cyan-400" />
              Pick a Preset Scenario
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">
              Click <strong className="text-slate-300">Scenario 1</strong> (Payment Outage) or <strong className="text-amber-300">Scenario 4</strong> (DB Replication Lag) in the bar above.
            </p>
          </div>
        </div>

        {/* Step 2 */}
        <div className="flex items-start gap-2.5 bg-[#060c1c]/80 p-2.5 rounded border border-cyan-950">
          <div className="w-5 h-5 rounded bg-amber-950 text-amber-400 font-mono font-bold text-[11px] flex items-center justify-center shrink-0 border border-amber-800/80">
            2
          </div>
          <div>
            <div className="font-semibold text-white flex items-center gap-1">
              <GitBranch className="w-3 h-3 text-amber-400" />
              Observe BFS Propagation
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">
              Watch the animated failure wave travel across 10 microservices and read the live Hop-by-Hop log in the terminal.
            </p>
          </div>
        </div>

        {/* Step 3 */}
        <div className="flex items-start gap-2.5 bg-[#060c1c]/80 p-2.5 rounded border border-cyan-950">
          <div className="w-5 h-5 rounded bg-emerald-950 text-emerald-400 font-mono font-bold text-[11px] flex items-center justify-center shrink-0 border border-emerald-800/80">
            3
          </div>
          <div>
            <div className="font-semibold text-white flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-emerald-400" />
              1-Click Mitigation Recovery
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">
              Click <strong className="text-emerald-300">"1-Click Mitigate All"</strong> (top-right) or trip the circuit breaker on the node to instantly reroute traffic and restore to 0%.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
