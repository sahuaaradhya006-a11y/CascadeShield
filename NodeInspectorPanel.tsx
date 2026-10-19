import React from 'react';
import { 
  X, Shield, ShieldCheck, ShieldAlert, AlertTriangle, 
  Flame, RefreshCw, Zap, Server, Activity, ArrowRight, CornerDownRight, Check
} from 'lucide-react';
import { MicroserviceNode, DependencyEdge } from '../types/simulator';

interface NodeInspectorPanelProps {
  node: MicroserviceNode | null;
  edges: DependencyEdge[];
  allNodes: MicroserviceNode[];
  onClose: () => void;
  onToggleFail: (nodeId: string) => void;
  onToggleMitigation: (nodeId: string) => void;
  onHealNode: (nodeId: string) => void;
}

export const NodeInspectorPanel: React.FC<NodeInspectorPanelProps> = ({
  node,
  edges,
  allNodes,
  onClose,
  onToggleFail,
  onToggleMitigation,
  onHealNode
}) => {
  if (!node) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-6 text-center text-slate-500 bg-[#0a0f1d] border border-[#1b253b] rounded-lg">
        <Server className="w-10 h-10 mb-2 text-slate-600 stroke-[1.5]" />
        <p className="text-xs font-medium text-slate-400">Select any microservice node</p>
        <p className="text-[11px] text-slate-500 mt-1 max-w-xs">
          Click a node on the canvas to inspect its upstream callers, downstream dependencies, and trigger circuit breakers.
        </p>
      </div>
    );
  }

  const nodeMap = new Map(allNodes.map(n => [n.id, n]));

  // Services that call this node (upstream callers)
  const incomingCallers = edges
    .filter(e => e.to === node.id)
    .map(e => ({ edge: e, node: nodeMap.get(e.from) }))
    .filter((item): item is { edge: DependencyEdge; node: MicroserviceNode } => Boolean(item.node));

  // Services this node depends on (downstream dependencies)
  const outgoingDependencies = edges
    .filter(e => e.from === node.id)
    .map(e => ({ edge: e, node: nodeMap.get(e.to) }))
    .filter((item): item is { edge: DependencyEdge; node: MicroserviceNode } => Boolean(item.node));

  const isFailed = node.status === 'failed';
  const isDegraded = node.status === 'degraded';
  const isMitigated = node.status === 'mitigated';

  return (
    <div className="h-full flex flex-col bg-[#0a0f1d] border border-[#1b253b] rounded-lg overflow-hidden text-slate-300">
      {/* Inspector Header */}
      <div className="p-3.5 bg-[#0d1426] border-b border-[#1b253b] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={`w-7 h-7 rounded flex items-center justify-center font-bold text-xs ${
            isFailed ? 'bg-red-950 text-red-400 border border-red-800' :
            isDegraded ? 'bg-amber-950 text-amber-400 border border-amber-800' :
            isMitigated ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' :
            'bg-cyan-950 text-cyan-400 border border-cyan-800'
          }`}>
            {node.name.charAt(0)}
          </div>
          <div>
            <h3 className="text-sm font-bold text-white font-['Plus_Jakarta_Sans'] leading-tight">
              {node.name}
            </h3>
            <span className="text-[10px] text-slate-400 font-mono">
              Tier: {node.tier} · {node.cluster}
            </span>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
        {/* Status & Key Metrics */}
        <div className="grid grid-cols-3 gap-2">
          <div className="p-2 bg-[#060a14] rounded border border-slate-800 text-center">
            <div className="text-[10px] text-slate-400 uppercase font-semibold">Status</div>
            <div className={`text-xs font-mono font-bold mt-0.5 ${
              isFailed ? 'text-red-400' : isDegraded ? 'text-amber-400' : isMitigated ? 'text-emerald-400' : 'text-cyan-400'
            }`}>
              {node.status.toUpperCase()}
            </div>
          </div>

          <div className="p-2 bg-[#060a14] rounded border border-slate-800 text-center">
            <div className="text-[10px] text-slate-400 uppercase font-semibold">Latency</div>
            <div className="text-xs font-mono font-bold text-slate-200 mt-0.5 tabular-nums">
              {node.currentLatencyMs}ms
            </div>
          </div>

          <div className="p-2 bg-[#060a14] rounded border border-slate-800 text-center">
            <div className="text-[10px] text-slate-400 uppercase font-semibold">Error Rate</div>
            <div className={`text-xs font-mono font-bold mt-0.5 tabular-nums ${
              node.errorRatePercent > 50 ? 'text-red-400' : node.errorRatePercent > 5 ? 'text-amber-400' : 'text-emerald-400'
            }`}>
              {node.errorRatePercent}%
            </div>
          </div>
        </div>

        {/* SPOF Alert Badge if applicable */}
        {node.isSPOF && (
          <div className="p-2.5 rounded bg-amber-950/30 border border-amber-800/60 text-amber-200">
            <div className="flex items-center gap-1.5 font-bold text-[11px] uppercase tracking-wider text-amber-300">
              <ShieldAlert className="w-3.5 h-3.5" />
              Identified Single Point of Failure (SPOF)
            </div>
            <div className="text-[11px] text-slate-300 mt-1 leading-relaxed">
              {node.spofReason}
            </div>
          </div>
        )}

        {/* Failure reason if offline */}
        {node.failureReason && (
          <div className="p-2.5 rounded bg-red-950/40 border border-red-800/60 text-red-200 font-mono text-[11px]">
            <div className="font-bold text-red-300 uppercase text-[10px] mb-0.5">Failure Diagnostic:</div>
            {node.failureReason}
          </div>
        )}

        {/* Description & Role */}
        <div>
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
            Service Description & Spec
          </div>
          <p className="text-[11px] text-slate-300 leading-relaxed bg-[#060a14] p-2.5 rounded border border-slate-800">
            {node.description}
          </p>
        </div>

        {/* Circuit Breaker & 1-Click Mitigation Section */}
        <div className="p-3 bg-gradient-to-br from-[#0c162d] to-[#070e1c] rounded border border-cyan-800/40">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5 font-semibold text-cyan-300 text-xs">
              <ShieldCheck className="w-4 h-4 text-cyan-400" />
              Circuit Breaker & Fallback Rail
            </div>
            {node.isMitigationActive && (
              <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-950/80 px-1.5 py-0.5 rounded border border-emerald-700">
                ACTIVE
              </span>
            )}
          </div>

          <div className="text-[11px] text-slate-300 mb-2.5">
            <strong className="text-white">{node.mitigationName}</strong>
            <p className="text-slate-400 mt-0.5 leading-snug">{node.mitigationDescription}</p>
          </div>

          <button
            onClick={() => onToggleMitigation(node.id)}
            className={`w-full py-2 px-3 rounded font-semibold text-xs flex items-center justify-center gap-2 transition-all ${
              node.isMitigationActive
                ? 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-600'
                : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-[0_0_12px_rgba(16,185,129,0.35)]'
            }`}
          >
            {node.isMitigationActive ? (
              <>
                <RefreshCw className="w-3.5 h-3.5" />
                Deactivate Fallback (Return to Primary)
              </>
            ) : (
              <>
                <ShieldCheck className="w-3.5 h-3.5 fill-current" />
                Trip Circuit Breaker / Activate Backup Rail
              </>
            )}
          </button>
        </div>

        {/* Upstream Callers & Downstream Dependencies */}
        <div className="space-y-3">
          {/* Callers */}
          <div>
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
              Dependent Services (Who Calls {node.name})
            </div>
            {incomingCallers.length === 0 ? (
              <div className="text-[11px] text-slate-500 italic p-1.5 bg-[#060a14] rounded">
                No direct callers (Entry layer)
              </div>
            ) : (
              <div className="space-y-1">
                {incomingCallers.map(({ edge, node: caller }) => (
                  <div key={edge.id} className="flex items-center justify-between p-1.5 rounded bg-[#060a14] border border-slate-800 text-[11px]">
                    <div className="flex items-center gap-1.5">
                      <span className={`w-2 h-2 rounded-full ${
                        caller.status === 'failed' ? 'bg-red-400' :
                        caller.status === 'degraded' ? 'bg-amber-400' : 'bg-cyan-400'
                      }`} />
                      <span className="font-medium text-slate-200">{caller.name}</span>
                    </div>
                    <span className="text-[10px] font-mono text-slate-400">
                      {edge.label} ({edge.type})
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Dependencies */}
          <div>
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
              Callee Dependencies (Who {node.name} Relies On)
            </div>
            {outgoingDependencies.length === 0 ? (
              <div className="text-[11px] text-slate-500 italic p-1.5 bg-[#060a14] rounded">
                No outbound dependencies (Terminal layer)
              </div>
            ) : (
              <div className="space-y-1">
                {outgoingDependencies.map(({ edge, node: dep }) => (
                  <div key={edge.id} className="flex items-center justify-between p-1.5 rounded bg-[#060a14] border border-slate-800 text-[11px]">
                    <div className="flex items-center gap-1.5">
                      <span className={`w-2 h-2 rounded-full ${
                        dep.status === 'failed' ? 'bg-red-400' :
                        dep.status === 'degraded' ? 'bg-amber-400' : 'bg-cyan-400'
                      }`} />
                      <span className="font-medium text-slate-200">{dep.name}</span>
                    </div>
                    <span className="text-[10px] font-mono text-slate-400">
                      {edge.label} ({edge.type})
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-2 border-t border-slate-800 flex items-center gap-2">
          {node.status !== 'healthy' ? (
            <button
              onClick={() => onHealNode(node.id)}
              className="flex-1 py-1.5 text-xs font-semibold rounded bg-cyan-600 hover:bg-cyan-500 text-white transition-colors flex items-center justify-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Heal Node to 100%
            </button>
          ) : (
            <button
              onClick={() => onToggleFail(node.id)}
              className="flex-1 py-1.5 text-xs font-semibold rounded bg-red-600/90 hover:bg-red-600 text-white transition-colors flex items-center justify-center gap-1.5"
            >
              <Flame className="w-3.5 h-3.5" />
              Simulate Node Crash (BFS)
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
