import { KnowledgeBase } from './KnowledgeBase';
import { isCellSafe, isCellDangerous } from './ResolutionEngine';
import { PERCEPTS } from './WumpusWorld';

export class Agent {
  constructor(world) {
    this.world = world; this.kb = new KnowledgeBase();
    this.visited = new Set(); this.safe = new Set();
    this.dangerous = new Set(); this.frontier = new Set();
    this.path = []; this.totalInferenceSteps = 0;
    this.currentPercepts = []; this.reasoningLog = [];
    this.gameOver = false; this.won = false; this.died = false;
    this.currentPos = { row: 0, col: 0 };
    this.initializeKB(); this.visitCell(0, 0);
  }

  initializeKB() {
    const { rows, cols } = this.world;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const adjacent = this.world.getAdjacentCells(r, c);
        if (adjacent.length > 0) {
          const pitDisj = adjacent.map(a => `P_${a.row},${a.col}`).join(' | ');
          this.kb.tell(`B_${r},${c} => (${pitDisj})`);
          this.kb.tell(`(${pitDisj}) => B_${r},${c}`);
          const wumpusDisj = adjacent.map(a => `W_${a.row},${a.col}`).join(' | ');
          this.kb.tell(`S_${r},${c} => (${wumpusDisj})`);
          this.kb.tell(`(${wumpusDisj}) => S_${r},${c}`);
        }
        this.kb.tell(`P_${r},${c} => ~W_${r},${c}`);
        this.kb.tell(`W_${r},${c} => ~P_${r},${c}`);
      }
    }
    this.kb.tell('~P_0,0'); this.kb.tell('~W_0,0');
    this.reasoningLog.push('Initialized KB with domain axioms');
  }

  visitCell(row, col) {
    const key = `${row},${col}`;
    if (this.visited.has(key)) return;
    this.visited.add(key); this.safe.add(key);
    this.currentPos = { row, col }; this.path.push({ row, col });
    this.frontier.delete(key);
    const percepts = this.world.getPercepts(row, col);
    this.currentPercepts = percepts;
    const hasBreeze = percepts.includes(PERCEPTS.BREEZE);
    const hasStench = percepts.includes(PERCEPTS.STENCH);
    if (hasBreeze) { this.kb.tell(`B_${row},${col}`); this.reasoningLog.push(`Percept at (${row},${col}): BREEZE`); }
    else { this.kb.tell(`~B_${row},${col}`); this.reasoningLog.push(`Percept at (${row},${col}): No breeze`); }
    if (hasStench) { this.kb.tell(`S_${row},${col}`); this.reasoningLog.push(`Percept at (${row},${col}): STENCH`); }
    else { this.kb.tell(`~S_${row},${col}`); this.reasoningLog.push(`Percept at (${row},${col}): No stench`); }

    const adjacent = this.world.getAdjacentCells(row, col);
    for (const cell of adjacent) {
      const cellKey = `${cell.row},${cell.col}`;
      if (!this.visited.has(cellKey) && !this.dangerous.has(cellKey)) this.frontier.add(cellKey);
    }
    if (!hasBreeze && !hasStench) {
      for (const cell of adjacent) {
        const cellKey = `${cell.row},${cell.col}`;
        this.safe.add(cellKey); this.frontier.delete(cellKey);
        this.reasoningLog.push(`Deduced: (${cell.row},${cell.col}) is safe`);
      }
    }
  }

  checkCellSafety(row, col) {
    const key = `${row},${col}`;
    if (this.safe.has(key)) return { safe: true, steps: 0 };
    if (this.dangerous.has(key)) return { safe: false, steps: 0 };
    const result = isCellSafe(this.kb, row, col);
    this.totalInferenceSteps += result.steps;
    if (result.safe) {
      this.safe.add(key);
      this.reasoningLog.push(`Resolution proved: (${row},${col}) is SAFE (${result.steps} steps)`);
    } else {
      const dangerResult = isCellDangerous(this.kb, row, col);
      this.totalInferenceSteps += dangerResult.steps;
      if (dangerResult.hasPit || dangerResult.hasWumpus) {
        this.dangerous.add(key); this.frontier.delete(key);
        this.reasoningLog.push(`Resolution proved: (${row},${col}) is DANGEROUS`);
      }
    }
    return result;
  }

  decideNextMove() {
    if (this.gameOver) return { action: 'done', target: null };
    const frontierArray = Array.from(this.frontier).map(key => {
      const [r, c] = key.split(',').map(Number);
      return { row: r, col: c, key };
    });
    const safeMoves = [];
    for (const cell of frontierArray) {
      const safety = this.checkCellSafety(cell.row, cell.col);
      if (safety.safe) safeMoves.push(cell);
    }
    if (safeMoves.length > 0) {
      safeMoves.sort((a, b) => {
        const distA = Math.abs(a.row - this.currentPos.row) + Math.abs(a.col - this.currentPos.col);
        const distB = Math.abs(b.row - this.currentPos.row) + Math.abs(b.col - this.currentPos.col);
        return distA - distB;
      });
      return { action: 'move', target: safeMoves[0] };
    }
    if (this.frontier.size === 0) {
      this.reasoningLog.push('No more frontier cells. Exploration complete!');
      this.won = true; this.gameOver = true;
      return { action: 'done', target: null };
    }
    this.reasoningLog.push('No provably safe moves. Agent is stuck.');
    this.gameOver = true;
    return { action: 'done', target: null };
  }

  step() {
    if (this.gameOver) return { done: true };
    const decision = this.decideNextMove();
    if (decision.action === 'done') return { done: true, won: this.won };
    const target = decision.target;
    const result = this.world.moveAgent(target.row, target.col);
    if (result.died) {
      this.died = true; this.gameOver = true;
      this.reasoningLog.push(`Agent DIED at (${target.row},${target.col})!`);
      return { done: true, died: true, pos: target };
    }
    this.visitCell(target.row, target.col);
    return { done: false, pos: target, percepts: result.percepts };
  }

  reset(world) {
    this.world = world; this.kb = new KnowledgeBase();
    this.visited.clear(); this.safe.clear(); this.dangerous.clear();
    this.frontier.clear(); this.path = []; this.totalInferenceSteps = 0;
    this.currentPercepts = []; this.reasoningLog = [];
    this.gameOver = false; this.won = false; this.died = false;
    this.currentPos = { row: 0, col: 0 };
    this.initializeKB(); this.visitCell(0, 0);
  }

  getState() {
    return {
      pos: this.currentPos, visited: Array.from(this.visited),
      safe: Array.from(this.safe), dangerous: Array.from(this.dangerous),
      frontier: Array.from(this.frontier), percepts: this.currentPercepts,
      inferenceSteps: this.totalInferenceSteps, gameOver: this.gameOver,
      won: this.won, died: this.died, path: this.path, kbSize: this.kb.size()
    };
  }
}