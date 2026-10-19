import React, { useState, useEffect, useRef } from 'react';
import { X, Server, CheckCircle2, Loader2, Terminal, Shield, Wifi, Database, Cpu, ArrowRight } from 'lucide-react';

interface SyncClusterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccessConnect: (clusterName: string) => void;
}

const SYNC_STEPS = [
  { step: 1, text: 'Authenticating with AWS IAM / OIDC Provider (k8s-prod-eks)...' },
  { step: 2, text: 'Querying Kubernetes API Server (v1.30.2) & Istio Service Mesh...' },
  { step: 3, text: 'Fetching service mesh topology & 13 directional dependency edges...' },
  { step: 4, text: 'Authenticating with Prometheus API & OpenTelemetry telemetry collector...' },
  { step: 5, text: 'Connected to 10 Microservices successfully. Live 5s polling stream engaged.' }
];

export const SyncClusterModal: React.FC<SyncClusterModalProps> = ({
  isOpen,
  onClose,
  onSuccessConnect
}) => {
  const [selectedCluster, setSelectedCluster] = useState('aws-prod-eks-us-east-1');
  const [syncState, setSyncState] = useState<'idle' | 'syncing' | 'connected'>('idle');
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [terminalLogs, setTerminalLogs] = useState<string[]>([]);
  const terminalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [terminalLogs]);

  useEffect(() => {
    if (!isOpen) {
      setSyncState('idle');
      setCurrentStepIndex(0);
      setTerminalLogs([]);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleStartSync = () => {
    setSyncState('syncing');
    setCurrentStepIndex(0);
    setTerminalLogs([
      `[${new Date().toLocaleTimeString()}] INITIATING: Live handshake with ${selectedCluster}...`,
      `[${new Date().toLocaleTimeString()}] TLS 1.3 mutual handshake established with k8s-api.cluster.internal:6443`
    ]);

    let step = 0;
    const interval = setInterval(() => {
      step++;
      if (step < SYNC_STEPS.length) {
        setCurrentStepIndex(step);
        const logTime = new Date().toLocaleTimeString();
        setTerminalLogs(prev => [
          ...prev,
          `[${logTime}] ${SYNC_STEPS[step].text}`
        ]);
      } else {
        clearInterval(interval);
        setSyncState('connected');
        setTerminalLogs(prev => [
          ...prev,
          `[${new Date().toLocaleTimeString()}] SUCCESS: Live Cluster Handshake complete. 10 Microservices attached.`
        ]);
      }
    }, 850);
  };

  const handleFinish = () => {
    onSuccessConnect(selectedCluster);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-[#090e1c] border border-cyan-800/60 rounded-xl shadow-[0_0_40px_rgba(6,182,212,0.15)] overflow-hidden text-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-[#0d152a] border-b border-[#1c2944]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-cyan-950 border border-cyan-700/60 flex items-center justify-center text-cyan-400">
              <Server className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white font-['Plus_Jakarta_Sans']">
                Sync Live Cluster (K8s / AWS Mesh)
              </h3>
              <p className="text-[11px] text-slate-400">
                Connect CascadeShield directly to production Kubernetes & Prometheus telemetry
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          {/* Cluster Selector */}
          {syncState === 'idle' && (
            <div className="space-y-3">
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Select Target Ingress Cluster / Environment
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => setSelectedCluster('aws-prod-eks-us-east-1')}
                  className={`p-3 rounded-lg border text-left transition-all ${
                    selectedCluster === 'aws-prod-eks-us-east-1'
                      ? 'bg-cyan-950/40 border-cyan-500 text-white shadow-[0_0_12px_rgba(6,182,212,0.2)]'
                      : 'bg-[#060a16] border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs">AWS EKS Production</span>
                    <span className="text-[9px] font-mono uppercase px-1 rounded bg-amber-950 text-amber-300 border border-amber-800">
                      us-east-1
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">
                    Envoy Proxy + Istio 1.22
                  </div>
                  <div className="text-[10px] font-mono text-cyan-400 mt-1.5 flex items-center gap-1">
                    <Cpu className="w-3 h-3" /> 10 Microservices Online
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedCluster('gke-ecommerce-prod-mesh')}
                  className={`p-3 rounded-lg border text-left transition-all ${
                    selectedCluster === 'gke-ecommerce-prod-mesh'
                      ? 'bg-cyan-950/40 border-cyan-500 text-white shadow-[0_0_12px_rgba(6,182,212,0.2)]'
                      : 'bg-[#060a16] border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs">GKE Commerce Cloud</span>
                    <span className="text-[9px] font-mono uppercase px-1 rounded bg-blue-950 text-blue-300 border border-blue-800">
                      us-central1
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">
                    Anthos Service Mesh
                  </div>
                  <div className="text-[10px] font-mono text-cyan-400 mt-1.5 flex items-center gap-1">
                    <Database className="w-3 h-3" /> Aurora & Kafka Brokers
                  </div>
                </button>
              </div>

              {/* Endpoint Specs */}
              <div className="bg-[#050813] p-3 rounded-lg border border-[#1b253b] text-xs font-mono space-y-1.5 text-slate-300">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Prometheus Gateway:</span>
                  <span className="text-emerald-400">http://prometheus-k8s.internal:9090</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Telemetry Sampling:</span>
                  <span className="text-cyan-400">Real-time (5s poll interval)</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Nodes to Map:</span>
                  <span className="text-white font-semibold">10 Microservices · 13 Edges</span>
                </div>
              </div>
            </div>
          )}

          {/* Syncing State with Sleek Spinner */}
          {syncState === 'syncing' && (
            <div className="py-2 text-center space-y-3">
              <div className="relative w-14 h-14 mx-auto flex items-center justify-center">
                <div className="absolute inset-0 rounded-full border-2 border-cyan-500/20 animate-ping" />
                <Loader2 className="w-9 h-9 text-cyan-400 animate-spin" />
              </div>

              <div>
                <h4 className="text-sm font-bold text-white font-['Plus_Jakarta_Sans']">
                  Synchronizing Cluster Mesh Topology...
                </h4>
                <p className="text-xs text-cyan-400 mt-0.5 font-mono">
                  Step {currentStepIndex + 1} of {SYNC_STEPS.length}: {SYNC_STEPS[currentStepIndex].text}
                </p>
              </div>

              {/* Step indicator bar */}
              <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden border border-slate-800 max-w-md mx-auto">
                <div
                  className="bg-gradient-to-r from-cyan-500 to-emerald-400 h-full transition-all duration-500 ease-out"
                  style={{ width: `${((currentStepIndex + 1) / SYNC_STEPS.length) * 100}%` }}
                />
              </div>
            </div>
          )}

          {/* Connected Success Banner */}
          {syncState === 'connected' && (
            <div className="p-4 bg-emerald-950/40 border border-emerald-500/60 rounded-lg text-center space-y-2">
              <div className="w-10 h-10 rounded-full bg-emerald-900/60 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-white font-['Plus_Jakarta_Sans']">
                Successfully Attached to {selectedCluster}
              </h4>
              <p className="text-xs text-emerald-300">
                All 10 microservices, health probes, and Prometheus latency feeds are now syncing live every 5 seconds.
              </p>
            </div>
          )}

          {/* Live Terminal Log Stream */}
          {(syncState === 'syncing' || syncState === 'connected') && (
            <div className="bg-[#04060d] rounded-lg border border-slate-800 p-3 font-mono text-[11px] text-slate-300 h-36 overflow-y-auto space-y-1 select-text" ref={terminalRef}>
              <div className="text-slate-500 text-[10px] uppercase font-bold tracking-wider mb-1 flex items-center gap-1.5">
                <Terminal className="w-3 h-3 text-cyan-400" />
                Cluster Ingress Stream Log
              </div>
              {terminalLogs.map((log, i) => (
                <div key={i} className="leading-relaxed">
                  <span className="text-cyan-400">{log.slice(0, 10)}</span>
                  <span className="text-slate-200">{log.slice(10)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-[#0a1020] border-t border-[#1c2944]">
          <span className="text-[11px] text-slate-400">
            {syncState === 'connected' ? 'Status: Active Socket' : 'Prometheus TLS 1.3'}
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3 py-1.5 text-xs text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-md transition-colors"
            >
              Cancel
            </button>

            {syncState === 'idle' ? (
              <button
                onClick={handleStartSync}
                className="px-4 py-1.5 text-xs font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded-md shadow-[0_0_15px_rgba(6,182,212,0.4)] transition-all flex items-center gap-1.5"
              >
                <Wifi className="w-3.5 h-3.5" />
                Initiate Live Handshake
              </button>
            ) : syncState === 'connected' ? (
              <button
                onClick={handleFinish}
                className="px-4 py-1.5 text-xs font-semibold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-md shadow-[0_0_15px_rgba(16,185,129,0.4)] transition-all flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                Complete & Stream Live Data
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
};
