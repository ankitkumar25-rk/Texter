import { MathDetector } from '../src/mathDetector';

export function runMathDetectorTests(): void {
  console.log('Running MathDetector tests...');

  // Test 1: Standard calculus equation with integral
  const calcText = '∫ f(x) dx = F(b) - F(a)';
  const calcRes = MathDetector.analyze(calcText);
  if (!calcRes.hasMath || !calcRes.matchedSymbols.includes('∫')) {
    throw new Error(`Test 1 Failed: Expected integral to be detected in "${calcText}"`);
  }

  // Test 2: Greek letters and quantum physics notation
  const physicsText = 'Ψ(x,t) = A * exp(i*(k*x - ω*t)) where ħ = h / 2π';
  const physicsRes = MathDetector.analyze(physicsText);
  if (!physicsRes.hasMath) {
    throw new Error(`Test 2 Failed: Expected Greek/physics notation in "${physicsText}"`);
  }

  // Test 3: Standard English text without math
  const plainText = 'The quick brown fox jumps over the lazy dog in the forest.';
  const plainRes = MathDetector.analyze(plainText);
  if (plainRes.hasMath && plainRes.score > 0.3) {
    throw new Error(`Test 3 Failed: Plain text should not have high math score. Got: ${plainRes.score}`);
  }

  // Test 4: LaTeX style fractions and derivatives
  const latexText = '\\frac{d^2y}{dx^2} + \\omega^2 y = 0';
  const latexRes = MathDetector.analyze(latexText);
  if (!latexRes.hasMath) {
    throw new Error(`Test 4 Failed: Expected LaTeX derivative pattern in "${latexText}"`);
  }

  // Test 5: Empty and whitespace strings
  const emptyRes = MathDetector.analyze('   ');
  if (emptyRes.hasMath || emptyRes.score !== 0) {
    throw new Error(`Test 5 Failed: Empty string should return false`);
  }

  console.log('All MathDetector tests passed.');
}
