import React from 'react';
import { Shield, Activity, RefreshCw, Zap, ShieldCheck, Wifi, WifiOff } from 'lucide-react';
import { BlastRadiusMetrics } from '../types/simulator';

interface HeaderProps {
  metrics: BlastRadiusMetrics;
  onReset: () => void;
  onMitigateAll: () => void;
  activeTab: 'canvas' | 'architecture' | 'scenarios';
  setActiveTab: (tab: 'canvas' | 'architecture' | 'scenarios') => void;
  isLiveConnected: boolean;
  liveClusterName?: string;
  onOpenSyncModal: () => void;
  onDisconnectLive: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  metrics,
  onReset,
  onMitigateAll,
  activeTab,
  setActiveTab,
  isLiveConnected,
  liveClusterName,
  onOpenSyncModal,
  onDisconnectLive
}) => {
  return (
    <header className="flex items-center justify-between gap-8 px-6 py-3 bg-[#080d1a] border-b border-[#1b253b] text-slate-200 shrink-0">
      {/* Zone 1: Brand Zone */}
      <div className="flex items-center gap-3 shrink-0">
        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-cyan-500/20 to-blue-600/30 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.25)]">
          <Shield className="w-5 h-5" />
        </div>
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span className="text-base font-bold tracking-tight text-white font-['Plus_Jakarta_Sans'] whitespace-nowrap">
              CascadeShield
            </span>
            <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-cyan-950/80 text-cyan-400 border border-cyan-800/60 font-semibold tracking-wider">
              PS-03
            </span>
          </div>
          <span className="text-[11px] text-slate-400 font-medium tracking-wide">
            Dependency Modelling & Failure Propagation Simulator
          </span>
        </div>
      </div>

      {/* Zone 2: Navigation Links */}
      <nav className="hidden lg:flex items-center gap-6 text-xs font-medium text-slate-400">
        <button
          onClick={() => setActiveTab('canvas')}
          className={`flex items-center gap-1.5 transition-colors whitespace-nowrap py-1 ${
            activeTab === 'canvas'
              ? 'text-cyan-400 border-b-2 border-cyan-400 font-semibold'
              : 'hover:text-slate-200'
          }`}
        >
          <Activity className="w-3.5 h-3.5" />
          Live Dependency Graph
        </button>
        <button
          onClick={() => setActiveTab('scenarios')}
          className={`flex items-center gap-1.5 transition-colors whitespace-nowrap py-1 ${
            activeTab === 'scenarios'
              ? 'text-cyan-400 border-b-2 border-cyan-400 font-semibold'
              : 'hover:text-slate-200'
          }`}
        >
          <Zap className="w-3.5 h-3.5" />
          Hackathon Scenarios
        </button>
        <button
          onClick={() => setActiveTab('architecture')}
          className={`flex items-center gap-1.5 transition-colors whitespace-nowrap py-1 ${
            activeTab === 'architecture'
              ? 'text-cyan-400 border-b-2 border-cyan-400 font-semibold'
              : 'hover:text-slate-200'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          SPOF & SLA Matrix
        </button>
      </nav>

      {/* Zone 3: Primary Action & Live Cluster Sync */}
      <div className="flex items-center gap-2.5 shrink-0">
        {/* Live Status Badge or Sync Button */}
        {isLiveConnected ? (
          <div className="flex items-center gap-2 bg-[#071914] border border-emerald-500/60 rounded-md px-2.5 py-1 text-xs">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-semibold text-emerald-300 whitespace-nowrap">
                Live Data Feed: Active (Polling every 5s)
              </span>
              <span className="text-[9px] font-mono text-emerald-400/80 bg-emerald-950 px-1 py-0.2 rounded border border-emerald-800">
                {liveClusterName ? 'EKS' : 'K8s'}
              </span>
            </div>
            <button
              onClick={onDisconnectLive}
              className="text-slate-400 hover:text-red-400 text-[10px] ml-1 p-0.5 rounded hover:bg-slate-800"
              title="Disconnect live feed"
            >
              <WifiOff className="w-3 h-3" />
            </button>
          </div>
        ) : (
          <button
            onClick={onOpenSyncModal}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-cyan-200 bg-cyan-950/70 hover:bg-cyan-900/80 border border-cyan-700/80 rounded-md shadow-[0_0_12px_rgba(6,182,212,0.2)] transition-all whitespace-nowrap"
          >
            <span>🔌 Sync Live Cluster (K8s / AWS)</span>
          </button>
        )}

        <button
          onClick={onReset}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 rounded-md transition-colors whitespace-nowrap hover:text-white"
          title="Reset all microservices to nominal healthy state"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Reset All
        </button>

        {metrics.impactPercentage > 0 && (
          <button
            onClick={onMitigateAll}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-emerald-950 bg-emerald-400 hover:bg-emerald-300 rounded-md shadow-[0_0_15px_rgba(16,185,129,0.4)] transition-all whitespace-nowrap"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            1-Click Mitigate All
          </button>
        )}
      </div>
    </header>
  );
};

