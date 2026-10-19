import React from 'react';
import { Play, Zap, ShieldAlert, Sparkles, FastForward, Clock } from 'lucide-react';
import { Scenario } from '../types/simulator';

interface ScenarioBarProps {
  scenarios: Scenario[];
  activeScenarioId: string | null;
  onSelectScenario: (scenario: Scenario) => void;
  onChaosClick: () => void;
  stepByStepMode: boolean;
  setStepByStepMode: (val: boolean) => void;
  isSimulating: boolean;
  onNextHopStep?: () => void;
  hasPendingSteps: boolean;
}

export const ScenarioBar: React.FC<ScenarioBarProps> = ({
  scenarios,
  activeScenarioId,
  onSelectScenario,
  onChaosClick,
  stepByStepMode,
  setStepByStepMode,
  isSimulating,
  onNextHopStep,
  hasPendingSteps
}) => {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-2.5 bg-[#0b1021] border-b border-[#1b253b] text-slate-300">
      {/* Pre-built Scenarios Quick Load */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 mr-1">
          <Zap className="w-3.5 h-3.5 text-cyan-400" />
          Judge Presets:
        </span>

        {scenarios.map((scenario, idx) => {
          const isSelected = activeScenarioId === scenario.id;
          return (
            <button
              key={scenario.id}
              onClick={() => onSelectScenario(scenario)}
              disabled={isSimulating}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all whitespace-nowrap flex items-center gap-1.5 border ${
                isSelected
                  ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/60 shadow-[0_0_12px_rgba(6,182,212,0.3)] font-semibold'
                  : 'bg-slate-900/80 text-slate-300 border-slate-700/80 hover:bg-slate-800 hover:text-white hover:border-slate-600'
              } disabled:opacity-50`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-cyan-400' : 'bg-slate-500'}`} />
              {scenario.shortLabel}
            </button>
          );
        })}

        <button
          onClick={onChaosClick}
          disabled={isSimulating}
          className="px-3 py-1.5 text-xs font-medium rounded-md bg-red-950/40 text-red-300 border border-red-800/60 hover:bg-red-900/50 hover:text-red-200 transition-colors whitespace-nowrap flex items-center gap-1.5 disabled:opacity-50"
          title="Inject random microservice failure"
        >
          <Sparkles className="w-3.5 h-3.5 text-red-400" />
          Chaos Injection
        </button>
      </div>

      {/* Simulation Speed & Stepping Control */}
      <div className="flex items-center gap-3">
        {hasPendingSteps && onNextHopStep && (
          <button
            onClick={onNextHopStep}
            className="px-3 py-1 text-xs font-semibold rounded bg-amber-500 text-slate-950 hover:bg-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.4)] flex items-center gap-1 transition-all"
          >
            <Play className="w-3 h-3 fill-current" />
            Step Next Hop
          </button>
        )}

        <div className="flex items-center gap-1.5 text-xs bg-slate-900/90 border border-slate-800 px-2 py-1 rounded">
          <Clock className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-[11px] text-slate-400">Mode:</span>
          <button
            onClick={() => setStepByStepMode(false)}
            className={`px-2 py-0.5 text-[11px] rounded transition-colors ${
              !stepByStepMode ? 'bg-cyan-500/30 text-cyan-300 font-semibold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Instant
          </button>
          <button
            onClick={() => setStepByStepMode(true)}
            className={`px-2 py-0.5 text-[11px] rounded transition-colors ${
              stepByStepMode ? 'bg-cyan-500/30 text-cyan-300 font-semibold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Animated BFS
          </button>
        </div>
      </div>
    </div>
  );
};
