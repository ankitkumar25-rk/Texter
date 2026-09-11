import * as vscode from 'vscode';
import { BatchProcessor } from '../batchProcessor';
import { OutputLogger } from '../outputChannel';
import { ProgressHandler } from '../progressHandler';
import { SummaryReporter } from '../summaryReporter';
import { WorkspaceScanner } from '../workspaceScanner';

export async function convertWorkspaceCommand(): Promise<void> {
  const logger = OutputLogger.getInstance();
  logger.info('Executing Convert Workspace command...', 'ConvertWorkspaceCommand');

  const pdfFiles = await WorkspaceScanner.scanWorkspace();

  if (pdfFiles.length === 0) {
    logger.info('No PDF files discovered across the workspace.', 'ConvertWorkspaceCommand');
    vscode.window.showInformationMessage('No PDF files found in the current workspace.');
    return;
  }

  logger.info(`Discovered ${pdfFiles.length} PDF file(s) across workspace. Commencing batch conversion...`, 'ConvertWorkspaceCommand');

  const processor = new BatchProcessor();
  const summary = await ProgressHandler.runWithProgress(
    `PDF to Text: Converting workspace (${pdfFiles.length} PDFs)...`,
    async (context) => {
      return await processor.processBatch(pdfFiles, context);
    }
  );

  await SummaryReporter.reportSummary(summary);
}
