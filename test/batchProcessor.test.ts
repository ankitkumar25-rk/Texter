import { BatchProcessor } from '../src/batchProcessor';
import { ProgressTaskContext } from '../src/progressHandler';

export function runBatchProcessorTests(): void {
  console.log('Running BatchProcessor tests...');

  const processor = new BatchProcessor();

  // Test 1: Empty batch returns empty summary immediately
  processor.processBatch([]).then((summary) => {
    if (summary.totalDiscovered !== 0 || summary.convertedCount !== 0) {
      throw new Error('Test 1 Failed: Empty batch should return zero totals');
    }
  });

  // Test 2: Cancellation handling simulation
  let cancelled = false;
  const mockContext: ProgressTaskContext = {
    report: (_msg: string, _inc?: number) => {},
    isCancelled: () => cancelled,
    token: {
      isCancellationRequested: false,
      onCancellationRequested: (() => {}) as any,
    },
  };

  cancelled = true;
  processor.processBatch(['/mock/file1.pdf', '/mock/file2.pdf'], mockContext).then((summary) => {
    if (summary.convertedCount !== 0) {
      throw new Error('Test 2 Failed: Cancelled batch should not convert files');
    }
  });

  console.log('All BatchProcessor tests passed.');
}
