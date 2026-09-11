import * as vscode from 'vscode';
import { convertFileCommand } from './commands/convertFileCommand';
import { convertFolderCommand } from './commands/convertFolderCommand';
import { convertWorkspaceCommand } from './commands/convertWorkspaceCommand';
import { OcrEngine } from './ocrEngine';
import { OutputLogger } from './outputChannel';

export function activate(context: vscode.ExtensionContext): void {
  const logger = OutputLogger.getInstance();
  logger.info('PDF to Text Converter (Texter) extension activated.', 'Extension');

  // Register command for single PDF file conversion (context menu and command palette)
  const convertFileSub = vscode.commands.registerCommand(
    'pdf-to-text.convertFile',
    async (uri?: vscode.Uri) => {
      await convertFileCommand(uri);
    }
  );

  // Register command for folder recursive PDF conversion (context menu)
  const convertFolderSub = vscode.commands.registerCommand(
    'pdf-to-text.convertFolder',
    async (uri?: vscode.Uri) => {
      await convertFolderCommand(uri);
    }
  );

  // Register command for workspace-wide scan and conversion
  const convertWorkspaceSub = vscode.commands.registerCommand(
    'pdf-to-text.convertWorkspace',
    async () => {
      await convertWorkspaceCommand();
    }
  );

  context.subscriptions.push(
    convertFileSub,
    convertFolderSub,
    convertWorkspaceSub,
    {
      dispose: () => {
        logger.dispose();
      },
    }
  );
}

export async function deactivate(): Promise<void> {
  const logger = OutputLogger.getInstance();
  logger.info('Deactivating PDF to Text Converter extension...', 'Extension');

  try {
    const ocrEngine = OcrEngine.getInstance();
    await ocrEngine.terminate();
  } catch (err) {
    logger.error('Error during OCR engine shutdown', err, 'Extension');
  }

  logger.dispose();
}
