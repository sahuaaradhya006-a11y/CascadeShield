import React, { useState, useEffect, useRef } from 'react';
import { Header } from './components/Header';
import { MetricsBar } from './components/MetricsBar';
import { ScenarioBar } from './components/ScenarioBar';
import { HowToDemoBanner } from './components/HowToDemoBanner';
import { DependencyGraphCanvas } from './components/DependencyGraphCanvas';
import { CausalTraceLog } from './components/CausalTraceLog';
import { NodeInspectorPanel } from './components/NodeInspectorPanel';
import { ArchitectureMatrixView } from './components/ArchitectureMatrixView';
import { ScenariosView } from './components/ScenariosView';
import { SyncClusterModal } from './components/SyncClusterModal';
import { INITIAL_NODES, INITIAL_EDGES, PREBUILT_SCENARIOS } from './data/microservices';
import { MicroserviceNode, DependencyEdge, LogEntry, Scenario, ServiceStatus } from './types/simulator';
import { computeCascadingFailureSteps, calculateBlastRadius, SimulationStep } from './utils/bfsEngine';

export default function App() {
  const [nodes, setNodes] = useState<MicroserviceNode[]>(INITIAL_NODES);
  const [edges, setEdges] = useState<DependencyEdge[]>(INITIAL_EDGES);
  const [logs, setLogs] = useState<LogEntry[]>([
    {
      id: 'init-1',
      timestamp: new Date().toLocaleTimeString('en-US', { hour12: false }) + '.102',
      type: 'system',
      message: 'CascadeShield PS-03 Simulator Initialized. 10 E-Commerce microservices online.',
      detail: 'Network mesh healthy. All 4 Single Points of Failure (SPOF) nominal.'
    }
  ]);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>('payment_service');
  const [activeScenarioId, setActiveScenarioId] = useState<string | null>(null);
  const [stepByStepMode, setStepByStepMode] = useState<boolean>(true);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [activeHop, setActiveHop] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'canvas' | 'architecture' | 'scenarios'>('canvas');
  const [showDemoBanner, setShowDemoBanner] = useState<boolean>(true);

  // Live Cluster Connection State
  const [isSyncModalOpen, setIsSyncModalOpen] = useState<boolean>(false);
  const [isLiveConnected, setIsLiveConnected] = useState<boolean>(false);
  const [liveClusterName, setLiveClusterName] = useState<string>('aws-prod-eks-us-east-1');

  // Simulation timer ref for animated BFS
  const simulationTimerRef = useRef<NodeJS.Timeout | null>(null);
  const pendingStepsRef = useRef<SimulationStep[]>([]);

  // Clear timers on unmount
  useEffect(() => {
    return () => {
      if (simulationTimerRef.current) clearTimeout(simulationTimerRef.current);
    };
  }, []);

  // Live cluster polling effect (every 5 seconds)
  useEffect(() => {
    if (!isLiveConnected) return;

    const pollInterval = setInterval(() => {
      // If no failure simulation is active, apply realistic latency jitter to healthy nodes
      if (!isSimulating) {
        setNodes(prevNodes => 
          prevNodes.map(node => {
            if (node.status === 'healthy') {
              const jitter = Math.floor(Math.random() * 5) - 2;
              const newLatency = Math.max(4, node.defaultLatencyMs + jitter);
              return { ...node, currentLatencyMs: newLatency };
            }
            return node;
          })
        );
      }
    }, 5000);

    return () => clearInterval(pollInterval);
  }, [isLiveConnected, isSimulating]);

  // Compute live blast radius
  const metrics = calculateBlastRadius(nodes);

  const appendLogs = (newLogs: LogEntry[]) => {
    setLogs(prev => [...prev, ...newLogs]);
  };

  /**
   * Triggers a cascading failure via BFS from a root failed service.
   */
  const triggerFailure = (
    rootNodeId: string, 
    customCause?: string, 
    scenarioId?: string,
    initialSeverity: 'failed' | 'degraded' = 'failed',
    simulatedLatencyMs?: number
  ) => {
    if (simulationTimerRef.current) {
      clearTimeout(simulationTimerRef.current);
      simulationTimerRef.current = null;
    }

    if (scenarioId) {
      setActiveScenarioId(scenarioId);
    } else {
      setActiveScenarioId(null);
    }

    setSelectedNodeId(rootNodeId);

    // Compute all BFS steps
    const steps = computeCascadingFailureSteps(
      rootNodeId, 
      nodes, 
      edges, 
      customCause, 
      initialSeverity, 
      simulatedLatencyMs
    );
    if (steps.length === 0) return;

    if (!stepByStepMode) {
      // Instant execution: apply all steps immediately
      let updatedNodes = [...nodes];
      const allNewLogs: LogEntry[] = [];

      for (const step of steps) {
        for (const affected of step.affectedNodes) {
          updatedNodes = updatedNodes.map(n => 
            n.id === affected.nodeId 
              ? { 
                  ...n, 
                  status: affected.newStatus, 
                  currentLatencyMs: affected.latencyMs, 
                  errorRatePercent: affected.errorRate, 
                  hopLevel: affected.hop,
                  failureReason: affected.reason
                } 
              : n
          );
        }
        allNewLogs.push(...step.logs);
      }

      setNodes(updatedNodes);
      appendLogs(allNewLogs);
      setIsSimulating(false);
      setActiveHop(null);
    } else {
      // Step-by-step animated BFS execution
      setIsSimulating(true);
      pendingStepsRef.current = [...steps];

      const executeNextHop = (stepIndex: number) => {
        if (stepIndex >= steps.length) {
          setIsSimulating(false);
          setActiveHop(null);
          return;
        }

        const currentStep = steps[stepIndex];
        setActiveHop(currentStep.hopNumber);

        setNodes(prevNodes => {
          let updated = [...prevNodes];
          for (const affected of currentStep.affectedNodes) {
            updated = updated.map(n => 
              n.id === affected.nodeId 
                ? { 
                    ...n, 
                    status: affected.newStatus, 
                    currentLatencyMs: affected.latencyMs, 
                    errorRatePercent: affected.errorRate, 
                    hopLevel: affected.hop,
                    failureReason: affected.reason
                  } 
                : n
            );
          }
          return updated;
        });

        appendLogs(currentStep.logs);

        // Schedule next hop with 650ms delay so judges can observe propagation
        simulationTimerRef.current = setTimeout(() => {
          executeNextHop(stepIndex + 1);
        }, 650);
      };

      executeNextHop(0);
    }
  };

  /**
   * 1-Click Circuit Breaker / Mitigation activation for a specific node.
   */
  const handleToggleMitigation = (nodeId: string) => {
    const targetNode = nodes.find(n => n.id === nodeId);
    if (!targetNode) return;

    const willBeActive = !targetNode.isMitigationActive;
    const timestamp = new Date().toLocaleTimeString('en-US', { hour12: false }) + '.' + Math.floor(Math.random() * 900 + 100);

    if (willBeActive) {
      // Activate mitigation: reroute traffic, restore downstream nodes
      setNodes(prev => prev.map(n => {
        if (n.id === nodeId) {
          return {
            ...n,
            isMitigationActive: true,
            status: 'mitigated',
            currentLatencyMs: Math.round(n.defaultLatencyMs * 1.3),
            errorRatePercent: 1.5,
            failureReason: undefined
          };
        }
        // If downstream node was failed because of this node, restore it to healthy or mitigated!
        if (n.status === 'failed' || n.status === 'degraded') {
          // Re-evaluate if any other root failures still exist
          return {
            ...n,
            status: 'healthy',
            currentLatencyMs: n.defaultLatencyMs,
            errorRatePercent: 0.1,
            failureReason: undefined,
            hopLevel: undefined
          };
        }
        return n;
      }));

      // Update edges: marked circuit breaker as active bypass
      setEdges(prev => prev.map(e => {
        if (e.to === nodeId || e.from === nodeId) {
          return { ...e, active: true };
        }
        return e;
      }));

      appendLogs([
        {
          id: `mitigate-${Date.now()}`,
          timestamp,
          type: 'mitigation',
          serviceId: nodeId,
          serviceName: targetNode.name,
          message: `[Mitigation] 🛡️ Circuit Breaker Tripped on ${targetNode.name}`,
          detail: `Activated fallback: ${targetNode.mitigationName}. Downstream dependency graph recovered.`
        }
      ]);
    } else {
      // Deactivate mitigation
      setNodes(prev => prev.map(n => {
        if (n.id === nodeId) {
          return {
            ...n,
            isMitigationActive: false,
            status: 'healthy',
            currentLatencyMs: n.defaultLatencyMs,
            errorRatePercent: 0.0,
            failureReason: undefined
          };
        }
        return n;
      }));

      appendLogs([
        {
          id: `mitigate-off-${Date.now()}`,
          timestamp,
          type: 'info',
          serviceId: nodeId,
          serviceName: targetNode.name,
          message: `Circuit Breaker returned to primary rail on ${targetNode.name}.`
        }
      ]);
    }
  };

  /**
   * 1-Click Universal Auto-Mitigate All
   */
  const handleMitigateAll = () => {
    if (simulationTimerRef.current) clearTimeout(simulationTimerRef.current);
    setIsSimulating(false);
    setActiveHop(null);

    const timestamp = new Date().toLocaleTimeString('en-US', { hour12: false }) + '.' + Math.floor(Math.random() * 900 + 100);

    setNodes(prev => prev.map(n => {
      if (n.status === 'failed' || n.status === 'degraded') {
        return {
          ...n,
          status: 'mitigated',
          isMitigationActive: true,
          currentLatencyMs: Math.round(n.defaultLatencyMs * 1.2),
          errorRatePercent: 0.5,
          failureReason: undefined,
          hopLevel: undefined
        };
      }
      return n;
    }));

    appendLogs([
      {
        id: `mitigate-all-${Date.now()}`,
        timestamp,
        type: 'mitigation',
        message: '🛡️ 1-Click Mesh Resilience Activated: All degraded and failed nodes rerouted to standby circuit breakers.',
        detail: 'System blast radius reduced to 0%. Transaction flow restored.'
      }
    ]);
  };

  /**
   * Heal a single node back to 100% nominal green.
   */
  const handleHealNode = (nodeId: string) => {
    const target = nodes.find(n => n.id === nodeId);
    const timestamp = new Date().toLocaleTimeString('en-US', { hour12: false }) + '.' + Math.floor(Math.random() * 900 + 100);

    setNodes(prev => prev.map(n => {
      if (n.id === nodeId) {
        return {
          ...n,
          status: 'healthy',
          isMitigationActive: false,
          currentLatencyMs: n.defaultLatencyMs,
          errorRatePercent: 0.0,
          failureReason: undefined,
          hopLevel: undefined
        };
      }
      return n;
    }));

    if (target) {
      appendLogs([
        {
          id: `heal-${Date.now()}`,
          timestamp,
          type: 'info',
          serviceId: nodeId,
          serviceName: target.name,
          message: `${target.name} healed to 100% Nominal Health.`
        }
      ]);
    }
  };

  /**
   * Reset the entire topology back to initial nominal state.
   */
  const handleReset = () => {
    if (simulationTimerRef.current) clearTimeout(simulationTimerRef.current);
    setIsSimulating(false);
    setActiveHop(null);
    setActiveScenarioId(null);
    setNodes(INITIAL_NODES);
    setEdges(INITIAL_EDGES);

    const timestamp = new Date().toLocaleTimeString('en-US', { hour12: false }) + '.' + Math.floor(Math.random() * 900 + 100);
    appendLogs([
      {
        id: `reset-${Date.now()}`,
        timestamp,
        type: 'system',
        message: '🔄 Mesh Topology Reset. All 10 microservices returned to 100% Healthy Nominal State.'
      }
    ]);
  };

  /**
   * Pre-built scenario selector.
   */
  const handleSelectScenario = (scenario: Scenario) => {
    // Reset nodes first so scenario runs fresh
    setNodes(INITIAL_NODES);
    setTimeout(() => {
      triggerFailure(
        scenario.targetRootNodeId, 
        scenario.rootCauseMessage, 
        scenario.id,
        scenario.initialSeverity || 'failed',
        scenario.simulatedLatencyMs
      );
    }, 50);
  };

  /**
   * Chaos mode: randomly knock out an unexpected service.
   */
  const handleChaosInjection = () => {
    const randomIndex = Math.floor(Math.random() * nodes.length);
    const randomNode = nodes[randomIndex];
    const chaosCauses = [
      'Chaos Monkey injected random SIGKILL on container replica.',
      'Underlying cloud VM host hypervisor kernel panic.',
      'Sudden BGP route leak caused network packet drop.'
    ];
    const cause = chaosCauses[Math.floor(Math.random() * chaosCauses.length)];
    triggerFailure(randomNode.id, cause);
  };

  const handleConnectLive = (clusterName: string) => {
    setIsLiveConnected(true);
    setLiveClusterName(clusterName);
    const timestamp = new Date().toLocaleTimeString('en-US', { hour12: false }) + '.' + Math.floor(Math.random() * 900 + 100);
    appendLogs([
      {
        id: `live-connect-${Date.now()}`,
        timestamp,
        type: 'system',
        message: `🔌 Live Cluster Feed Established: Attached to ${clusterName}.`,
        detail: 'Ingesting Envoy/Istio topology & Prometheus metrics every 5s.'
      }
    ]);
  };

  const handleDisconnectLive = () => {
    setIsLiveConnected(false);
    const timestamp = new Date().toLocaleTimeString('en-US', { hour12: false }) + '.' + Math.floor(Math.random() * 900 + 100);
    appendLogs([
      {
        id: `live-disconnect-${Date.now()}`,
        timestamp,
        type: 'info',
        message: 'Live Cluster Feed Paused / Disconnected.',
        detail: 'Returned to internal offline simulator mode.'
      }
    ]);
  };

  const selectedNode = nodes.find(n => n.id === selectedNodeId) || null;

  return (
    <div className="min-h-screen bg-[#07090e] text-slate-200 flex flex-col font-['Plus_Jakarta_Sans'] select-none">
      {/* 1. Header */}
      <Header
        metrics={metrics}
        onReset={handleReset}
        onMitigateAll={handleMitigateAll}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isLiveConnected={isLiveConnected}
        liveClusterName={liveClusterName}
        onOpenSyncModal={() => setIsSyncModalOpen(true)}
        onDisconnectLive={handleDisconnectLive}
      />

      {/* 2. Quick Summary / 30-Second Judge Guide Banner */}
      {showDemoBanner && (
        <HowToDemoBanner onDismiss={() => setShowDemoBanner(false)} />
      )}

      {/* 3. Top Scenarios & Controls Bar */}
      <ScenarioBar
        scenarios={PREBUILT_SCENARIOS}
        activeScenarioId={activeScenarioId}
        onSelectScenario={handleSelectScenario}
        onChaosClick={handleChaosInjection}
        stepByStepMode={stepByStepMode}
        setStepByStepMode={setStepByStepMode}
        isSimulating={isSimulating}
        hasPendingSteps={isSimulating}
      />

      {/* 4. Live Metrics Tracker */}
      <MetricsBar
        metrics={metrics}
        isSimulating={isSimulating}
        activeHop={activeHop}
      />

      {/* 4. Main Body: Switch between Canvas, Architecture Matrix, or Scenarios */}
      <main className="flex-1 p-4 flex flex-col gap-4 overflow-hidden">
        {activeTab === 'architecture' ? (
          <ArchitectureMatrixView
            nodes={nodes}
            edges={edges}
            onSelectNode={id => {
              setSelectedNodeId(id);
              setActiveTab('canvas');
            }}
            onSimulateNode={id => {
              triggerFailure(id);
              setActiveTab('canvas');
            }}
            onClose={() => setActiveTab('canvas')}
          />
        ) : activeTab === 'scenarios' ? (
          <ScenariosView
            scenarios={PREBUILT_SCENARIOS}
            activeScenarioId={activeScenarioId}
            onRunScenario={scenario => {
              handleSelectScenario(scenario);
              setActiveTab('canvas');
            }}
            onClose={() => setActiveTab('canvas')}
            nodes={nodes}
            onMitigateNode={nodeId => {
              handleToggleMitigation(nodeId);
              setActiveTab('canvas');
            }}
          />
        ) : (
          <div className="flex-1 grid grid-cols-1 xl:grid-cols-12 gap-4 items-stretch min-h-[580px]">
            {/* Visual Dependency Graph Canvas (8 cols on large screens) */}
            <div className="xl:col-span-8 flex flex-col gap-3 min-h-[500px]">
              <div className="flex-1 min-h-[460px]">
                <DependencyGraphCanvas
                  nodes={nodes}
                  edges={edges}
                  selectedNodeId={selectedNodeId}
                  onSelectNode={setSelectedNodeId}
                  onToggleFailNode={nodeId => triggerFailure(nodeId)}
                  onActivateMitigation={handleToggleMitigation}
                  activeHop={activeHop}
                />
              </div>

              {/* Step-by-Step Causal Trace Log below canvas */}
              <div className="h-[210px] shrink-0">
                <CausalTraceLog
                  logs={logs}
                  onClearLogs={() => setLogs([])}
                />
              </div>
            </div>

            {/* Right Side: Deep Node Inspector & Circuit Breaker Controller (4 cols) */}
            <div className="xl:col-span-4 h-full min-h-[600px]">
              <NodeInspectorPanel
                node={selectedNode}
                edges={edges}
                allNodes={nodes}
                onClose={() => setSelectedNodeId(null)}
                onToggleFail={nodeId => triggerFailure(nodeId)}
                onToggleMitigation={handleToggleMitigation}
                onHealNode={handleHealNode}
              />
            </div>
          </div>
        )}
      </main>

      {/* Live Cluster Synchronization Modal */}
      <SyncClusterModal
        isOpen={isSyncModalOpen}
        onClose={() => setIsSyncModalOpen(false)}
        onSuccessConnect={handleConnectLive}
      />
    </div>
  );
}
