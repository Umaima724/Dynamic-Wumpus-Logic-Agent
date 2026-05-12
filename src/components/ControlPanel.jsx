import React from 'react';
import { Play, Pause, RotateCcw, Settings, Grid3X3, Zap, Eye, EyeOff } from 'lucide-react';
import './ControlPanel.css';

const AlertTriangleIcon = ({ size }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
    <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
  </svg>
);

const ControlPanel = ({
  rows, cols, onRowsChange, onColsChange, isRunning, onStart, onPause, onReset, onStep,
  stepSpeed, onSpeedChange, revealAll, onRevealToggle, pitProbability, onPitProbabilityChange, gameOver
}) => (
  <div className="control-panel">
    <div className="panel-header">
      <Settings size={18} color="#a78bfa" />
      <h3>Configuration</h3>
    </div>
    <div className="control-section">
      <label className="section-label"><Grid3X3 size={14} />Grid Dimensions</label>
      <div className="dimension-inputs">
        <div className="input-group">
          <label>Rows</label>
          <input type="number" min="3" max="12" value={rows}
            onChange={(e) => onRowsChange(Math.max(3, Math.min(12, parseInt(e.target.value) || 3)))}
            disabled={isRunning} className="dimension-input" />
        </div>
        <span className="dimension-separator">×</span>
        <div className="input-group">
          <label>Cols</label>
          <input type="number" min="3" max="12" value={cols}
            onChange={(e) => onColsChange(Math.max(3, Math.min(12, parseInt(e.target.value) || 3)))}
            disabled={isRunning} className="dimension-input" />
        </div>
      </div>
    </div>
    <div className="control-section">
      <label className="section-label"><AlertTriangleIcon size={14} />Pit Probability</label>
      <div className="slider-group">
        <input type="range" min="0" max="0.4" step="0.05" value={pitProbability}
          onChange={(e) => onPitProbabilityChange(parseFloat(e.target.value))}
          disabled={isRunning} className="slider" />
        <span className="slider-value">{(pitProbability * 100).toFixed(0)}%</span>
      </div>
    </div>
    <div className="control-section">
      <label className="section-label"><Zap size={14} />Step Speed</label>
      <div className="speed-buttons">
        {[500, 300, 150, 50].map((speed) => (
          <button key={speed} className={`speed-btn ${stepSpeed === speed ? 'active' : ''}`} onClick={() => onSpeedChange(speed)}>
            {speed >= 400 ? 'Slow' : speed >= 200 ? 'Normal' : speed >= 100 ? 'Fast' : 'Instant'}
          </button>
        ))}
      </div>
    </div>
    <div className="control-section">
      <button className={`toggle-btn ${revealAll ? 'active' : ''}`} onClick={onRevealToggle}>
        {revealAll ? <Eye size={16} /> : <EyeOff size={16} />}
        {revealAll ? 'Hide Hazards' : 'Reveal All'}
      </button>
    </div>
    <div className="action-buttons">
      {!isRunning ? (
        <button className="action-btn primary" onClick={onStart} disabled={gameOver}>
          <Play size={18} />Start Agent
        </button>
      ) : (
        <button className="action-btn secondary" onClick={onPause}>
          <Pause size={18} />Pause
        </button>
      )}
      <button className="action-btn tertiary" onClick={onStep} disabled={isRunning || gameOver}>
        <Zap size={18} />Step
      </button>
      <button className="action-btn danger" onClick={onReset}>
        <RotateCcw size={18} />Reset
      </button>
    </div>
  </div>
);

export default ControlPanel;