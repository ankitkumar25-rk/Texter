/**
 * Mathematical and physics notation detector.
 * Identifies equations, symbols, Greek characters, calculus notations, and physics operators.
 */

export interface MathDetectionResult {
  hasMath: boolean;
  score: number; // 0 to 1
  matchedSymbols: string[];
  matchedPatterns: string[];
  isIsolatedEquation: boolean;
}

export class MathDetector {
  // Common Greek lowercase and uppercase Unicode characters
  public static readonly GREEK_CHARACTERS =
    /[\u0370-\u03FF\u1F00-\u1FFF\u0391-\u03A9\u03B1-\u03C9]/;

  // Standard Mathematical Unicode Operators and Symbols
  public static readonly MATH_SYMBOLS =
    /[\u2200-\u22FF\u2A00-\u2AFF\u27C0-\u27EF\u2980-\u29FF\u2100-\u214F\u2070-\u209F]/;

  // Specific high-value math indicators
  public static readonly OPERATOR_TOKENS = [
    '∫', '∬', '∭', '∮', '∯', '∰', // Integrals
    '∑', '∏', '∐',                 // Summations and products
    '∂', '∇', '∆',                 // Partial diff, nabla, laplacian
    '√', '∛', '∜',                 // Roots
    '≈', '≠', '≡', '≢', '≤', '≥', '≪', '≫', '∝', '∼', '≃', // Relations
    '±', '∓', '×', '÷', '·', '∘', '⊗', '⊕', '⊙',            // Binary operators
    '∞', 'ℵ',                      // Infinity, aleph
    '∈', '∉', '∋', '∌', '⊂', '⊃', '⊆', '⊇', '∪', '∩',       // Set theory
    '∀', '∃', '∄', '∧', '∨', '¬', '⇒', '⇔', '→', '↔',       // Logic and arrows
    'ℏ', 'ħ', 'ℓ', 'ℇ', 'ℱ', 'ℋ', 'ℒ',                      // Physics constants / operators
    '°', '′', '″', '‴',            // Primes and degrees
  ];

  // Common LaTeX or linear text equation patterns
  private static readonly LATEX_PATTERNS = [
    /\\(?:frac|sqrt|int|sum|prod|partial|nabla|alpha|beta|gamma|delta|epsilon|theta|lambda|mu|nu|pi|sigma|phi|omega)\b/i,
    /\b(?:lim|sin|cos|tan|log|ln|exp|det|max|min)\s*\(?/i,
    /[a-zA-Z]\s*\^\s*\{?[0-9a-zA-Z+\-_]+\}?/,   // Superscript x^2, e^{-t}
    /[a-zA-Z]\s*_\s*\{?[0-9a-zA-Z+\-_]+\}?/,   // Subscript x_0, a_{ij}
    /\b(?:d[a-zA-Z]\s*\/\s*d[a-zA-Z])\b/,      // Derivatives: dx/dt, dy/dx
    /\b(?:d\^[0-9][a-zA-Z]\s*\/\s*d[a-zA-Z]\^[0-9])\b/, // Higher-order derivatives
    /[0-9a-zA-Z]\s*=\s*[-+]?[0-9a-zA-Z\s\\/^*+()]+/, // Algebraic equation: E = mc^2
    /\[\s*[-+0-9a-zA-Z\s,;]+\s*\]/,             // Vector/matrix brackets
  ];

  /**
   * Analyzes a string chunk to determine if it contains mathematical/physics content.
   */
  public static analyze(text: string): MathDetectionResult {
    if (!text || text.trim().length === 0) {
      return {
        hasMath: false,
        score: 0,
        matchedSymbols: [],
        matchedPatterns: [],
        isIsolatedEquation: false,
      };
    }

    const trimmed = text.trim();
    const matchedSymbols: string[] = [];
    const matchedPatterns: string[] = [];
    let symbolPoints = 0;

    // Check operator tokens
    for (const op of this.OPERATOR_TOKENS) {
      if (trimmed.includes(op)) {
        matchedSymbols.push(op);
        symbolPoints += 2;
      }
    }

    // Check Greek characters
    const greekMatches = trimmed.match(new RegExp(this.GREEK_CHARACTERS, 'g'));
    if (greekMatches) {
      const uniqueGreek = Array.from(new Set(greekMatches));
      for (const g of uniqueGreek) {
        if (!matchedSymbols.includes(g)) {
          matchedSymbols.push(g);
        }
      }
      symbolPoints += Math.min(uniqueGreek.length * 1.5, 6);
    }

    // Check general math symbols
    const mathSymbolMatches = trimmed.match(new RegExp(this.MATH_SYMBOLS, 'g'));
    if (mathSymbolMatches) {
      symbolPoints += Math.min(mathSymbolMatches.length, 5);
    }

    // Check LaTeX / structural equation patterns
    for (const pat of this.LATEX_PATTERNS) {
      if (pat.test(trimmed)) {
        matchedPatterns.push(pat.source);
        symbolPoints += 2.5;
      }
    }

    // Heuristics for isolated equations (short lines with equals sign, high ratio of symbols)
    const isShort = trimmed.length < 120;
    const hasEquals = trimmed.includes('=') || trimmed.includes('≈') || trimmed.includes('≡');
    const isIsolated = isShort && hasEquals && symbolPoints >= 2;

    const normalizedScore = Math.min(1, symbolPoints / 8);
    const hasMath = normalizedScore >= 0.25 || matchedSymbols.length > 0 || matchedPatterns.length > 0;

    return {
      hasMath,
      score: normalizedScore,
      matchedSymbols,
      matchedPatterns,
      isIsolatedEquation: isIsolated,
    };
  }

  /**
   * Returns true if text contains significant mathematical notations.
   */
  public static containsMath(text: string): boolean {
    return this.analyze(text).hasMath;
  }
}
