import { DocumentFormatter } from '../src/formatter';
import { MergedPageResult } from '../src/types';

export function runConverterTests(): void {
  console.log('Running Converter and Formatter tests...');

  const pages: MergedPageResult[] = [
    {
      pageNumber: 1,
      mergedText: 'First page content here.',
      usedOcrFallback: false,
      lowConfidenceFlagged: false,
      lowConfidenceCount: 0,
      detectedMathFormulas: 0,
    },
    {
      pageNumber: 2,
      mergedText: 'Second page with formula: E = mc^2',
      usedOcrFallback: true,
      lowConfidenceFlagged: false,
      lowConfidenceCount: 0,
      detectedMathFormulas: 1,
    },
  ];

  // Test 1: Formatting with page markers
  const formattedWithMarkers = DocumentFormatter.formatDocument(pages, true);
  if (!formattedWithMarkers.includes('--- Page 1 ---') || !formattedWithMarkers.includes('--- Page 2 ---')) {
    throw new Error('Test 1 Failed: Page markers missing in formatted output');
  }
  if (!formattedWithMarkers.includes('First page content here.') || !formattedWithMarkers.includes('E = mc^2')) {
    throw new Error('Test 1 Failed: Page text missing in formatted output');
  }

  // Test 2: Formatting without page markers
  const formattedWithoutMarkers = DocumentFormatter.formatDocument(pages, false);
  if (formattedWithoutMarkers.includes('--- Page 1 ---')) {
    throw new Error('Test 2 Failed: Page markers should not be present when disabled');
  }

  // Test 3: Empty pages handling
  const emptyFormatted = DocumentFormatter.formatDocument([], true);
  if (emptyFormatted !== '') {
    throw new Error('Test 3 Failed: Empty page array should return empty string');
  }

  console.log('All Converter and Formatter tests passed.');
}
