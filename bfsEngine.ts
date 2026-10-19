import { MicroserviceNode, DependencyEdge, LogEntry, BlastRadiusMetrics, ServiceStatus } from '../types/simulator';

export interface BFSHopResult {
  hop: number;
  nodeId: string;
  previousStatus: ServiceStatus;
  newStatus: ServiceStatus;
  reason: string;
  latencyMs: number;
  errorRate: number;
  edgeLabel?: string;
  sourceServiceId?: string;
}

export interface SimulationStep {
  hopNumber: number;
  affectedNodes: BFSHopResult[];
  logs: LogEntry[];
}

/**
 * Calculates BFS cascading failure steps from a root failed service.
 * In our dependency model, edge (from: A, to: B) means A depends on B.
 * When B fails, A is affected.
 */
export function computeCascadingFailureSteps(
  rootNodeId: string,
  nodes: MicroserviceNode[],
  edges: DependencyEdge[],
  rootCauseMessage?: string,
  initialSeverity: 'failed' | 'degraded' = 'failed',
  customLatencyMs?: number
): SimulationStep[] {
  const nodeMap = new Map<string, MicroserviceNode>(nodes.map(n => [n.id, { ...n }]));
  const steps: SimulationStep[] = [];
  const visited = new Set<string>();

  const rootNode = nodeMap.get(rootNodeId);
  if (!rootNode) return steps;

  // Build reverse adjacency list: callee -> callers that depend on it
  // edge.to is the dependency, edge.from is the caller dependent on it
  const dependentMap = new Map<string, DependencyEdge[]>();
  for (const edge of edges) {
    if (!dependentMap.has(edge.to)) {
      dependentMap.set(edge.to, []);
    }
    dependentMap.get(edge.to)!.push(edge);
  }

  // Queue for BFS: [nodeId, hop, severity, parentNodeId, edgeLabel]
  let currentHopQueue: Array<{
    nodeId: string;
    hop: number;
    parentStatus: ServiceStatus;
    parentId?: string;
    edge?: DependencyEdge;
  }> = [{
    nodeId: rootNodeId,
    hop: 0,
    parentStatus: initialSeverity,
    parentId: undefined,
    edge: undefined
  }];

  let hop = 0;

  while (currentHopQueue.length > 0) {
    const nextHopQueue: typeof currentHopQueue = [];
    const hopResults: BFSHopResult[] = [];
    const hopLogs: LogEntry[] = [];
    const timestamp = new Date().toLocaleTimeString('en-US', { hour12: false }) + '.' + Math.floor(Math.random() * 900 + 100);

    for (const item of currentHopQueue) {
      if (visited.has(item.nodeId)) continue;
      visited.add(item.nodeId);

      const target = nodeMap.get(item.nodeId);
      if (!target) continue;

      let newStatus: ServiceStatus = initialSeverity;
      let latency = target.defaultLatencyMs;
      let errorRate = 100;
      let reason = '';

      if (item.hop === 0) {
        // Root failure / degradation
        if (initialSeverity === 'degraded') {
          newStatus = 'degraded';
          latency = customLatencyMs || Math.max(target.defaultLatencyMs * 25, 1480);
          errorRate = 19.5;
          reason = rootCauseMessage || `${target.name} replication lag / severe response delay spike.`;

          hopLogs.push({
            id: `log-${Date.now()}-${item.nodeId}-${hop}`,
            timestamp,
            hop: 0,
            serviceId: target.id,
            serviceName: target.name,
            type: 'warn',
            message: `[Hop 0] ROOT WARNING: ${target.name} High Latency (${latency}ms)`,
            detail: reason
          });
        } else {
          newStatus = 'failed';
          latency = Math.max(target.defaultLatencyMs * 8, 4800);
          errorRate = 100;
          reason = rootCauseMessage || `${target.name} internal service crash / connection timeout.`;

          hopLogs.push({
            id: `log-${Date.now()}-${item.nodeId}-${hop}`,
            timestamp,
            hop: 0,
            serviceId: target.id,
            serviceName: target.name,
            type: 'error',
            message: `[Hop 0] ROOT OUTAGE: ${target.name} Failed`,
            detail: reason
          });
        }
      } else {
        // Dependent node
        const edge = item.edge;
        const parent = item.parentId ? nodeMap.get(item.parentId) : null;
        const parentName = parent ? parent.name : 'Upstream service';

        // Check if target or parent has active mitigation / circuit breaker
        if (target.isMitigationActive || (parent && parent.isMitigationActive)) {
          newStatus = 'mitigated';
          latency = Math.round(target.defaultLatencyMs * 1.4);
          errorRate = 2.5;
          reason = `Circuit Breaker active on ${parentName}. Requests diverted to fallback rail.`;

          hopLogs.push({
            id: `log-${Date.now()}-${item.nodeId}-${hop}`,
            timestamp,
            hop: item.hop,
            serviceId: target.id,
            serviceName: target.name,
            type: 'mitigation',
            message: `[Hop ${item.hop}] ${target.name} Protected (Circuit Breaker Reroute)`,
            detail: reason
          });
        } else if (item.parentStatus === 'degraded' || initialSeverity === 'degraded') {
          // If the cascade is from high latency / replication lag, cascade as AMBER degraded warning!
          newStatus = 'degraded';
          latency = Math.round(target.defaultLatencyMs * 3.8);
          errorRate = 18.2;
          reason = `Latency cascade from ${parentName}: downstream queries stalling (${latency}ms). Warning threshold breached.`;

          hopLogs.push({
            id: `log-${Date.now()}-${item.nodeId}-${hop}`,
            timestamp,
            hop: item.hop,
            serviceId: target.id,
            serviceName: target.name,
            type: 'warn',
            message: `[Hop ${item.hop}] ${target.name} DEGRADED (Amber Warning)`,
            detail: reason
          });
        } else if (edge?.type === 'hard' && edge?.impactOnFailure === 'critical') {
          // Hard critical dependency on a dead node -> Fails
          newStatus = 'failed';
          latency = Math.round(target.defaultLatencyMs * 6.5);
          errorRate = 98.4;
          reason = `Hard dependency failure: ${parentName} unreachable during ${edge.label}.`;

          hopLogs.push({
            id: `log-${Date.now()}-${item.nodeId}-${hop}`,
            timestamp,
            hop: item.hop,
            serviceId: target.id,
            serviceName: target.name,
            type: 'error',
            message: `[Hop ${item.hop}] ${target.name} BLOCKED (Hard Dependency)`,
            detail: reason
          });
        } else {
          // Soft or cacheable dependency -> Graceful degradation
          newStatus = 'degraded';
          latency = Math.round(target.defaultLatencyMs * 2.8);
          errorRate = 34.2;
          reason = `Upstream degradation: ${parentName} failing. Operating in reduced SLA mode.`;

          hopLogs.push({
            id: `log-${Date.now()}-${item.nodeId}-${hop}`,
            timestamp,
            hop: item.hop,
            serviceId: target.id,
            serviceName: target.name,
            type: 'warn',
            message: `[Hop ${item.hop}] ${target.name} DEGRADED (Graceful Fallback)`,
            detail: reason
          });
        }
      }

      hopResults.push({
        hop: item.hop,
        nodeId: target.id,
        previousStatus: target.status,
        newStatus,
        reason,
        latencyMs: latency,
        errorRate,
        edgeLabel: item.edge?.label,
        sourceServiceId: item.parentId
      });

      // Update node in local map for next hops
      target.status = newStatus;
      target.currentLatencyMs = latency;
      target.errorRatePercent = errorRate;
      target.hopLevel = item.hop;
      target.failureReason = reason;

      // Find all services that depend on this node
      // If this node is NOT mitigated or still degraded, failure cascades further
      if (newStatus === 'failed' || newStatus === 'degraded') {
        const dependentEdges = dependentMap.get(target.id) || [];
        for (const depEdge of dependentEdges) {
          if (!visited.has(depEdge.from)) {
            nextHopQueue.push({
              nodeId: depEdge.from,
              hop: item.hop + 1,
              parentStatus: newStatus,
              parentId: target.id,
              edge: depEdge
            });
          }
        }
      }
    }

    if (hopResults.length > 0) {
      steps.push({
        hopNumber: hop,
        affectedNodes: hopResults,
        logs: hopLogs
      });
    }

    currentHopQueue = nextHopQueue;
    hop++;
  }

  return steps;
}

/**
 * Calculates current Blast Radius metrics across all nodes.
 */
export function calculateBlastRadius(nodes: MicroserviceNode[]): BlastRadiusMetrics {
  const totalNodes = nodes.length;
  let healthyCount = 0;
  let degradedCount = 0;
  let failedCount = 0;
  let mitigatedCount = 0;
  let spofCompromisedCount = 0;
  let spofTotalCount = 0;

  for (const node of nodes) {
    if (node.isSPOF) {
      spofTotalCount++;
      if (node.status === 'failed' || node.status === 'degraded') {
        spofCompromisedCount++;
      }
    }

    if (node.status === 'failed') failedCount++;
    else if (node.status === 'degraded') degradedCount++;
    else if (node.status === 'mitigated') mitigatedCount++;
    else healthyCount++;
  }

  // Formula: Failed counts 100%, Degraded counts 45%, Mitigated counts 10%
  const weightedScore = (failedCount * 1.0) + (degradedCount * 0.45) + (mitigatedCount * 0.08);
  const impactPercentage = totalNodes > 0 
    ? Math.min(100, Math.round((weightedScore / totalNodes) * 100))
    : 0;

  // Estimated revenue loss based on e-commerce transaction volume
  // Checkout & Payment failed = $12,500/min. API Gateway = $18,000/min. Degraded = $2,400/min.
  let revLoss = 0;
  for (const node of nodes) {
    if (node.status === 'failed') {
      if (node.id === 'payment_service' || node.id === 'checkout') revLoss += 5200;
      else if (node.id === 'api_gateway') revLoss += 7500;
      else if (node.id === 'auth_service' || node.id === 'user_db') revLoss += 3400;
      else revLoss += 1200;
    } else if (node.status === 'degraded') {
      revLoss += 450;
    }
  }

  let overallHealth: 'Nominal' | 'Degraded' | 'Critical Failure' = 'Nominal';
  if (failedCount > 0 || impactPercentage >= 40) {
    overallHealth = 'Critical Failure';
  } else if (degradedCount > 0 || impactPercentage > 0) {
    overallHealth = 'Degraded';
  }

  return {
    totalNodes,
    healthyCount,
    degradedCount,
    failedCount,
    mitigatedCount,
    impactPercentage,
    spofCompromisedCount,
    spofTotalCount,
    estimatedRevenueLossPerMin: revLoss,
    overallHealth
  };
}
