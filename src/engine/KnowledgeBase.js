// Token types for parsing
const TOKENS = {
  AND: 'AND',
  OR: 'OR',
  NOT: 'NOT',
  IMPLIES: 'IMPLIES',
  IFF: 'IFF',
  LPAREN: 'LPAREN',
  RPAREN: 'RPAREN',
  ATOM: 'ATOM',
  EOF: 'EOF'
};

/**
 * Simple tokenizer for propositional logic expressions.
 * Example: "B_1,1 <=> (P_1,2 | P_2,1)"
 */
function tokenize(input) {
  const tokens = [];
  let i = 0;
  
  while (i < input.length) {
    const ch = input[i];
    
    if (/\s/.test(ch)) {
      i++;
      continue;
    }
    
    if (ch === '(') {
      tokens.push({ type: TOKENS.LPAREN, value: '(' });
      i++;
    } else if (ch === ')') {
      tokens.push({ type: TOKENS.RPAREN, value: ')' });
      i++;
    } else if (ch === '&' || (ch === '∧')) {
      tokens.push({ type: TOKENS.AND, value: '&' });
      i++;
    } else if (ch === '|' || (ch === '∨')) {
      tokens.push({ type: TOKENS.OR, value: '|' });
      i++;
    } else if (ch === '~' || ch === '¬' || ch === '!') {
      tokens.push({ type: TOKENS.NOT, value: '~' });
      i++;
    } else if (input.substring(i, i + 3) === '<=>' || input.substring(i, i + 3) === '<->') {
      tokens.push({ type: TOKENS.IFF, value: '<=>' });
      i += 3;
    } else if (input.substring(i, i + 2) === '=>' || input.substring(i, i + 2) === '->') {
      tokens.push({ type: TOKENS.IMPLIES, value: '=>' });
      i += 2;
    } else if (/[A-Za-z0-9_,]/.test(ch)) {
      let atom = '';
      while (i < input.length && /[A-Za-z0-9_,]/.test(input[i])) {
        atom += input[i];
        i++;
      }
      tokens.push({ type: TOKENS.ATOM, value: atom });
    } else {
      i++;
    }
  }
  
  tokens.push({ type: TOKENS.EOF, value: '' });
  return tokens;
}

/**
 * Parser: converts tokens to an AST.
 * Grammar (precedence low to high):
 *   sentence  := biconditional
 *   biconditional := implication ('<=>' implication)*
 *   implication   := disjunction ('=>' disjunction)*
 *   disjunction   := conjunction ('|' conjunction)*
 *   conjunction   := negation ('&' negation)*
 *   negation      := '~' negation | primary
 *   primary       := atom | '(' sentence ')'
 */
class Parser {
  constructor(tokens) {
    this.tokens = tokens;
    this.pos = 0;
  }
  
  current() {
    return this.tokens[this.pos];
  }
  
  consume(expectedType) {
    const tok = this.current();
    if (tok.type !== expectedType) {
      throw new Error(`Expected ${expectedType}, got ${tok.type} at position ${this.pos}`);
    }
    this.pos++;
    return tok;
  }
  
  parse() {
    return this.parseBiconditional();
  }
  
  parseBiconditional() {
    let left = this.parseImplication();
    while (this.current().type === TOKENS.IFF) {
      this.consume(TOKENS.IFF);
      const right = this.parseImplication();
      left = { type: 'IFF', left, right };
    }
    return left;
  }
  
  parseImplication() {
    let left = this.parseDisjunction();
    while (this.current().type === TOKENS.IMPLIES) {
      this.consume(TOKENS.IMPLIES);
      const right = this.parseDisjunction();
      left = { type: 'IMPLIES', left, right };
    }
    return left;
  }
  
  parseDisjunction() {
    let left = this.parseConjunction();
    while (this.current().type === TOKENS.OR) {
      this.consume(TOKENS.OR);
      const right = this.parseConjunction();
      left = { type: 'OR', left, right };
    }
    return left;
  }
  
  parseConjunction() {
    let left = this.parseNegation();
    while (this.current().type === TOKENS.AND) {
      this.consume(TOKENS.AND);
      const right = this.parseNegation();
      left = { type: 'AND', left, right };
    }
    return left;
  }
  
  parseNegation() {
    if (this.current().type === TOKENS.NOT) {
      this.consume(TOKENS.NOT);
      return { type: 'NOT', operand: this.parseNegation() };
    }
    return this.parsePrimary();
  }
  
  parsePrimary() {
    const tok = this.current();
    if (tok.type === TOKENS.ATOM) {
      this.consume(TOKENS.ATOM);
      return { type: 'ATOM', name: tok.value };
    }
    if (tok.type === TOKENS.LPAREN) {
      this.consume(TOKENS.LPAREN);
      const expr = this.parseBiconditional();
      this.consume(TOKENS.RPAREN);
      return expr;
    }
    throw new Error(`Unexpected token: ${tok.type}`);
  }
}

/**
 * Convert a string expression to an AST.
 */
export function parseExpression(expr) {
  const tokens = tokenize(expr);
  const parser = new Parser(tokens);
  return parser.parse();
}

/**
 * Convert AST to a readable string representation.
 */
export function astToString(node) {
  if (!node) return '';
  switch (node.type) {
    case 'ATOM': return node.name;
    case 'NOT': return `~${astToString(node.operand)}`;
    case 'AND': return `(${astToString(node.left)} & ${astToString(node.right)})`;
    case 'OR': return `(${astToString(node.left)} | ${astToString(node.right)})`;
    case 'IMPLIES': return `(${astToString(node.left)} => ${astToString(node.right)})`;
    case 'IFF': return `(${astToString(node.left)} <=> ${astToString(node.right)})`;
    default: return '';
  }
}

/**
 * KnowledgeBase class
 * Maintains a set of propositional logic sentences.
 * Provides TELL and ASK operations.
 */
export class KnowledgeBase {
  constructor() {
    this.sentences = []; // Array of AST nodes
    this.sentenceStrings = []; // Human-readable strings
  }
  
  /**
   * TELL: Add a sentence to the KB.
   * @param {string} sentenceStr - The sentence in string form
   * @param {Object} ast - Optional pre-parsed AST
   */
  tell(sentenceStr, ast = null) {
    if (!ast) {
      ast = parseExpression(sentenceStr);
    }
    this.sentences.push(ast);
    this.sentenceStrings.push(sentenceStr);
  }
  
  /**
   * Get all sentences as ASTs.
   */
  getSentences() {
    return [...this.sentences];
  }
  
  /**
   * Get all sentences as strings.
   */
  getSentenceStrings() {
    return [...this.sentenceStrings];
  }
  
  /**
   * Clear the KB.
   */
  clear() {
    this.sentences = [];
    this.sentenceStrings = [];
  }
  
  /**
   * Get the number of sentences.
   */
  size() {
    return this.sentences.length;
  }
}

export { TOKENS, tokenize, Parser };
