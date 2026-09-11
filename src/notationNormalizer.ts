/**
 * Normalizer for mathematical symbols, Greek notations, and physics operators.
 */

export class NotationNormalizer {
  private static readonly LATEX_GREEK_MAP: Record<string, string> = {
    '\\alpha': 'α',
    '\\beta': 'β',
    '\\gamma': 'γ',
    '\\Gamma': 'Γ',
    '\\delta': 'δ',
    '\\Delta': 'Δ',
    '\\epsilon': 'ε',
    '\\varepsilon': 'ε',
    '\\zeta': 'ζ',
    '\\eta': 'η',
    '\\theta': 'θ',
    '\\Theta': 'Θ',
    '\\kappa': 'κ',
    '\\lambda': 'λ',
    '\\Lambda': 'Λ',
    '\\mu': 'μ',
    '\\nu': 'ν',
    '\\xi': 'ξ',
    '\\pi': 'π',
    '\\Pi': 'Π',
    '\\rho': 'ρ',
    '\\sigma': 'σ',
    '\\Sigma': 'Σ',
    '\\tau': 'τ',
    '\\phi': 'φ',
    '\\Phi': 'Φ',
    '\\psi': 'ψ',
    '\\Psi': 'Ψ',
    '\\omega': 'ω',
    '\\Omega': 'Ω',
  };

  private static readonly OPERATOR_MAP: Record<string, string> = {
    '\\int': '∫',
    '\\iint': '∬',
    '\\sum': '∑',
    '\\prod': '∏',
    '\\partial': '∂',
    '\\nabla': '∇',
    '\\sqrt': '√',
    '\\pm': '±',
    '\\mp': '∓',
    '\\times': '×',
    '\\div': '÷',
    '\\approx': '≈',
    '\\neq': '≠',
    '\\leq': '≤',
    '\\geq': '≥',
    '\\infty': '∞',
    '\\hbar': 'ħ',
    '\\to': '→',
    '\\rightarrow': '→',
    '\\Rightarrow': '⇒',
  };

  /**
   * Normalizes raw OCR or LaTeX string by replacing macro notations with standard Unicode symbols.
   */
  public static normalize(text: string): string {
    if (!text) {
      return '';
    }

    let result = text;

    // Replace LaTeX Greek expressions
    for (const [key, val] of Object.entries(this.LATEX_GREEK_MAP)) {
      const regex = new RegExp(key.replace('\\', '\\\\') + '(?![a-zA-Z])', 'g');
      result = result.replace(regex, val);
    }

    // Replace LaTeX operator expressions
    for (const [key, val] of Object.entries(this.OPERATOR_MAP)) {
      const regex = new RegExp(key.replace('\\', '\\\\') + '(?![a-zA-Z])', 'g');
      result = result.replace(regex, val);
    }

    // Normalize basic ascii operators to unicode
    result = result
      .replace(/\+\/-/g, '±')
      .replace(/<=\s/g, '≤ ')
      .replace(/>=\s/g, '≥ ')
      .replace(/!=\s/g, '≠ ')
      .replace(/->\s/g, '→ ');

    return result;
  }
}
