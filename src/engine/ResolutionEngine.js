/**
 * ResolutionEngine.js
 * Automated Resolution Refutation for Propositional Logic
 */

import { sentencesToCNF, simplifyClauses, clauseToString } from './CNFConverter';

function resolve(clause1, clause2) {
  for (let i = 0; i < clause1.length; i++) {
    for (let j = 0; j < clause2.length; j++) {
      const lit1 = clause1[i], lit2 = clause2[j];
      if (lit1.name === lit2.name && lit1.negated !== lit2.negated) {
        const resolvent = [];
        for (let k = 0; k < clause1.length; k++) if (k !== i) resolvent.push({ ...clause1[k] });
        for (let k = 0; k < clause2.length; k++) if (k !== j) resolvent.push({ ...clause2[k] });
        return resolvent;
      }
    }
  }
  return null;
}

export function resolutionRefutation(kbSentences, queryLiterals, maxSteps = 10000) {
  let inferenceSteps = 0;
  const trace = [];
  const { clauses: kbClauses } = sentencesToCNF(kbSentences);
  trace.push(`Converted KB to CNF: ${kbClauses.length} clauses`);

  const allClauses = [...kbClauses.map(c => c.map(l => ({ ...l })))];
  for (const lit of queryLiterals) {
    allClauses.push([{ name: lit.name, negated: !lit.negated }]);
    trace.push(`Added negation: ${clauseToString([{ name: lit.name, negated: !lit.negated }])}`);
  }

  let clauses = simplifyClauses(allClauses);
  trace.push(`Simplified to ${clauses.length} unique clauses`);

  const newClauses = [];
  let addedNew = true, iteration = 0;

  while (addedNew && inferenceSteps < maxSteps) {
    addedNew = false; iteration++;
    const n = clauses.length;
    for (let i = 0; i < n && inferenceSteps < maxSteps; i++) {
      for (let j = i + 1; j < n && inferenceSteps < maxSteps; j++) {
        inferenceSteps++;
        const resolvent = resolve(clauses[i], clauses[j]);
        if (resolvent !== null) {
          if (resolvent.length === 0) {
            trace.push(`Step ${inferenceSteps}: □ EMPTY CLAUSE - CONTRADICTION!`);
            return { proven: true, steps: inferenceSteps, trace, emptyClauseFound: true, finalClauses: clauses };
          }
          const resolventStr = JSON.stringify(resolvent.map(l => `${l.negated ? '~' : ''}${l.name}`).sort());
          const existingStrs = new Set(clauses.map(c => JSON.stringify(c.map(l => `${l.negated ? '~' : ''}${l.name}`).sort())));
          if (!existingStrs.has(resolventStr)) {
            newClauses.push(resolvent);
            if (trace.length < 50) trace.push(`Step ${inferenceSteps}: ${clauseToString(clauses[i])} + ${clauseToString(clauses[j])} → ${clauseToString(resolvent)}`);
            addedNew = true;
          }
        }
      }
    }
    if (newClauses.length > 0) { clauses = simplifyClauses([...clauses, ...newClauses]); newClauses.length = 0; }
    if (iteration > 500) { trace.push('Iteration limit reached.'); break; }
  }

  trace.push(`Completed: ${inferenceSteps} steps. No contradiction.`);
  return { proven: false, steps: inferenceSteps, trace, emptyClauseFound: false, finalClauses: clauses };
}

export function isCellSafe(kb, row, col) {
  const pitQuery = [{ name: `P_${row},${col}`, negated: true }];
  const wumpusQuery = [{ name: `W_${row},${col}`, negated: true }];
  const sentences = kb.getSentences();
  const pitResult = resolutionRefutation(sentences, pitQuery, 5000);
  const wumpusResult = resolutionRefutation(sentences, wumpusQuery, 5000);
  return {
    safe: pitResult.proven && wumpusResult.proven,
    pitProven: pitResult.proven, wumpusProven: wumpusResult.proven,
    steps: pitResult.steps + wumpusResult.steps,
    trace: [`=== Proving ¬P_${row},${col} ===`, ...pitResult.trace, ``, `=== Proving ¬W_${row},${col} ===`, ...wumpusResult.trace]
  };
}

export function isCellDangerous(kb, row, col) {
  const sentences = kb.getSentences();
  const pitResult = resolutionRefutation(sentences, [{ name: `P_${row},${col}`, negated: false }], 3000);
  const wumpusResult = resolutionRefutation(sentences, [{ name: `W_${row},${col}`, negated: false }], 3000);
  return { hasPit: pitResult.proven, hasWumpus: wumpusResult.proven, steps: pitResult.steps + wumpusResult.steps };
}

export { clauseToString };