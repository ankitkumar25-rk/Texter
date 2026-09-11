import * as fs from 'fs';
import * as path from 'path';
import { MarkerFormatter } from '../src/markerFormatter';
import { NotationNormalizer } from '../src/notationNormalizer';
import { SuffixRules } from '../src/suffixRules';
import { WorkspaceScanner } from '../src/workspaceScanner';
import { TestPdfFixtureGenerator } from './pdfGenerator';

export async function runE2eTests(): Promise<void> {
  console.log('Running End-to-End and Integration tests...');

  const tempDir = path.join(__dirname, 'temp_e2e');
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }

  try {
    // 1. Generate fixtures
    const samplePdf1 = path.join(tempDir, 'doc1.pdf');
    const samplePdf2 = path.join(tempDir, 'sub', 'doc2.pdf');
    TestPdfFixtureGenerator.createSamplePdf(samplePdf1, 'Document 1 Text');
    TestPdfFixtureGenerator.createSamplePdf(samplePdf2, 'Document 2 Text');

    // 2. Test directory scanning
    const discovered = await WorkspaceScanner.scanDirectory(tempDir);
    if (discovered.length !== 2) {
      throw new Error(`E2E Test Failed: Expected 2 discovered files, got ${discovered.length}`);
    }

    // 3. Test notation normalizer
    const rawMath = '\\int_0^\\infty e^{-x} dx = 1 where \\alpha + \\beta = \\gamma';
    const normalized = NotationNormalizer.normalize(rawMath);
    if (!normalized.includes('∫') || !normalized.includes('α') || !normalized.includes('β') || !normalized.includes('γ')) {
      throw new Error(`E2E Test Failed: Math notation normalization failed on "${rawMath}". Got: "${normalized}"`);
    }

    // 4. Test marker formatter styles
    const stdMarker = MarkerFormatter.formatMarker(5, 'standard');
    const mdMarker = MarkerFormatter.formatMarker(5, 'markdown');
    if (!MarkerFormatter.isPageMarker(stdMarker) || !MarkerFormatter.isPageMarker(mdMarker)) {
      throw new Error('E2E Test Failed: MarkerFormatter failed to recognize generated markers.');
    }
    if (MarkerFormatter.extractPageNumber(stdMarker) !== 5) {
      throw new Error('E2E Test Failed: MarkerFormatter failed to extract page number 5.');
    }

    // 5. Test suffix rules
    const dynamicSuffix = SuffixRules.resolveSuffix('_v_{pageCount}', 3);
    if (dynamicSuffix !== '_v_3') {
      throw new Error(`E2E Test Failed: Dynamic suffix expected "_v_3", got "${dynamicSuffix}"`);
    }

    console.log('All End-to-End tests passed successfully.');
  } finally {
    // Cleanup temporary files
    try {
      fs.rmSync(tempDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup error
    }
  }
}
