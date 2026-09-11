import { HybridMerger } from '../src/merger';
import { OCR_LOW_CONF_END, OCR_LOW_CONF_START } from '../src/ocrConfidence';
import { OcrPageResult, PdfPageContent } from '../src/types';

export function runMergerTests(): void {
  console.log('Running HybridMerger tests...');

  // Mock PDF page with clean text
  const cleanPdfPage: PdfPageContent = {
    pageNumber: 1,
    totalPageCount: 1,
    text: 'Introduction to Physics\nThis is a standard text paragraph.',
    lines: ['Introduction to Physics', 'This is a standard text paragraph.'],
    items: [],
    hasSelectableText: true,
    width: 612,
    height: 792,
  };

  // Mock OCR result with matching text
  const cleanOcrResult: OcrPageResult = {
    pageNumber: 1,
    rawText: 'Introduction to Physics\nThis is a standard text paragraph.',
    confidence: 95,
    blocks: [
      {
        text: 'Introduction to Physics\nThis is a standard text paragraph.',
        confidence: 95,
        lines: [],
      },
    ],
    lowConfidenceCount: 0,
  };

  // Test 1: Clean text layer preserves original text
  const res1 = HybridMerger.mergePage(cleanPdfPage, cleanOcrResult, 60);
  if (!res1.mergedText.includes('Introduction to Physics') || res1.lowConfidenceFlagged) {
    throw new Error('Test 1 Failed: Clean text layer should match and have 0 low-conf flags');
  }

  // Mock PDF page with no selectable text (scanned image)
  const scannedPdfPage: PdfPageContent = {
    pageNumber: 2,
    totalPageCount: 1,
    text: '',
    lines: [],
    items: [],
    hasSelectableText: false,
    width: 612,
    height: 792,
  };

  // Mock OCR result with low confidence equation
  const lowConfOcrResult: OcrPageResult = {
    pageNumber: 2,
    rawText: 'E = m * c^2',
    confidence: 45,
    blocks: [
      {
        text: 'E = m * c^2',
        confidence: 45,
        lines: [
          {
            text: 'E = m * c^2',
            confidence: 45,
          },
        ],
      },
    ],
    lowConfidenceCount: 1,
  };

  // Test 2: Scanned page falls back to OCR and wraps low-confidence math
  const res2 = HybridMerger.mergePage(scannedPdfPage, lowConfOcrResult, 60);
  if (!res2.usedOcrFallback) {
    throw new Error('Test 2 Failed: Scanned page should use OCR fallback');
  }
  if (!res2.mergedText.includes(OCR_LOW_CONF_START) || !res2.mergedText.includes(OCR_LOW_CONF_END)) {
    throw new Error(`Test 2 Failed: Low-confidence OCR should be wrapped in markers. Got: "${res2.mergedText}"`);
  }

  // Test 3: Mixed page with text and supplementary equation in OCR
  const mixedPdfPage: PdfPageContent = {
    pageNumber: 3,
    totalPageCount: 1,
    text: 'Theorem 1: Kinetic Energy',
    lines: ['Theorem 1: Kinetic Energy'],
    items: [],
    hasSelectableText: true,
    width: 612,
    height: 792,
  };

  const mixedOcrResult: OcrPageResult = {
    pageNumber: 3,
    rawText: 'Theorem 1: Kinetic Energy\nK = 1/2 * m * v^2',
    confidence: 88,
    blocks: [
      {
        text: 'Theorem 1: Kinetic Energy',
        confidence: 90,
        lines: [],
      },
      {
        text: 'K = 1/2 * m * v^2',
        confidence: 85,
        lines: [{ text: 'K = 1/2 * m * v^2', confidence: 85 }],
      },
    ],
    lowConfidenceCount: 0,
  };

  const res3 = HybridMerger.mergePage(mixedPdfPage, mixedOcrResult, 60);
  if (!res3.mergedText.includes('Theorem 1: Kinetic Energy') || !res3.mergedText.includes('K = 1/2 * m * v^2')) {
    throw new Error(`Test 3 Failed: Mixed page should contain both text layer and OCR equation. Got: "${res3.mergedText}"`);
  }

  console.log('All HybridMerger tests passed.');
}
