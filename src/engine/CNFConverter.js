import { TOKENS } from './KnowledgeBase';

/**
 * Deep copy an AST node.
 */
function copyNode(node) {
  if (!node) return null;
  if (node.type === 'ATOM') {
    return { type: 'ATOM', name: node.name };
  }
  if (node.type === 'NOT') {
    return { type: 'NOT', operand: copyNode(node.operand) };
  }
  return {
    type: node.type,
    left: copyNode(node.left),
    right: copyNode(node.right)
  };
}

/**
 * Step 1: Eliminate biconditionals (A <=> B) -> ((A => B) & (B => A))
 */
function eliminateIFF(node) {
  if (!node) return null;
  
  if (node.type === 'ATOM') return node;
  if (node.type === 'NOT') {
    return { type: 'NOT', operand: eliminateIFF(node.operand) };
  }
  
  const left = eliminateIFF(node.left);
  const right = eliminateIFF(node.right);
  
  if (node.type === 'IFF') {
    // A <=> B  ===  (A => B) & (B => A)
    return {
      type: 'AND',
      left: { type: 'IMPLIES', left: copyNode(left), right: copyNode(right) },
      right: { type: 'IMPLIES', left: right, right: left }
    };
  }
  
  return { type: node.type, left, right };
}

/**
 * Step 2: Eliminate implications (A => B) -> (~A | B)
 */
function eliminateImplications(node) {
  if (!node) return null;
  
  if (node.type === 'ATOM') return node;
  if (node.type === 'NOT') {
    return { type: 'NOT', operand: eliminateImplications(node.operand) };
  }
  
  const left = eliminateImplications(node.left);
  const right = eliminateImplications(node.right);
  
  if (node.type === 'IMPLIES') {
    // A => B  ===  ~A | B
    return {
      type: 'OR',
      left: { type: 'NOT', operand: left },
      right: right
    };
  }
  
  return { type: node.type, left, right };
}

/**
 * Step 3: Move negations inward using De Morgan's laws and double negation.
 */
function moveNegationInward(node) {
  if (!node) return null;
  
  if (node.type === 'ATOM') return node;
  
  if (node.type === 'NOT') {
    const inner = node.operand;
    
    if (inner.type === 'ATOM') {
      return node; // ~P stays as ~P
    }
    
    if (inner.type === 'NOT') {
      // ~~A -> A
      return moveNegationInward(inner.operand);
    }
    
    if (inner.type === 'AND') {
      // ~(A & B) -> (~A | ~B)
      return moveNegationInward({
        type: 'OR',
        left: { type: 'NOT', operand: inner.left },
        right: { type: 'NOT', operand: inner.right }
      });
    }
    
    if (inner.type === 'OR') {
      // ~(A | B) -> (~A & ~B)
      return moveNegationInward({
        type: 'AND',
        left: { type: 'NOT', operand: inner.left },
        right: { type: 'NOT', operand: inner.right }
      });
    }
    
    // For other cases, recursively process
    return { type: 'NOT', operand: moveNegationInward(inner) };
  }
  
  // For AND and OR, recursively process children
  return {
    type: node.type,
    left: moveNegationInward(node.left),
    right: moveNegationInward(node.right)
  };
}

/**
 * Step 4: Distribute OR over AND to get CNF.
 * (A | (B & C)) -> ((A | B) & (A | C))
 */
function distributeORoverAND(node) {
  if (!node) return null;
  
  if (node.type === 'ATOM') return node;
  if (node.type === 'NOT') {
    return { type: 'NOT', operand: distributeORoverAND(node.operand) };
  }
  
  const left = distributeORoverAND(node.left);
  const right = distributeORoverAND(node.right);
  
  if (node.type === 'OR') {
    // If left is AND: (A & B) | C -> ((A | C) & (B | C))
    if (left.type === 'AND') {
      return {
        type: 'AND',
        left: distributeORoverAND({ type: 'OR', left: left.left, right: copyNode(right) }),
        right: distributeORoverAND({ type: 'OR', left: left.right, right: right })
      };
    }
    // If right is AND: A | (B & C) -> ((A | B) & (A | C))
    if (right.type === 'AND') {
      return {
        type: 'AND',
        left: distributeORoverAND({ type: 'OR', left: copyNode(left), right: right.left }),
        right: distributeORoverAND({ type: 'OR', left: left, right: right.right })
      };
    }
  }
  
  return { type: node.type, left, right };
}

/**
 * Helper: Deep copy a node.
 */
function copyNode(node) {
  if (!node) return null;
  if (node.type === 'ATOM') return { type: 'ATOM', name: node.name };
  if (node.type === 'NOT') return { type: 'NOT', operand: copyNode(node.operand) };
  return { type: node.type, left: copyNode(node.left), right: copyNode(node.right) };
}

/**
 * Extract all clauses from a CNF AST.
 * Returns an array of clauses, where each clause is an array of literals.
 * A literal is { name: string, negated: boolean }
 */
function extractClauses(node) {
  if (!node) return [];
  
  if (node.type === 'AND') {
    return [...extractClauses(node.left), ...extractClauses(node.right)];
  }
  
  // Single clause (disjunction of literals)
  const literals = [];
  extractLiterals(node, literals);
  return [literals];
}

/**
 * Extract literals from a disjunction node.
 */
function extractLiterals(node, literals) {
  if (!node) return;
  
  if (node.type === 'OR') {
    extractLiterals(node.left, literals);
    extractLiterals(node.right, literals);
  } else if (node.type === 'ATOM') {
    literals.push({ name: node.name, negated: false });
  } else if (node.type === 'NOT' && node.operand.type === 'ATOM') {
    literals.push({ name: node.operand.name, negated: true });
  }
}

/**
 * Convert a sentence AST to CNF clause set.
 * Returns { clauses: Array<Array<{name, negated}>>, steps: Array<string> }
 */
export function toCNF(ast) {
  const steps = [];
  
  // Step 1: Eliminate IFF
  let node = eliminateIFF(copyNode(ast));
  steps.push('Eliminated biconditionals');
  
  // Step 2: Eliminate implications
  node = eliminateImplications(node);
  steps.push('Eliminated implications');
  
  // Step 3: Move negations inward
  node = moveNegationInward(node);
  steps.push('Applied De Morgan\'s laws and double negation elimination');
  
  // Step 4: Distribute OR over AND
  node = distributeORoverAND(node);
  steps.push('Distributed OR over AND');
  
  // Step 5: Extract clauses
  const clauses = extractClauses(node);
  steps.push(`Extracted ${clauses.length} clause(s)`);
  
  return { clauses, steps };
}

/**
 * Convert multiple sentences to a combined CNF clause set.
 */
export function sentencesToCNF(asts) {
  const allClauses = [];
  const allSteps = [];
  
  for (const ast of asts) {
    const { clauses, steps } = toCNF(ast);
    allClauses.push(...clauses);
    allSteps.push(...steps);
  }
  
  return { clauses: allClauses, steps: allSteps };
}

/**
 * Convert a clause to a readable string.
 */
export function clauseToString(clause) {
  if (clause.length === 0) return '□ (empty clause)';
  return clause.map(lit => lit.negated ? `~${lit.name}` : lit.name).join(' | ');
}

/**
 * Check if a clause is a tautology (contains both P and ~P).
 */
export function isTautology(clause) {
  const pos = new Set();
  const neg = new Set();
  for (const lit of clause) {
    if (lit.negated) neg.add(lit.name);
    else pos.add(lit.name);
  }
  for (const p of pos) {
    if (neg.has(p)) return true;
  }
  return false;
}

/**
 * Simplify clauses by removing duplicates and tautologies.
 */
export function simplifyClauses(clauses) {
  const seen = new Set();
  const result = [];
  
  for (const clause of clauses) {
    if (isTautology(clause)) continue;
    
    // Remove duplicate literals within a clause
    const unique = [];
    const added = new Set();
    for (const lit of clause) {
      const key = `${lit.negated ? '~' : ''}${lit.name}`;
      if (!added.has(key)) {
        added.add(key);
        unique.push(lit);
      }
    }
    
    // Sort for consistent comparison
    unique.sort((a, b) => {
      const aStr = `${a.negated ? '~' : ''}${a.name}`;
      const bStr = `${b.negated ? '~' : ''}${b.name}`;
      return aStr.localeCompare(bStr);
    });
    
    const key = JSON.stringify(unique.map(l => `${l.negated ? '~' : ''}${l.name}`));
    if (!seen.has(key)) {
      seen.add(key);
      result.push(unique);
    }
  }
  
  return result;
}