export type ServiceStatus = 'healthy' | 'degraded' | 'failed' | 'mitigated';

export type ServiceTier = 'Edge' | 'Ingress' | 'Identity' | 'Commerce' | 'Transaction' | 'Fulfillment' | 'Async' | 'Database';

export type DependencyType = 'hard' | 'soft' | 'cacheable';

export interface MicroserviceNode {
  id: string;
  name: string;
  tier: ServiceTier;
  role: string;
  description: string;
  x: number; // canvas percent or coordinate
  y: number;
  status: ServiceStatus;
  isSPOF: boolean; // Single Point of Failure
  spofReason?: string;
  defaultLatencyMs: number;
  currentLatencyMs: number;
  errorRatePercent: number; // 0 to 100
  mitigationAvailable: boolean;
  mitigationName: string;
  mitigationDescription: string;
  isMitigationActive: boolean;
  hopLevel?: number; // BFS Hop distance from root failure
  failureReason?: string;
  technology: string;
  cluster: string;
  endpoints: string[];
}

export interface DependencyEdge {
  id: string;
  from: string; // Caller / Dependent
  to: string;   // Dependency / Callee
  type: DependencyType;
  label: string;
  impactOnFailure: 'critical' | 'degradation' | 'cached';
  circuitBreakerSupported: boolean;
  active: boolean; // false if circuit breaker opened / bypassed
}

export interface LogEntry {
  id: string;
  timestamp: string;
  hop?: number;
  serviceId?: string;
  serviceName?: string;
  type: 'info' | 'warn' | 'error' | 'mitigation' | 'system';
  message: string;
  detail?: string;
}

export interface BlastRadiusMetrics {
  totalNodes: number;
  healthyCount: number;
  degradedCount: number;
  failedCount: number;
  mitigatedCount: number;
  impactPercentage: number;
  spofCompromisedCount: number;
  spofTotalCount: number;
  estimatedRevenueLossPerMin: number;
  overallHealth: 'Nominal' | 'Degraded' | 'Critical Failure';
}

export interface Scenario {
  id: string;
  title: string;
  shortLabel: string;
  description: string;
  targetRootNodeId: string;
  rootCauseMessage: string;
  initialSeverity?: 'failed' | 'degraded';
  simulatedLatencyMs?: number;
}
