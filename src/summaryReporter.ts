import * as vscode from 'vscode';
import { OutputLogger } from './outputChannel';
import { BatchSummary } from './types';

export class SummaryReporter {
  private static logger = OutputLogger.getInstance();

  /**
   * Reports the final batch conversion summary via VS Code notification and output channel.
   */
  public static async reportSummary(summary: BatchSummary): Promise<void> {
    const elapsedSec = (summary.durationMs / 1000).toFixed(1);

    // Detailed log to Output Channel
    this.logger.info('================ CONVERSION SUMMARY ================', 'SummaryReporter');
    this.logger.info(`Total PDFs Discovered: ${summary.totalDiscovered}`, 'SummaryReporter');
    this.logger.info(`Successfully Converted: ${summary.convertedCount}`, 'SummaryReporter');
    this.logger.info(`Skipped Files: ${summary.skippedCount}`, 'SummaryReporter');
    this.logger.info(`Failed Files: ${summary.failedCount}`, 'SummaryReporter');
    this.logger.info(`OCR Fallback Pages: ${summary.ocrFallbackPagesTotal}`, 'SummaryReporter');
    this.logger.info(`Low-Confidence Sections Flagged: ${summary.lowConfidenceSectionsTotal}`, 'SummaryReporter');
    this.logger.info(`Elapsed Time: ${elapsedSec}s`, 'SummaryReporter');

    if (summary.failedFiles.length > 0) {
      this.logger.warn('Failed Files Details:', 'SummaryReporter');
      for (const failed of summary.failedFiles) {
        this.logger.warn(` - ${failed.filePath}: ${failed.reason}`, 'SummaryReporter');
      }
    }
    this.logger.info('====================================================', 'SummaryReporter');

    // UI Notification
    const summaryMsg = `PDF Conversion Complete: ${summary.convertedCount} converted, ${summary.ocrFallbackPagesTotal} OCR fallback pages, ${summary.lowConfidenceSectionsTotal} low-confidence sections flagged (${elapsedSec}s).`;

    if (summary.failedCount > 0) {
      const warningMsg = `${summaryMsg} ${summary.failedCount} files failed.`;
      const action = await vscode.window.showWarningMessage(warningMsg, 'View Output');
      if (action === 'View Output') {
        this.logger.show();
      }
    } else {
      vscode.window.showInformationMessage(summaryMsg);
    }
  }
}
