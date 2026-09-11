import * as vscode from 'vscode';
import { VisualConverterPanel } from '../visualConverterPanel';

export async function openVisualConverterCommand(
  extensionUri: vscode.Uri,
  uri?: vscode.Uri
): Promise<void> {
  let targetPath = uri?.fsPath;

  if (!targetPath) {
    const activeEditor = vscode.window.activeTextEditor;
    if (activeEditor && activeEditor.document.uri.fsPath.toLowerCase().endsWith('.pdf')) {
      targetPath = activeEditor.document.uri.fsPath;
    }
  }

  VisualConverterPanel.render(extensionUri, targetPath);
}
