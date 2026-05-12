import React from 'react';
import './Grid.css';

const Grid = ({ world, agentState, revealAll = false }) => {
  const { rows, cols } = world;
  const { pos: agentPos, visited, safe, dangerous, frontier, percepts } = agentState;
  const visitedSet = new Set(visited), safeSet = new Set(safe);
  const dangerousSet = new Set(dangerous), frontierSet = new Set(frontier);

  const getCellInfo = (row, col) => {
    const key = `${row},${col}`;
    return {
      cellType: world.getCell(row, col),
      isVisited: visitedSet.has(key), isSafe: safeSet.has(key),
      isDangerous: dangerousSet.has(key), isFrontier: frontierSet.has(key),
      isAgent: agentPos && agentPos.row === row && agentPos.col === col,
      percepts: (visitedSet.has(key) || revealAll) ? world.getPercepts(row, col) : []
    };
  };

  const getCellClass = (info) => {
    const classes = ['cell'];
    if (info.isAgent) classes.push('cell-agent');
    else if (info.isDangerous && (info.isVisited || revealAll)) classes.push('cell-dangerous');
    else if (info.isVisited) classes.push('cell-visited');
    else if (info.isSafe) classes.push('cell-safe');
    else if (info.isFrontier) classes.push('cell-frontier');
    else classes.push('cell-unknown');
    return classes.join(' ');
  };

  const getHazardIcon = (cellType) => {
    switch (cellType) {
      case 'pit': return '🕳️'; case 'wumpus': return '👹';
      case 'start': return '🏠'; default: return null;
    }
  };

  const getPerceptIcons = (percepts) => {
    const icons = [];
    if (percepts.includes('breeze')) icons.push('💨');
    if (percepts.includes('stench')) icons.push('👃');
    return icons;
  };

  return (
    <div className="grid-container">
      <div className="grid" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)`, gridTemplateRows: `repeat(${rows}, 1fr)` }}>
        {Array.from({ length: rows }, (_, r) =>
          Array.from({ length: cols }, (_, c) => {
            const info = getCellInfo(r, c);
            const hazardIcon = (info.isVisited || revealAll) ? getHazardIcon(info.cellType) : null;
            const perceptIcons = getPerceptIcons(info.percepts);
            return (
              <div key={`${r}-${c}`} className={getCellClass(info)} data-row={r} data-col={c}>
                <div className="cell-coords">{r},{c}</div>
                {hazardIcon && <div className="cell-hazard">{hazardIcon}</div>}
                {perceptIcons.length > 0 && (
                  <div className="cell-percepts">
                    {perceptIcons.map((icon, i) => <span key={i} className="percept-icon">{icon}</span>)}
                  </div>
                )}
                {info.isAgent && <div className="agent-marker">🤖</div>}
                {!info.isAgent && info.isVisited && <div className="cell-status">✓</div>}
                {!info.isVisited && info.isSafe && <div className="cell-status safe-badge">S</div>}
                {!info.isVisited && info.isDangerous && <div className="cell-status danger-badge">!</div>}
              </div>
            );
          })
        )}
      </div>
      <div className="grid-legend">
        <div className="legend-item"><div className="legend-color cell-visited"></div><span>Visited</span></div>
        <div className="legend-item"><div className="legend-color cell-safe"></div><span>Proven Safe</span></div>
        <div className="legend-item"><div className="legend-color cell-frontier"></div><span>Frontier</span></div>
        <div className="legend-item"><div className="legend-color cell-dangerous"></div><span>Confirmed Danger</span></div>
        <div className="legend-item"><div className="legend-color cell-unknown"></div><span>Unknown</span></div>
        <div className="legend-item"><span>🤖 Agent</span></div>
        <div className="legend-item"><span>🕳️ Pit</span></div>
        <div className="legend-item"><span>👹 Wumpus</span></div>
        <div className="legend-item"><span>💨 Breeze</span></div>
        <div className="legend-item"><span>👃 Stench</span></div>
      </div>
    </div>
  );
};

export default Grid;