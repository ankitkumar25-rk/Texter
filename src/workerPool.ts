import { createWorker, Worker } from 'tesseract.js';
import { OutputLogger } from './outputChannel';

export interface PoolConfig {
  maxWorkers: number;
  maxJobsPerWorker: number;
}

export class OcrWorkerPool {
  private static instance: OcrWorkerPool;
  private workers: Worker[] = [];
  private busyWorkers = new Set<Worker>();
  private workerJobCounts = new Map<Worker, number>();
  private config: PoolConfig = { maxWorkers: 2, maxJobsPerWorker: 50 };
  private logger = OutputLogger.getInstance();

  private constructor() {}

  public static getInstance(): OcrWorkerPool {
    if (!OcrWorkerPool.instance) {
      OcrWorkerPool.instance = new OcrWorkerPool();
    }
    return OcrWorkerPool.instance;
  }

  public async acquireWorker(): Promise<Worker> {
    // Find free existing worker
    for (const worker of this.workers) {
      if (!this.busyWorkers.has(worker)) {
        this.busyWorkers.add(worker);
        return worker;
      }
    }

    // Create new worker if pool limit not reached
    if (this.workers.length < this.config.maxWorkers) {
      this.logger.debug(`Spawning new OCR worker (${this.workers.length + 1}/${this.config.maxWorkers})`, 'OcrWorkerPool');
      const worker = await createWorker('eng');
      this.workers.push(worker);
      this.busyWorkers.add(worker);
      this.workerJobCounts.set(worker, 0);
      return worker;
    }

    // Wait for a worker to become available
    return new Promise((resolve) => {
      const interval = setInterval(async () => {
        for (const worker of this.workers) {
          if (!this.busyWorkers.has(worker)) {
            clearInterval(interval);
            this.busyWorkers.add(worker);
            resolve(worker);
            return;
          }
        }
      }, 100);
    });
  }

  public async releaseWorker(worker: Worker): Promise<void> {
    const jobCount = (this.workerJobCounts.get(worker) || 0) + 1;
    this.workerJobCounts.set(worker, jobCount);

    // Recycle worker if exceeded maxJobsPerWorker to prevent memory leak
    if (jobCount >= this.config.maxJobsPerWorker) {
      this.logger.debug('Recycling worker after max jobs threshold reached.', 'OcrWorkerPool');
      this.busyWorkers.delete(worker);
      const index = this.workers.indexOf(worker);
      if (index !== -1) {
        this.workers.splice(index, 1);
      }
      this.workerJobCounts.delete(worker);
      try {
        await worker.terminate();
      } catch {
        // Ignore termination error on recycle
      }
      return;
    }

    this.busyWorkers.delete(worker);
  }

  public async shutdown(): Promise<void> {
    this.logger.info('Shutting down OCR worker pool...', 'OcrWorkerPool');
    const tasks = this.workers.map((w) => w.terminate());
    await Promise.allSettled(tasks);
    this.workers = [];
    this.busyWorkers.clear();
    this.workerJobCounts.clear();
  }
}
