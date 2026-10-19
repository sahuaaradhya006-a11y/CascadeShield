import React from 'react';
import { Zap, Play, CheckCircle2, ArrowRight, ShieldCheck, Flame, RefreshCw } from 'lucide-react';
import { Scenario, MicroserviceNode } from '../types/simulator';

interface ScenariosViewProps {
  scenarios: Scenario[];
  activeScenarioId: string | null;
  onRunScenario: (scenario: Scenario) => void;
  onClose: () => void;
  nodes: MicroserviceNode[];
  onMitigateNode: (nodeId: string) => void;
}

export const ScenariosView: React.FC<ScenariosViewProps> = ({
  scenarios,
  activeScenarioId,
  onRunScenario,
  onClose,
  nodes,
  onMitigateNode
}) => {
  const nodeMap = new Map(nodes.map(n => [n.id, n]));

  return (
    <div className="bg-[#080d1a] border border-[#1b253b] rounded-lg p-5 text-slate-200 space-y-5">
      <div className="flex items-center justify-between pb-3 border-b border-[#1b253b]">
        <div>
          <h2 className="text-base font-bold text-white font-['Plus_Jakarta_Sans'] flex items-center gap-2">
            <Zap className="w-4 h-4 text-cyan-400" />
            Hackathon Judge Scenario Evaluation Suite
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Test pre-configured failure cascades and 1-click circuit breaker mitigations designed for live judge demonstrations.
          </p>
        </div>
        <button
          onClick={onClose}
          className="px-3 py-1.5 text-xs font-medium rounded bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
        >
          Return to Canvas
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {scenarios.map((scenario, index) => {
          const isSelected = activeScenarioId === scenario.id;
          const targetNode = nodeMap.get(scenario.targetRootNodeId);

          return (
            <div
              key={scenario.id}
              className={`p-4 rounded-lg border transition-all ${
                isSelected
                  ? 'bg-[#0f172a] border-cyan-500 shadow-[0_0_15px_rgba(6,182,212,0.2)]'
                  : 'bg-[#0c1222] border-[#1e2a44] hover:border-slate-600'
              }`}
            >
              <div className="flex items-start justify-between gap-3 mb-2">
                <div>
                  <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800 font-bold tracking-wider">
                    Preset #{index + 1}
                  </span>
                  <h3 className="text-sm font-bold text-white font-['Plus_Jakarta_Sans'] mt-1">
                    {scenario.title}
                  </h3>
                </div>

                <button
                  onClick={() => onRunScenario(scenario)}
                  className="px-3 py-1.5 rounded-md text-xs font-semibold bg-red-600 hover:bg-red-500 text-white flex items-center gap-1.5 shadow-[0_0_10px_rgba(239,68,68,0.3)] transition-all whitespace-nowrap"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  Execute Scenario
                </button>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed mb-3">
                {scenario.description}
              </p>

              <div className="bg-[#060a14] p-2.5 rounded border border-slate-800 text-[11px] font-mono space-y-1 mb-3">
                <div className="text-slate-400 text-[10px] uppercase font-bold">Injected Root Cause:</div>
                <div className="text-red-400">{scenario.rootCauseMessage}</div>
              </div>

              {targetNode && (
                <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-800/80">
                  <span className="text-slate-400 text-[11px]">
                    Root Target: <strong className="text-white">{targetNode.name}</strong>
                  </span>
                  
                  {targetNode.status !== 'healthy' && (
                    <button
                      onClick={() => onMitigateNode(targetNode.id)}
                      className="px-2.5 py-1 text-xs font-semibold rounded bg-emerald-500 hover:bg-emerald-400 text-slate-950 flex items-center gap-1 transition-all"
                    >
                      <ShieldCheck className="w-3.5 h-3.5" />
                      1-Click Mitigate ({targetNode.name})
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
