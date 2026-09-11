import * as path from 'path';
import * as vscode from 'vscode';
import { VisualConverterPanel } from '../visualConverterPanel';

export async function openVisualConverterCommand(
  extensionUri: vscode.Uri,
  uri?: vscode.Uri,
  selectedUris?: vscode.Uri[]
): Promise<void> {
  const targetPaths: string[] = [];

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
    vscode.window.showWarningMessage('Please select a valid .pdf file to open.');
    return;
  }

  // Open each selected PDF in its own tab
  for (const filePath of targetPaths) {
    VisualConverterPanel.createOrShow(extensionUri, filePath);
  }
}
