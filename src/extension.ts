import * as vscode from 'vscode';
import { convertFileCommand } from './commands/convertFileCommand';
import { convertFolderCommand } from './commands/convertFolderCommand';
import { convertWorkspaceCommand } from './commands/convertWorkspaceCommand';
import { openVisualConverterCommand } from './commands/openVisualConverterCommand';
import { OcrEngine } from './ocrEngine';
import { OutputLogger } from './outputChannel';

export function activate(context: vscode.ExtensionContext): void {
  const logger = OutputLogger.getInstance();
  logger.info('PDF to Text Converter (Texter) extension activated.', 'Extension');

  // Register command for single/multi PDF file conversion (background)
  const convertFileSub = vscode.commands.registerCommand(
    'pdf-to-text.convertFile',
    async (uri?: vscode.Uri, uris?: vscode.Uri[]) => {
      await convertFileCommand(uri, uris);
    }
  );

  // Register command for folder recursive PDF conversion
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

  // Register interactive visual side-by-side converter command (supports multi-selection tabs)
  const openVisualConverterSub = vscode.commands.registerCommand(
    'pdf-to-text.openVisualConverter',
    async (uri?: vscode.Uri, uris?: vscode.Uri[]) => {
      await openVisualConverterCommand(context.extensionUri, uri, uris);
    }
  );

  context.subscriptions.push(
    convertFileSub,
    convertFolderSub,
    convertWorkspaceSub,
    openVisualConverterSub,
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
