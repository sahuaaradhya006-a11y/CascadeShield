import React, { useState, useEffect, useRef } from 'react';
import { Terminal, Copy, Check, Trash2, Filter, AlertCircle, AlertTriangle, ShieldCheck, ChevronRight } from 'lucide-react';
import { LogEntry } from '../types/simulator';

interface CausalTraceLogProps {
  logs: LogEntry[];
  onClearLogs: () => void;
}

export const CausalTraceLog: React.FC<CausalTraceLogProps> = ({
  logs,
  onClearLogs
}) => {
  const [filterType, setFilterType] = useState<'all' | 'error' | 'warn' | 'mitigation'>('all');
  const [copied, setCopied] = useState(false);
  const [autoScroll, setAutoScroll] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (autoScroll && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs, autoScroll]);

  const filteredLogs = logs.filter(log => {
    if (filterType === 'all') return true;
    return log.type === filterType;
  });

  const handleCopyLogs = () => {
    const text = filteredLogs
      .map(l => `[${l.timestamp}] ${l.message} ${l.detail ? `— ${l.detail}` : ''}`)
      .join('\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col h-full bg-[#050811] rounded-lg border border-[#1b253b] overflow-hidden text-slate-300">
      {/* Terminal Title Bar */}
      <div className="flex items-center justify-between px-3.5 py-2 bg-[#090e1c] border-b border-[#1b253b] text-xs">
        <div className="flex items-center gap-2">
          {/* Mac-style window controls */}
          <div className="flex items-center gap-1.5 mr-2">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500/80 inline-block" />
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80 inline-block" />
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80 inline-block" />
          </div>
          <Terminal className="w-3.5 h-3.5 text-cyan-400" />
          <span className="font-mono text-[11px] font-semibold text-slate-200 tracking-wide">
            Causal Trace Log & BFS Propagation Stream
          </span>
          <span className="font-mono text-[10px] text-slate-400 px-1.5 py-0.2 rounded bg-slate-800">
            {filteredLogs.length} events
          </span>
        </div>

        {/* Filter & Action Controls */}
        <div className="flex items-center gap-2">
          {/* Filter segment */}
          <div className="flex items-center bg-slate-950/80 p-0.5 rounded border border-slate-800 text-[10px] font-mono">
            <button
              onClick={() => setFilterType('all')}
              className={`px-2 py-0.5 rounded transition-colors ${
                filterType === 'all' ? 'bg-slate-800 text-white font-semibold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilterType('error')}
              className={`px-2 py-0.5 rounded transition-colors ${
                filterType === 'error' ? 'bg-red-950 text-red-300 font-semibold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Errors
            </button>
            <button
              onClick={() => setFilterType('warn')}
              className={`px-2 py-0.5 rounded transition-colors ${
                filterType === 'warn' ? 'bg-amber-950 text-amber-300 font-semibold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Degraded
            </button>
            <button
              onClick={() => setFilterType('mitigation')}
              className={`px-2 py-0.5 rounded transition-colors ${
                filterType === 'mitigation' ? 'bg-emerald-950 text-emerald-300 font-semibold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Mitigations
            </button>
          </div>

          <label className="flex items-center gap-1 text-[10px] text-slate-400 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={autoScroll}
              onChange={e => setAutoScroll(e.target.checked)}
              className="rounded bg-slate-900 border-slate-700 text-cyan-500 w-3 h-3"
            />
            <span>Scroll</span>
          </label>

          <button
            onClick={handleCopyLogs}
            className="flex items-center gap-1 px-2 py-1 text-[11px] font-mono rounded bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 transition-colors"
            title="Copy trace log to clipboard"
          >
            {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>

          <button
            onClick={onClearLogs}
            className="p-1 text-slate-400 hover:text-red-400 rounded hover:bg-slate-800 transition-colors"
            title="Clear terminal log"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Terminal Output Stream */}
      <div
        ref={scrollRef}
        className="flex-1 p-3 font-mono text-[11px] leading-relaxed overflow-y-auto space-y-1.5 select-text"
        style={{ minHeight: '140px', maxHeight: '240px' }}
      >
        {filteredLogs.length === 0 ? (
          <div className="text-slate-500 italic py-4 text-center">
            &gt; Terminal stream ready. Click a microservice or run a scenario above to simulate cascading failure trace.
          </div>
        ) : (
          filteredLogs.map(log => {
            let textColor = 'text-slate-300';
            let badgeBg = 'bg-slate-800 text-slate-400';
            let hopColor = 'text-cyan-400';

            if (log.type === 'error') {
              textColor = 'text-red-300';
              badgeBg = 'bg-red-950/80 text-red-400 border border-red-800/80';
              hopColor = 'text-red-400';
            } else if (log.type === 'warn') {
              textColor = 'text-amber-300';
              badgeBg = 'bg-amber-950/80 text-amber-400 border border-amber-800/80';
              hopColor = 'text-amber-400';
            } else if (log.type === 'mitigation') {
              textColor = 'text-emerald-300';
              badgeBg = 'bg-emerald-950/80 text-emerald-400 border border-emerald-800/80';
              hopColor = 'text-emerald-400';
            }

            return (
              <div key={log.id} className="flex items-start gap-2 group hover:bg-slate-900/60 p-1 rounded transition-colors">
                <span className="text-slate-500 shrink-0 select-none">
                  {log.timestamp}
                </span>

                {log.hop !== undefined && (
                  <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold shrink-0 ${badgeBg}`}>
                    HOP {log.hop}
                  </span>
                )}

                <div className="flex-1">
                  <span className={`font-semibold ${textColor}`}>
                    {log.message}
                  </span>
                  {log.detail && (
                    <div className="text-slate-400 text-[10.5px] mt-0.5 pl-2 border-l border-slate-700/60">
                      {log.detail}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
