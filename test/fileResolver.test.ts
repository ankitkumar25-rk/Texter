import * as path from 'path';
import { FileResolver } from '../src/fileResolver';

export function runFileResolverTests(): void {
  console.log('Running FileResolver tests...');

  // Test 1: Standard PDF to TXT path mapping
  const sourcePdf = path.join('/workspace', 'documents', 'lecture_notes.pdf');
  const targetTxt = FileResolver.getTargetFilePath(sourcePdf);
  const expected = path.join('/workspace', 'documents', 'lecture_notes.txt');
  if (targetTxt !== expected) {
    throw new Error(`Test 1 Failed: Expected "${expected}", got "${targetTxt}"`);
  }

  // Test 2: Suffix application
  const suffixed = FileResolver.getTargetFilePath(sourcePdf, '_converted');
  const expectedSuffix = path.join('/workspace', 'documents', 'lecture_notes_converted.txt');
  if (suffixed !== expectedSuffix) {
    throw new Error(`Test 2 Failed: Expected "${expectedSuffix}", got "${suffixed}"`);
  }

  // Test 3: Versioned filename generation
  const versioned = FileResolver.getVersionedFilePath(sourcePdf);
  const expectedVersioned = path.join('/workspace', 'documents', 'lecture_notes_1.txt');
  if (versioned !== expectedVersioned) {
    throw new Error(`Test 3 Failed: Expected "${expectedVersioned}", got "${versioned}"`);
  }

  console.log('All FileResolver tests passed.');
}
