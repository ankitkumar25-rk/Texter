import * as vscode from 'vscode';
import { BatchProcessor } from '../batchProcessor';
import { OutputLogger } from '../outputChannel';
import { ProgressHandler } from '../progressHandler';
import { SummaryReporter } from '../summaryReporter';
import { WorkspaceScanner } from '../workspaceScanner';

export async function convertFolderCommand(uri?: vscode.Uri): Promise<void> {
  const logger = OutputLogger.getInstance();
  const folderPath = uri?.fsPath;

  if (!folderPath) {
    logger.warn('Convert Folder called without a folder URI.', 'ConvertFolderCommand');
    vscode.window.showWarningMessage('Please right-click a valid folder to convert its PDF files.');
    return;
  }

  logger.info(`Scanning folder for PDF documents: ${folderPath}`, 'ConvertFolderCommand');

  const pdfFiles = await WorkspaceScanner.scanDirectory(folderPath);

  if (pdfFiles.length === 0) {
    logger.info(`No PDF files found in folder: ${folderPath}`, 'ConvertFolderCommand');
    vscode.window.showInformationMessage('No PDF files found in the selected folder.');
    return;
  }

  logger.info(`Found ${pdfFiles.length} PDF file(s) in folder. Starting conversion...`, 'ConvertFolderCommand');

  const processor = new BatchProcessor();
  const summary = await ProgressHandler.runWithProgress(
    `PDF to Text: Converting folder (${pdfFiles.length} files)...`,
    async (context) => {
      return await processor.processBatch(pdfFiles, context);
    }
  );

  await SummaryReporter.reportSummary(summary);
}
