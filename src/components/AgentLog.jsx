import React, { useRef, useEffect } from 'react';
import { ScrollText, ChevronDown } from 'lucide-react';
import './AgentLog.css';

const AgentLog = ({ log, inferenceTrace }) => {
  const logEndRef = useRef(null);
  useEffect(() => { if (logEndRef.current) logEndRef.current.scrollIntoView({ behavior: 'smooth' }); }, [log, inferenceTrace]);

  const formatEntry = (entry, index) => {
    let type = 'info', icon = '•';
    if (entry.includes('Percept')) { type = 'percept'; icon = '👁'; }
    else if (entry.includes('TOLD')) { type = 'tell'; icon = '📝'; }
    else if (entry.includes('Resolution proved')) { type = 'proof'; icon = '✓'; }
    else if (entry.includes('DANGEROUS')) { type = 'danger'; icon = '⚠'; }
    else if (entry.includes('DIED')) { type = 'death'; icon = '💀'; }
    else if (entry.includes('Initialized')) { type = 'init'; icon = '🚀'; }
    else if (entry.includes('complete')) { type = 'success'; icon = '🏆'; }
    return (
      <div key={index} className={`log-entry log-${type}`}>
        <span className="log-icon">{icon}</span>
        <span className="log-text">{entry}</span>
      </div>
    );
  };

  return (
    <div className="agent-log">
      <div className="log-header">
        <ScrollText size={18} color="#a78bfa" />
        <h3>Agent Reasoning Log</h3>
        <span className="log-count">{log.length} entries</span>
      </div>
      <div className="log-container">
        {log.length === 0 ? (
          <div className="log-empty">
            <p>Agent reasoning will appear here...</p>
            <p className="log-hint">Start the agent to see real-time logic inference</p>
          </div>
        ) : (
          <>
            {log.map((entry, i) => formatEntry(entry, i))}
            {inferenceTrace && inferenceTrace.length > 0 && (
              <div className="inference-trace">
                <div className="trace-header">
                  <span>🔍 Latest Resolution Trace ({inferenceTrace.length} steps)</span>
                </div>
                <div className="trace-entries">
                  {inferenceTrace.slice(-20).map((trace, i) => (
                    <div key={`trace-${i}`} className="trace-entry">
                      <span className="trace-bullet">└─</span>
                      <span className="trace-text">{trace}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div ref={logEndRef} />
          </>
        )}
      </div>
      <div className="log-scroll-hint">
        <ChevronDown size={14} color="#4b5563" />
        <span>Auto-scrolling</span>
      </div>
    </div>
  );
};

export default AgentLog;