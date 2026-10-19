import React from 'react';
import { Shield, ShieldAlert, CheckCircle2, AlertTriangle, XCircle, ArrowUpRight, Zap } from 'lucide-react';
import { MicroserviceNode, DependencyEdge } from '../types/simulator';

interface ArchitectureMatrixViewProps {
  nodes: MicroserviceNode[];
  edges: DependencyEdge[];
  onSelectNode: (nodeId: string) => void;
  onSimulateNode: (nodeId: string) => void;
  onClose: () => void;
}

export const ArchitectureMatrixView: React.FC<ArchitectureMatrixViewProps> = ({
  nodes,
  edges,
  onSelectNode,
  onSimulateNode,
  onClose
}) => {
  return (
    <div className="bg-[#080d1a] border border-[#1b253b] rounded-lg p-5 text-slate-200 space-y-5">
      <div className="flex items-center justify-between pb-3 border-b border-[#1b253b]">
        <div>
          <h2 className="text-base font-bold text-white font-['Plus_Jakarta_Sans'] flex items-center gap-2">
            <Shield className="w-4 h-4 text-cyan-400" />
            PS-03: Dependency Resilience & SPOF Architectural Matrix
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Comprehensive audit of all 10 E-Commerce microservices, single points of failure, and mitigation rails.
          </p>
        </div>
        <button
          onClick={onClose}
          className="px-3 py-1.5 text-xs font-medium rounded bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
        >
          Return to Canvas
        </button>
      </div>

      {/* SPOF Executive Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <div className="p-3 bg-[#0d1426] rounded border border-[#1e2a44]">
          <div className="text-[11px] text-slate-400 uppercase font-semibold">Total Mesh Services</div>
          <div className="text-xl font-bold font-mono text-cyan-400 mt-1 tabular-nums">10 Microservices</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Edge to Database tiers</div>
        </div>

        <div className="p-3 bg-[#0d1426] rounded border border-amber-900/40">
          <div className="text-[11px] text-slate-400 uppercase font-semibold">Identified SPOFs</div>
          <div className="text-xl font-bold font-mono text-amber-400 mt-1 tabular-nums">4 Critical Nodes</div>
          <div className="text-[11px] text-slate-400 mt-0.5">API Gateway, DB, Payment, Auth</div>
        </div>

        <div className="p-3 bg-[#0d1426] rounded border border-emerald-900/40">
          <div className="text-[11px] text-slate-400 uppercase font-semibold">Mitigation Coverage</div>
          <div className="text-xl font-bold font-mono text-emerald-400 mt-1 tabular-nums">100% Guarded</div>
          <div className="text-[11px] text-slate-400 mt-0.5">All 10 services have fallback rails</div>
        </div>

        <div className="p-3 bg-[#0d1426] rounded border border-[#1e2a44]">
          <div className="text-[11px] text-slate-400 uppercase font-semibold">Max Cascading Depth</div>
          <div className="text-xl font-bold font-mono text-purple-400 mt-1 tabular-nums">4 Hops (BFS)</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Edge to persistence propagation</div>
        </div>
      </div>

      {/* Microservices Matrix Table */}
      <div className="overflow-x-auto rounded border border-[#1b253b]">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-[#0d1426] text-slate-400 uppercase font-mono text-[10px] tracking-wider border-b border-[#1b253b]">
              <th className="p-3">Service Name</th>
              <th className="p-3">Tier</th>
              <th className="p-3">Status</th>
              <th className="p-3">SPOF Classification</th>
              <th className="p-3">Circuit Breaker & Fallback Strategy</th>
              <th className="p-3">Blast Impact</th>
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1b253b] bg-[#070b14]">
            {nodes.map(node => {
              const callersCount = edges.filter(e => e.to === node.id).length;
              const depsCount = edges.filter(e => e.from === node.id).length;

              return (
                <tr key={node.id} className="hover:bg-slate-900/50 transition-colors">
                  <td className="p-3 font-semibold text-white">
                    <div className="flex items-center gap-2">
                      <span className="font-['Plus_Jakarta_Sans']">{node.name}</span>
                      <span className="text-[10px] font-mono text-slate-500 font-normal">
                        ({node.technology.split('/')[0]})
                      </span>
                    </div>
                  </td>
                  <td className="p-3">
                    <span className="font-mono text-[11px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                      {node.tier}
                    </span>
                  </td>
                  <td className="p-3">
                    <span className={`font-mono text-[10px] font-semibold px-2 py-0.5 rounded uppercase border ${
                      node.status === 'failed' ? 'text-red-400 bg-red-950/60 border-red-800' :
                      node.status === 'degraded' ? 'text-amber-400 bg-amber-950/60 border-amber-800' :
                      node.status === 'mitigated' ? 'text-emerald-400 bg-emerald-950/60 border-emerald-800' :
                      'text-cyan-400 bg-cyan-950/60 border-cyan-800'
                    }`}>
                      {node.status}
                    </span>
                  </td>
                  <td className="p-3">
                    {node.isSPOF ? (
                      <div className="flex items-center gap-1.5 text-amber-300 font-medium">
                        <ShieldAlert className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        <span>Critical SPOF</span>
                      </div>
                    ) : (
                      <span className="text-slate-500">Redundant / Cached</span>
                    )}
                  </td>
                  <td className="p-3 text-slate-300">
                    <div className="font-medium text-slate-200">{node.mitigationName}</div>
                    <div className="text-[10px] text-slate-500">{node.mitigationDescription}</div>
                  </td>
                  <td className="p-3 font-mono text-[11px] text-slate-300 tabular-nums">
                    {callersCount} callers · {depsCount} deps
                  </td>
                  <td className="p-3 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => onSelectNode(node.id)}
                        className="px-2 py-1 text-[11px] font-mono rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                      >
                        Inspect
                      </button>
                      <button
                        onClick={() => onSimulateNode(node.id)}
                        className="px-2 py-1 text-[11px] font-mono font-semibold rounded bg-red-950 text-red-300 hover:bg-red-900 border border-red-800/60 transition-colors"
                      >
                        Test Crash
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
