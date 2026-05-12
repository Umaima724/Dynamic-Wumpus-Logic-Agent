export const CELL_TYPES = { EMPTY: 'empty', PIT: 'pit', WUMPUS: 'wumpus', START: 'start' };
export const PERCEPTS = { BREEZE: 'breeze', STENCH: 'stench', GLITTER: 'glitter', BUMP: 'bump', SCREAM: 'scream' };

export class WumpusWorld {
  constructor(rows, cols, pitProbability = 0.2) {
    this.rows = rows; this.cols = cols; this.pitProbability = pitProbability;
    this.grid = []; this.agentPos = { row: 0, col: 0 };
    this.agentAlive = true; this.wumpusAlive = true;
    this.wumpusPos = null; this.goldFound = false; this.wumpusKilled = false;
    this.generateWorld();
  }

  generateWorld() {
    this.grid = Array(this.rows).fill(null).map(() => Array(this.cols).fill(CELL_TYPES.EMPTY));
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        if (r === 0 && c === 0) continue;
        if (Math.random() < this.pitProbability) this.grid[r][c] = CELL_TYPES.PIT;
      }
    }
    let wumpusPlaced = false, attempts = 0;
    while (!wumpusPlaced && attempts < 1000) {
      const r = Math.floor(Math.random() * this.rows);
      const c = Math.floor(Math.random() * this.cols);
      if ((r !== 0 || c !== 0) && this.grid[r][c] === CELL_TYPES.EMPTY) {
        this.grid[r][c] = CELL_TYPES.WUMPUS;
        this.wumpusPos = { row: r, col: c };
        wumpusPlaced = true;
      }
      attempts++;
    }
    this.grid[0][0] = CELL_TYPES.START;
    this.agentPos = { row: 0, col: 0 };
  }

  getCell(row, col) {
    if (row < 0 || row >= this.rows || col < 0 || col >= this.cols) return null;
    return this.grid[row][col];
  }

  getAdjacentCells(row, col) {
    const adjacent = [], directions = [{ dr: -1, dc: 0 }, { dr: 1, dc: 0 }, { dr: 0, dc: -1 }, { dr: 0, dc: 1 }];
    for (const dir of directions) {
      const nr = row + dir.dr, nc = col + dir.dc;
      if (nr >= 0 && nr < this.rows && nc >= 0 && nc < this.cols) adjacent.push({ row: nr, col: nc });
    }
    return adjacent;
  }

  getPercepts(row, col) {
    const percepts = [], adjacent = this.getAdjacentCells(row, col);
    let hasBreeze = false, hasStench = false;
    for (const cell of adjacent) {
      if (this.grid[cell.row][cell.col] === CELL_TYPES.PIT) hasBreeze = true;
      if (this.grid[cell.row][cell.col] === CELL_TYPES.WUMPUS) hasStench = true;
    }
    if (hasBreeze) percepts.push(PERCEPTS.BREEZE);
    if (hasStench) percepts.push(PERCEPTS.STENCH);
    return percepts;
  }

  getAgentPercepts() { return this.getPercepts(this.agentPos.row, this.agentPos.col); }

  moveAgent(row, col) {
    if (row < 0 || row >= this.rows || col < 0 || col >= this.cols)
      return { success: false, died: false, percepts: [], bump: true };
    this.agentPos = { row, col };
    const cellType = this.grid[row][col];
    const percepts = this.getPercepts(row, col);
    const died = (cellType === CELL_TYPES.PIT) || (cellType === CELL_TYPES.WUMPUS && this.wumpusAlive);
    if (died) this.agentAlive = false;
    return { success: true, died, percepts, bump: false };
  }

  isWumpusCell(row, col) { return this.wumpusPos && this.wumpusPos.row === row && this.wumpusPos.col === col; }
  isPitCell(row, col) { return this.grid[row][col] === CELL_TYPES.PIT; }
  reset() { this.agentAlive = true; this.wumpusAlive = true; this.goldFound = false; this.wumpusKilled = false; this.generateWorld(); }
  getGridState() { return this.grid.map(row => [...row]); }
}