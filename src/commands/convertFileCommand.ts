import * as vscode from 'vscode';
import { BatchProcessor } from '../batchProcessor';
import { OutputLogger } from '../outputChannel';
import { ProgressHandler } from '../progressHandler';
import { SummaryReporter } from '../summaryReporter';

export async function convertFileCommand(
  uri?: vscode.Uri,
  selectedUris?: vscode.Uri[]
): Promise<void> {
  const logger = OutputLogger.getInstance();
  const targetPaths: string[] = [];

  // If user selected multiple files in Explorer (Ctrl/Shift + Click)
  if (selectedUris && selectedUris.length > 0) {
    for (const u of selectedUris) {
      if (u.fsPath.toLowerCase().endsWith('.pdf')) {
        targetPaths.push(u.fsPath);
      }
    }
  } else if (uri && uri.fsPath.toLowerCase().endsWith('.pdf')) {
    targetPaths.push(uri.fsPath);
  } else {
    const activeEditor = vscode.window.activeTextEditor;
    if (activeEditor && activeEditor.document.uri.fsPath.toLowerCase().endsWith('.pdf')) {
      targetPaths.push(activeEditor.document.uri.fsPath);
    }
  }

  if (targetPaths.length === 0) {
    logger.warn('Convert File called without any valid PDF target.', 'ConvertFileCommand');
    vscode.window.showWarningMessage('Please select one or more valid .pdf files to convert.');
    return;
  }

  logger.info(`Executing Convert File command for ${targetPaths.length} selected file(s).`, 'ConvertFileCommand');

  const processor = new BatchProcessor();
  const summary = await ProgressHandler.runWithProgress(
    `PDF to Text: Converting ${targetPaths.length} file(s)...`,
    async (context) => {
      return await processor.processBatch(targetPaths, context);
    }
  );

  await SummaryReporter.reportSummary(summary);
}
