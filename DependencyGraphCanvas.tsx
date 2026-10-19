import React, { useState } from 'react';
import { 
  Globe, Server, KeyRound, Database, Package, ShoppingCart, 
  CreditCard, Layers, Truck, Bell, AlertTriangle, ShieldCheck, 
  Flame, Zap, Info, ArrowRight, CornerDownRight, CheckCircle2
} from 'lucide-react';
import { MicroserviceNode, DependencyEdge, ServiceStatus } from '../types/simulator';

interface DependencyGraphCanvasProps {
  nodes: MicroserviceNode[];
  edges: DependencyEdge[];
  selectedNodeId: string | null;
  onSelectNode: (nodeId: string) => void;
  onToggleFailNode: (nodeId: string) => void;
  onActivateMitigation: (nodeId: string) => void;
  activeHop: number | null;
}

export const DependencyGraphCanvas: React.FC<DependencyGraphCanvasProps> = ({
  nodes,
  edges,
  selectedNodeId,
  onSelectNode,
  onToggleFailNode,
  onActivateMitigation,
  activeHop
}) => {
  const [hoveredEdgeId, setHoveredEdgeId] = useState<string | null>(null);

  // Icon mapping
  const getIcon = (id: string, className: string = 'w-4 h-4') => {
    switch (id) {
      case 'cdn': return <Globe className={className} />;
      case 'api_gateway': return <Server className={className} />;
      case 'auth_service': return <KeyRound className={className} />;
      case 'user_db': return <Database className={className} />;
      case 'product_catalog': return <Package className={className} />;
      case 'cart': return <ShoppingCart className={className} />;
      case 'payment_service': return <CreditCard className={className} />;
      case 'checkout': return <Layers className={className} />;
      case 'order_service': return <Truck className={className} />;
      case 'notification_engine': return <Bell className={className} />;
      default: return <Server className={className} />;
    }
  };

  const nodeMap = new Map(nodes.map(n => [n.id, n]));

  // Calculate smooth SVG curve between nodes
  const calculatePath = (fromNode: MicroserviceNode, toNode: MicroserviceNode) => {
    // Card width: 170, height: 96
    const halfW = 85;
    const halfH = 48;

    let startX = fromNode.x;
    let startY = fromNode.y;
    let endX = toNode.x;
    let endY = toNode.y;

    // Determine connection ports based on relative positions
    if (toNode.x > fromNode.x + 80) {
      // Flowing left to right
      startX = fromNode.x + halfW;
      startY = fromNode.y;
      endX = toNode.x - halfW;
      endY = toNode.y;
    } else if (toNode.x < fromNode.x - 80) {
      // Flowing right to left (e.g. checkout back to user_db or similar)
      startX = fromNode.x - halfW;
      startY = fromNode.y;
      endX = toNode.x + halfW;
      endY = toNode.y;
    } else {
      // Mostly vertical
      if (toNode.y > fromNode.y) {
        startX = fromNode.x;
        startY = fromNode.y + halfH;
        endX = toNode.x;
        endY = toNode.y - halfH;
      } else {
        startX = fromNode.x;
        startY = fromNode.y - halfH;
        endX = toNode.x;
        endY = toNode.y + halfH;
      }
    }

    const dx = endX - startX;
    const dy = endY - startY;
    const cx1 = startX + dx * 0.5;
    const cy1 = startY;
    const cx2 = startX + dx * 0.5;
    const cy2 = endY;

    return `M ${startX} ${startY} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${endX} ${endY}`;
  };

  // Determine edge color and status
  const getEdgeState = (edge: DependencyEdge) => {
    const fromNode = nodeMap.get(edge.from);
    const toNode = nodeMap.get(edge.to);

    if (!fromNode || !toNode) {
      return { stroke: '#334155', marker: 'url(#arrow-dim)', isCascading: false, isMitigated: false };
    }

    // If toNode (dependency) failed, edge is transmitting failure back to fromNode!
    if (toNode.status === 'failed') {
      if (toNode.isMitigationActive) {
        return { stroke: '#10b981', marker: 'url(#arrow-green)', isCascading: false, isMitigated: true };
      }
      return { stroke: '#ef4444', marker: 'url(#arrow-red)', isCascading: true, isMitigated: false };
    }

    if (toNode.status === 'degraded' || fromNode.status === 'degraded') {
      return { stroke: '#f59e0b', marker: 'url(#arrow-amber)', isCascading: true, isMitigated: false };
    }

    if (toNode.status === 'mitigated' || fromNode.status === 'mitigated') {
      return { stroke: '#10b981', marker: 'url(#arrow-green)', isCascading: false, isMitigated: true };
    }

    // Default healthy nominal edge
    return { stroke: '#0891b2', marker: 'url(#arrow-cyan)', isCascading: false, isMitigated: false };
  };

  const [zoomScale, setZoomScale] = useState<number>(1);

  return (
    <div className="relative w-full h-full min-h-[580px] bg-[#070b14] canvas-grid-pattern rounded-lg overflow-hidden border border-[#1b253b] select-none flex flex-col justify-between">
      {/* Top Legend / Status Indicator Overlay & Zoom Controls */}
      <div className="absolute top-3 left-4 right-4 z-10 flex items-center justify-between pointer-events-none">
        <div className="flex items-center gap-3 bg-[#0c1222]/95 backdrop-blur px-3 py-1.5 rounded-md border border-[#1e2a44] text-[11px] text-slate-300 pointer-events-auto shadow-md">
          <span className="font-semibold text-slate-400 uppercase tracking-wider text-[10px]">
            Mesh Topology:
          </span>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-[0_0_8px_#06b6d4]" />
            <span>Nominal</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-[0_0_8px_#f59e0b]" />
            <span>Degraded (Warning)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-[0_0_8px_#ef4444]" />
            <span>Failed / Blocked</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_#10b981]" />
            <span>Mitigated (Bypass)</span>
          </div>
        </div>

        {/* Canvas Zoom Controls */}
        <div className="flex items-center gap-1 bg-[#0c1222]/95 backdrop-blur p-1 rounded-md border border-[#1e2a44] text-xs pointer-events-auto shadow-md">
          <button
            onClick={() => setZoomScale(prev => Math.max(0.75, prev - 0.1))}
            className="w-6 h-6 rounded flex items-center justify-center text-slate-300 hover:text-white hover:bg-slate-800 transition-colors font-mono"
            title="Zoom Out"
          >
            -
          </button>
          <span className="text-[10px] font-mono text-slate-400 px-1 tabular-nums">
            {Math.round(zoomScale * 100)}%
          </span>
          <button
            onClick={() => setZoomScale(prev => Math.min(1.4, prev + 0.1))}
            className="w-6 h-6 rounded flex items-center justify-center text-slate-300 hover:text-white hover:bg-slate-800 transition-colors font-mono"
            title="Zoom In"
          >
            +
          </button>
          <button
            onClick={() => setZoomScale(1)}
            className="px-1.5 py-0.5 rounded text-[10px] text-slate-400 hover:text-white hover:bg-slate-800 transition-colors font-mono"
            title="Reset Zoom"
          >
            Fit
          </button>
        </div>
      </div>

      {/* SVG Canvas for Relationship Lines & Particle Flow */}
      <div className="w-full h-full flex-1 overflow-auto flex items-center justify-center p-2">
        <svg
          className="w-full h-full max-h-[580px] transition-transform duration-300 ease-out"
          style={{ transform: `scale(${zoomScale})`, transformOrigin: 'center center' }}
          viewBox="0 0 1340 540"
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            {/* Glow filters for crisp neon borders */}
            <filter id="glow-red" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#ef4444" floodOpacity="0.6" />
            </filter>
            <filter id="glow-amber" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#f59e0b" floodOpacity="0.5" />
            </filter>
            <filter id="glow-cyan" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor="#06b6d4" floodOpacity="0.3" />
            </filter>

            {/* Arrow markers */}
            <marker id="arrow-cyan" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 1 L 9 5 L 0 9 z" fill="#06b6d4" />
            </marker>
            <marker id="arrow-red" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 1 L 9 5 L 0 9 z" fill="#ef4444" />
            </marker>
            <marker id="arrow-amber" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 1 L 9 5 L 0 9 z" fill="#f59e0b" />
            </marker>
            <marker id="arrow-green" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 1 L 9 5 L 0 9 z" fill="#10b981" />
            </marker>
            <marker id="arrow-dim" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 1 L 9 5 L 0 9 z" fill="#334155" />
            </marker>
          </defs>

        {/* Draw Dependency Edges */}
        {edges.map(edge => {
          const fromNode = nodeMap.get(edge.from);
          const toNode = nodeMap.get(edge.to);
          if (!fromNode || !toNode) return null;

          const pathD = calculatePath(fromNode, toNode);
          const edgeState = getEdgeState(edge);
          const isHovered = hoveredEdgeId === edge.id;

          return (
            <g 
              key={edge.id}
              onMouseEnter={() => setHoveredEdgeId(edge.id)}
              onMouseLeave={() => setHoveredEdgeId(null)}
              className="cursor-pointer"
            >
              {/* Background wider hit target */}
              <path
                d={pathD}
                fill="none"
                stroke="transparent"
                strokeWidth="14"
              />

              {/* Visible dependency edge line */}
              <path
                d={pathD}
                fill="none"
                stroke={edgeState.stroke}
                strokeWidth={isHovered || edgeState.isCascading ? 2.5 : 1.5}
                strokeDasharray={edgeState.isMitigated ? "6,4" : undefined}
                markerEnd={edgeState.marker}
                className="transition-all duration-300"
                opacity={isHovered ? 1 : 0.75}
              />

              {/* Edge animated particle showing data flow or failure ripple */}
              <circle r={edgeState.isCascading ? "3.5" : "2.5"} fill={edgeState.stroke}>
                <animateMotion
                  path={pathD}
                  dur={edgeState.isCascading ? "1.4s" : "3.2s"}
                  repeatCount="indefinite"
                />
              </circle>

              {/* Edge label on hover or when cascading */}
              {(isHovered || edgeState.isCascading) && (
                <text
                  fontSize="9"
                  fill="#94a3b8"
                  fontFamily="JetBrains Mono"
                  textAnchor="middle"
                >
                  <textPath href={`#path-${edge.id}`} startOffset="50%">
                    {edge.label}
                  </textPath>
                </text>
              )}
            </g>
          );
        })}

        {/* Render 10 Interactive Microservice Nodes using foreignObject */}
        {nodes.map(node => {
          const isSelected = selectedNodeId === node.id;
          const isFailed = node.status === 'failed';
          const isDegraded = node.status === 'degraded';
          const isMitigated = node.status === 'mitigated';

          let borderClass = 'border-[#1e2a44] bg-[#0c1324] text-slate-200';
          let glowClass = 'node-healthy-glow';
          let statusBadgeText = 'OK';
          let statusBadgeColor = 'text-cyan-400 bg-cyan-950/60 border-cyan-800/80';

          if (isFailed) {
            borderClass = 'border-red-500 bg-[#1f0b0f] text-red-100';
            glowClass = 'node-failed-glow';
            statusBadgeText = node.hopLevel !== undefined ? `HOP ${node.hopLevel} · CRASH` : 'OFFLINE';
            statusBadgeColor = 'text-red-300 bg-red-950 border-red-600 animate-pulse';
          } else if (isDegraded) {
            borderClass = 'border-amber-500/80 bg-[#1a1309] text-amber-100';
            glowClass = 'node-degraded-glow';
            statusBadgeText = node.hopLevel !== undefined ? `HOP ${node.hopLevel} · DEGRADED` : 'DEGRADED';
            statusBadgeColor = 'text-amber-300 bg-amber-950 border-amber-600';
          } else if (isMitigated) {
            borderClass = 'border-emerald-500/80 bg-[#071914] text-emerald-100';
            glowClass = 'node-mitigated-glow';
            statusBadgeText = 'CIRCUIT OPEN (BYPASS)';
            statusBadgeColor = 'text-emerald-300 bg-emerald-950 border-emerald-600';
          }

          if (isSelected) {
            borderClass += ' ring-2 ring-cyan-400 ring-offset-2 ring-offset-[#070b14]';
          }

          return (
            <foreignObject
              key={node.id}
              x={node.x - 85}
              y={node.y - 48}
              width="170"
              height="96"
              className="overflow-visible"
            >
              <div
                onClick={() => onSelectNode(node.id)}
                className={`w-[170px] h-[96px] rounded-lg border p-2 flex flex-col justify-between transition-all duration-300 cursor-pointer shadow-lg hover:border-cyan-500/80 ${borderClass} ${glowClass}`}
              >
                {/* Header: Tier + Status Indicator */}
                <div className="flex items-center justify-between text-[10px]">
                  <span className="font-mono uppercase font-bold text-slate-400 tracking-wider">
                    {node.tier}
                  </span>
                  
                  <div className="flex items-center gap-1">
                    {node.isSPOF && (
                      <span className="px-1 py-0.2 rounded bg-amber-950/80 text-amber-300 border border-amber-700/60 font-mono font-bold text-[9px] tracking-tight" title="Single Point of Failure">
                        SPOF
                      </span>
                    )}
                    <span className={`px-1.5 py-0.2 rounded font-mono text-[9px] font-semibold border ${statusBadgeColor}`}>
                      {statusBadgeText}
                    </span>
                  </div>
                </div>

                {/* Service Name & Icon */}
                <div className="flex items-center gap-2 my-0.5">
                  <div className={`w-6 h-6 rounded flex items-center justify-center shrink-0 ${
                    isFailed 
                      ? 'bg-red-900/60 text-red-300' 
                      : isDegraded 
                      ? 'bg-amber-900/60 text-amber-300' 
                      : isMitigated 
                      ? 'bg-emerald-900/60 text-emerald-300' 
                      : 'bg-cyan-950 text-cyan-400'
                  }`}>
                    {getIcon(node.id, 'w-3.5 h-3.5')}
                  </div>
                  <span className="text-xs font-bold font-['Plus_Jakarta_Sans'] truncate text-white leading-tight">
                    {node.name}
                  </span>
                </div>

                {/* Metrics & Action Footer */}
                <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono border-t border-slate-800/80 pt-1">
                  <span className="tabular-nums">
                    {node.currentLatencyMs}ms
                  </span>

                  {/* Fast Action Buttons on card */}
                  <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                    {node.status === 'healthy' ? (
                      <button
                        onClick={() => onToggleFailNode(node.id)}
                        className="px-1.5 py-0.5 rounded bg-red-950/80 text-red-300 hover:bg-red-800 border border-red-700/60 text-[9px] font-sans font-medium transition-colors"
                        title={`Inject failure into ${node.name}`}
                      >
                        Fail
                      </button>
                    ) : (
                      <button
                        onClick={() => onActivateMitigation(node.id)}
                        className="px-1.5 py-0.5 rounded bg-emerald-950/80 text-emerald-300 hover:bg-emerald-800 border border-emerald-700/60 text-[9px] font-sans font-medium transition-colors"
                        title="Engage Circuit Breaker mitigation"
                      >
                        Mitigate
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </foreignObject>
          );
        })}
      </svg>
      </div>

      {/* Floating Canvas Quick Tip */}
      <div className="absolute bottom-2.5 right-4 z-10 text-[11px] text-slate-400 flex items-center gap-2 bg-[#0c1222]/80 backdrop-blur px-2.5 py-1 rounded border border-[#1e2a44]">
        <Info className="w-3.5 h-3.5 text-cyan-400" />
        <span>Click any node to inspect & simulate failure propagation</span>
      </div>
    </div>
  );
};
