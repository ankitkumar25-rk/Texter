import { runMathDetectorTests } from './mathDetector.test';
import { runFileResolverTests } from './fileResolver.test';
import { runMergerTests } from './merger.test';
import { runConverterTests } from './converter.test';

async function main() {
  console.log('Starting Test Suite...');
  let hasFailures = false;

  try {
    runMathDetectorTests();
    runFileResolverTests();
    runMergerTests();
    runConverterTests();
  } catch (err) {
    console.error('Test Suite Failed:', err);
    hasFailures = true;
  }

  if (hasFailures) {
    process.exit(1);
  } else {
    console.log('All Test Suites Completed Successfully.');
  }
}

main();
