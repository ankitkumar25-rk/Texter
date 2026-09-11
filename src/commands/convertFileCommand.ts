import * as vscode from 'vscode';
import { BatchProcessor } from '../batchProcessor';
import { OutputLogger } from '../outputChannel';
import { ProgressHandler } from '../progressHandler';
import { SummaryReporter } from '../summaryReporter';

export async function convertFileCommand(uri?: vscode.Uri): Promise<void> {
  const logger = OutputLogger.getInstance();
  let targetPath = uri?.fsPath;

  if (!targetPath) {
    const activeEditor = vscode.window.activeTextEditor;
    if (activeEditor && activeEditor.document.uri.fsPath.toLowerCase().endsWith('.pdf')) {
      targetPath = activeEditor.document.uri.fsPath;
    }
  }

  if (!targetPath) {
    logger.warn('Convert File called without a valid PDF target.', 'ConvertFileCommand');
    vscode.window.showWarningMessage('Please select a valid .pdf file to convert.');
    return;
  }

  logger.info(`Executing Convert File command for: ${targetPath}`, 'ConvertFileCommand');

  const processor = new BatchProcessor();
  const summary = await ProgressHandler.runWithProgress(
    'PDF to Text: Converting file...',
    async (context) => {
      return await processor.processBatch([targetPath!], context);
    }
  );

  await SummaryReporter.reportSummary(summary);
}
