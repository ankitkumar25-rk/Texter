import { runMathDetectorTests } from './mathDetector.test';
import { runFileResolverTests } from './fileResolver.test';
import { runMergerTests } from './merger.test';
import { runConverterTests } from './converter.test';
import { runBatchProcessorTests } from './batchProcessor.test';
import { runE2eTests } from './e2e.test';

async function runAll() {
  console.log('========================================');
  console.log('PDF TO TEXT CONVERTER (TEXTER) TEST SUITE');
  console.log('========================================');
  let hasFailures = false;

  try {
    console.log('\n[Suite 1/6] Math & Physics Detection:');
    runMathDetectorTests();

    console.log('\n[Suite 2/6] File Naming & Collision Resolver:');
    runFileResolverTests();

    console.log('\n[Suite 3/6] Hybrid Content Merger:');
    runMergerTests();

    console.log('\n[Suite 4/6] Single PDF Converter & Formatter:');
    runConverterTests();

    console.log('\n[Suite 5/6] Batch Processor & Cancellation:');
    runBatchProcessorTests();

    console.log('\n[Suite 6/6] End-to-End Fixtures & Normalizer:');
    await runE2eTests();

    console.log('\n========================================');
    console.log('STATUS: ALL TEST SUITES PASSED');
    console.log('========================================');
  } catch (err) {
    console.error('\nTEST SUITE EXECUTION FAILED:', err);
    hasFailures = true;
  }

  if (hasFailures) {
    process.exit(1);
  }
}

runAll();
