import * as path from 'path';
import { ConfigManager } from './config';
import { SinglePdfConverter } from './converter';
import { FileResolver } from './fileResolver';
import { OutputLogger } from './outputChannel';
import { ProgressTaskContext } from './progressHandler';
import { BatchSummary, FileCollisionAction } from './types';

export class BatchProcessor {
  private logger = OutputLogger.getInstance();
  private converter = new SinglePdfConverter();
  private configManager = ConfigManager.getInstance();

  /**
   * Processes a list of PDF file paths sequentially with progress and collision handling.
   */
  public async processBatch(
    pdfPaths: string[],
    context?: ProgressTaskContext
  ): Promise<BatchSummary> {
    const startTime = Date.now();
    const config = this.configManager.getConfig();

    const summary: BatchSummary = {
      totalDiscovered: pdfPaths.length,
      convertedCount: 0,
      skippedCount: 0,
      failedCount: 0,
      ocrFallbackPagesTotal: 0,
      lowConfidenceSectionsTotal: 0,
      failedFiles: [],
      durationMs: 0,
    };

    if (pdfPaths.length === 0) {
      summary.durationMs = Date.now() - startTime;
      return summary;
    }

    let batchCollisionChoice: FileCollisionAction | undefined;
    const totalFiles = pdfPaths.length;

    for (let index = 0; index < totalFiles; index++) {
      if (context?.isCancelled()) {
        this.logger.warn('Batch conversion cancelled by user.', 'BatchProcessor');
        break;
      }

      const sourcePdf = pdfPaths[index];
      const baseName = path.basename(sourcePdf);
      const defaultTargetPath = FileResolver.getTargetFilePath(sourcePdf, config.outputSuffix);

      context?.report(
        `[${index + 1}/${totalFiles}] Checking ${baseName}...`,
        (1 / totalFiles) * 10
      );

      // Handle file collision
      let targetPath = defaultTargetPath;
      if (FileResolver.fileExists(defaultTargetPath)) {
        const decision = await FileResolver.resolveCollision(
          defaultTargetPath,
          sourcePdf,
          totalFiles > 1,
          batchCollisionChoice
        );

        if (decision.action === 'skip' || decision.action === 'skipAll') {
          if (decision.action === 'skipAll') {
            batchCollisionChoice = 'skipAll';
          }
          this.logger.info(`Skipping file on user request: ${sourcePdf}`, 'BatchProcessor');
          summary.skippedCount++;
          continue;
        }

        if (decision.action === 'overwriteAll') {
          batchCollisionChoice = 'overwriteAll';
        }

        targetPath = decision.targetFilePath;
      }

      context?.report(
        `[${index + 1}/${totalFiles}] Converting ${baseName}...`,
        (1 / totalFiles) * 90
      );

      try {
        const result = await this.converter.convertFile(
          sourcePdf,
          targetPath,
          (pageProg) => {
            if (pageProg.currentPage && pageProg.totalPages) {
              context?.report(
                `[${index + 1}/${totalFiles}] ${baseName} - Page ${pageProg.currentPage}/${pageProg.totalPages}`
              );
            }
          },
          context?.token
        );

        if (result.success) {
          summary.convertedCount++;
          summary.ocrFallbackPagesTotal += result.ocrFallbackPages;
          summary.lowConfidenceSectionsTotal += result.lowConfidenceFlags;
        } else {
          summary.failedCount++;
          summary.failedFiles.push({
            filePath: sourcePdf,
            reason: result.errorMessage || 'Unknown error occurred.',
          });
        }
      } catch (fileErr) {
        summary.failedCount++;
        const reason = fileErr instanceof Error ? fileErr.message : String(fileErr);
        summary.failedFiles.push({ filePath: sourcePdf, reason });
        this.logger.error(`Error processing file ${sourcePdf}`, fileErr, 'BatchProcessor');
      }
    }

    summary.durationMs = Date.now() - startTime;
    return summary;
  }
}
