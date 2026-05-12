import React from 'react';
import { Brain, Footprints, Shield, AlertTriangle, Activity, Database } from 'lucide-react';
import './MetricsDashboard.css';

const MetricsDashboard = ({ agentState, isRunning }) => {
  const { pos, visited, safe, dangerous, frontier, percepts, inferenceSteps, gameOver, won, died, kbSize } = agentState;
  const visitedCount = visited.length, safeCount = safe.length;
  const dangerousCount = dangerous.length, frontierCount = frontier.length;

  const getStatusInfo = () => {
    if (died) return { text: 'AGENT DIED', color: '#ef4444', icon: AlertTriangle };
    if (won) return { text: 'EXPLORATION COMPLETE', color: '#22c55e', icon: Shield };
    if (gameOver) return { text: 'STUCK - NO SAFE MOVES', color: '#f59e0b', icon: AlertTriangle };
    if (isRunning) return { text: 'EXPLORING...', color: '#60a5fa', icon: Activity };
    return { text: 'READY', color: '#a78bfa', icon: Brain };
  };

  const status = getStatusInfo();
  const StatusIcon = status.icon;

  return (
    <div className="metrics-dashboard">
      <div className="metrics-header">
        <StatusIcon size={18} color={status.color} />
        <span className="status-text" style={{ color: status.color }}>{status.text}</span>
      </div>
      <div className="metrics-grid">
        <div className="metric-card highlight">
          <div className="metric-icon"><Brain size={20} color="#60a5fa" /></div>
          <div className="metric-content">
            <div className="metric-value">{inferenceSteps.toLocaleString()}</div>
            <div className="metric-label">Inference Steps</div>
          </div>
        </div>
        <div className="metric-card percepts-card">
          <div className="metric-icon"><Activity size={20} color="#f59e0b" /></div>
          <div className="metric-content">
            <div className="metric-value percepts-list">
              {percepts.length > 0 ? percepts.map((p, i) => (
                <span key={i} className={`percept-tag percept-${p}`}>
                  {p === 'breeze' ? '💨 BREEZE' : p === 'stench' ? '👃 STENCH' : p.toUpperCase()}
                </span>
              )) : <span className="no-percepts">None</span>}
            </div>
            <div className="metric-label">Current Percepts</div>
          </div>
        </div>
        <div className="metric-card">
          <div className="metric-icon"><Footprints size={20} color="#a78bfa" /></div>
          <div className="metric-content">
            <div className="metric-value">({pos?.row ?? 0}, {pos?.col ?? 0})</div>
            <div className="metric-label">Agent Position</div>
          </div>
        </div>
        <div className="metric-card">
          <div className="metric-icon"><Database size={20} color="#ec4899" /></div>
          <div className="metric-content">
            <div className="metric-value">{kbSize}</div>
            <div className="metric-label">KB Sentences</div>
          </div>
        </div>
        <div className="metric-card">
          <div className="metric-icon"><div className="mini-cell visited"></div></div>
          <div className="metric-content">
            <div className="metric-value">{visitedCount}</div>
            <div className="metric-label">Visited Cells</div>
          </div>
        </div>
        <div className="metric-card">
          <div className="metric-icon"><div className="mini-cell safe"></div></div>
          <div className="metric-content">
            <div className="metric-value">{safeCount}</div>
            <div className="metric-label">Safe Cells</div>
          </div>
        </div>
        <div className="metric-card">
          <div className="metric-icon"><div className="mini-cell dangerous"></div></div>
          <div className="metric-content">
            <div className="metric-value">{dangerousCount}</div>
            <div className="metric-label">Dangerous</div>
          </div>
        </div>
        <div className="metric-card">
          <div className="metric-icon"><div className="mini-cell frontier"></div></div>
          <div className="metric-content">
            <div className="metric-value">{frontierCount}</div>
            <div className="metric-label">Frontier</div>
          </div>
        </div>
      </div>
      <div className="progress-section">
        <div className="progress-label">
          <span>Exploration Progress</span>
          <span>{visitedCount} / {visitedCount + frontierCount + dangerousCount} cells</span>
        </div>
        <div className="progress-bar-bg">
          <div className="progress-bar-fill" style={{ width: `${visitedCount > 0 ? (visitedCount / (visitedCount + frontierCount + dangerousCount) * 100) : 0}%` }} />
        </div>
      </div>
    </div>
  );
};

export default MetricsDashboard;