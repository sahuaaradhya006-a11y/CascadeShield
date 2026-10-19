import React, { useState, useEffect } from 'react';
import { AlertTriangle, AlertOctagon, CheckCircle2, ShieldCheck, Flame, DollarSign, Radar } from 'lucide-react';
import { BlastRadiusMetrics } from '../types/simulator';

interface MetricsBarProps {
  metrics: BlastRadiusMetrics;
  isSimulating: boolean;
  activeHop: number | null;
}

/**
 * Custom hook for smooth numerical transitions
 */
function useAnimatedNumber(target: number, duration: number = 450): number {
  const [current, setCurrent] = useState(target);

  useEffect(() => {
    let startTimestamp: number | null = null;
    const startVal = current;
    const delta = target - startVal;
    if (delta === 0) return;

    let frameId: number;

    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const elapsed = timestamp - startTimestamp;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setCurrent(Math.round(startVal + delta * eased));

      if (progress < 1) {
        frameId = requestAnimationFrame(step);
      } else {
        setCurrent(target);
      }
    };

    frameId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frameId);
  }, [target]);

  return current;
}

export const MetricsBar: React.FC<MetricsBarProps> = ({
  metrics,
  isSimulating,
  activeHop
}) => {
  // Smooth animated metrics
  const animatedImpact = useAnimatedNumber(metrics.impactPercentage);
  const animatedRevenue = useAnimatedNumber(metrics.estimatedRevenueLossPerMin);
  const animatedSpof = useAnimatedNumber(metrics.spofCompromisedCount);
  const animatedHealthy = useAnimatedNumber(metrics.healthyCount);
  const animatedDegraded = useAnimatedNumber(metrics.degradedCount);
  const animatedFailed = useAnimatedNumber(metrics.failedCount);
  const animatedMitigated = useAnimatedNumber(metrics.mitigatedCount);

  // Determine color scheme based on blast radius impact
  const isCritical = metrics.impactPercentage >= 40 || metrics.failedCount > 0;
  const isDegraded = metrics.impactPercentage > 0 && !isCritical;
  
  const statusColor = isCritical 
    ? 'text-red-400 border-red-500/40 bg-red-950/20' 
    : isDegraded 
    ? 'text-amber-400 border-amber-500/40 bg-amber-950/20'
    : 'text-emerald-400 border-emerald-500/40 bg-emerald-950/20';

  const progressBg = isCritical
    ? 'from-amber-500 to-red-500'
    : isDegraded
    ? 'from-cyan-500 to-amber-500'
    : 'from-cyan-500 to-emerald-400';

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 px-6 py-3 bg-[#0a0f1d] border-b border-[#1b253b]">
      {/* 1. Live Blast Radius Card */}
      <div className={`p-3.5 rounded-lg border transition-all duration-300 ${statusColor} relative overflow-hidden`}>
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[11px] uppercase tracking-wider font-semibold flex items-center gap-1.5 text-slate-300">
            <Flame className="w-3.5 h-3.5 text-red-400" />
            Live Blast Radius
          </span>
          {isSimulating && (
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-red-500/20 text-red-300 font-semibold animate-pulse">
              BFS HOP {activeHop ?? 0} RUNNING
            </span>
          )}
        </div>
        
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold font-mono tracking-tight tabular-nums text-white transition-all duration-300">
            System Impact: {animatedImpact}%
          </span>
          <span className="text-xs text-slate-400 font-medium">Services Offline</span>
        </div>

        {/* Progress Bar with smooth transition */}
        <div className="w-full h-2 bg-slate-900/80 rounded-full mt-2.5 overflow-hidden border border-slate-800">
          <div
            className={`h-full bg-gradient-to-r ${progressBg} transition-all duration-500 ease-out`}
            style={{ width: `${Math.max(3, animatedImpact)}%` }}
          />
        </div>
      </div>

      {/* 2. Automated SPOF Radar */}
      <div className="p-3.5 rounded-lg border border-[#1e2a44] bg-[#0c1324] text-slate-200 transition-all duration-300">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[11px] uppercase tracking-wider font-semibold flex items-center gap-1.5 text-cyan-400">
            <Radar className="w-3.5 h-3.5" />
            SPOF Radar
          </span>
          <span className="text-[10px] font-mono text-slate-400">
            Single Points of Failure
          </span>
        </div>

        <div className="flex items-center justify-between mt-1">
          <div className="flex items-baseline gap-1.5">
            <span className={`text-2xl font-bold font-mono tabular-nums transition-colors duration-300 ${
              metrics.spofCompromisedCount > 0 ? 'text-red-400' : 'text-emerald-400'
            }`}>
              {animatedSpof} / {metrics.spofTotalCount}
            </span>
            <span className="text-xs text-slate-400">Compromised</span>
          </div>

          <div className={`px-2 py-0.5 rounded text-[11px] font-semibold uppercase tracking-wider border transition-all duration-300 ${
            metrics.spofCompromisedCount >= 2 
              ? 'bg-red-950/60 text-red-300 border-red-700/60' 
              : metrics.spofCompromisedCount === 1 
              ? 'bg-amber-950/60 text-amber-300 border-amber-700/60' 
              : 'bg-emerald-950/60 text-emerald-300 border-emerald-700/60'
          }`}>
            {metrics.spofCompromisedCount === 0 ? 'Nominal' : metrics.spofCompromisedCount === 1 ? 'High Risk' : 'Catastrophic'}
          </div>
        </div>

        <div className="text-[11px] text-slate-400 mt-2 truncate">
          Critical: API Gateway, User DB, Payment, Auth
        </div>
      </div>

      {/* 3. System Health & Financial Burn */}
      <div className="p-3.5 rounded-lg border border-[#1e2a44] bg-[#0c1324] text-slate-200 transition-all duration-300">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[11px] uppercase tracking-wider font-semibold flex items-center gap-1.5 text-slate-300">
            <DollarSign className="w-3.5 h-3.5 text-amber-400" />
            Estimated Revenue Risk
          </span>
          <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded uppercase font-semibold transition-colors duration-300 ${
            metrics.overallHealth === 'Nominal' ? 'text-emerald-400 bg-emerald-950/40' : 'text-red-400 bg-red-950/40'
          }`}>
            {metrics.overallHealth}
          </span>
        </div>

        <div className="flex items-baseline gap-1 mt-1">
          <span className="text-2xl font-bold font-mono tabular-nums text-amber-300 transition-all duration-300">
            ${animatedRevenue.toLocaleString()}
          </span>
          <span className="text-xs text-slate-400">/ min loss</span>
        </div>

        <div className="text-[11px] text-slate-400 mt-2 flex items-center justify-between">
          <span>Active Mitigations:</span>
          <span className="font-mono text-emerald-400 font-semibold">{animatedMitigated} Rails</span>
        </div>
      </div>

      {/* 4. Services Topology Health Breakdown */}
      <div className="p-3.5 rounded-lg border border-[#1e2a44] bg-[#0c1324] text-slate-200 transition-all duration-300">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[11px] uppercase tracking-wider font-semibold text-slate-300">
            Service States (10 Total)
          </span>
          <span className="text-[11px] font-mono text-slate-400">
            E-Commerce Mesh
          </span>
        </div>

        <div className="grid grid-cols-4 gap-2 mt-2 pt-0.5 text-center">
          <div className="bg-emerald-950/30 border border-emerald-900/40 rounded py-1 px-1.5">
            <div className="text-xs font-mono font-bold text-emerald-400 tabular-nums transition-all duration-300">
              {animatedHealthy}
            </div>
            <div className="text-[10px] text-slate-400 uppercase">Healthy</div>
          </div>

          <div className="bg-amber-950/30 border border-amber-900/40 rounded py-1 px-1.5">
            <div className="text-xs font-mono font-bold text-amber-400 tabular-nums transition-all duration-300">
              {animatedDegraded}
            </div>
            <div className="text-[10px] text-slate-400 uppercase">Degraded</div>
          </div>

          <div className="bg-red-950/30 border border-red-900/40 rounded py-1 px-1.5">
            <div className="text-xs font-mono font-bold text-red-400 tabular-nums transition-all duration-300">
              {animatedFailed}
            </div>
            <div className="text-[10px] text-slate-400 uppercase">Failed</div>
          </div>

          <div className="bg-cyan-950/30 border border-cyan-900/40 rounded py-1 px-1.5">
            <div className="text-xs font-mono font-bold text-cyan-400 tabular-nums transition-all duration-300">
              {animatedMitigated}
            </div>
            <div className="text-[10px] text-slate-400 uppercase">Bypassed</div>
          </div>
        </div>
      </div>
    </div>
  );
};

