import * as path from 'path';
import * as fs from 'fs';
import * as vscode from 'vscode';
import { FileCollisionAction, OutputFileFormat } from './types';
import { OutputLogger } from './outputChannel';

export interface CollisionDecision {
  action: FileCollisionAction;
  targetFilePath: string;
}

export class FileResolver {
  private static logger = OutputLogger.getInstance();

  public static getTargetFilePath(
    sourcePdfPath: string,
    suffix: string = '',
    format: OutputFileFormat = 'md'
  ): string {
    const dir = path.dirname(sourcePdfPath);
    const baseName = path.basename(sourcePdfPath, path.extname(sourcePdfPath));
    const cleanSuffix = suffix.trim();
    const finalBaseName = cleanSuffix ? `${baseName}${cleanSuffix}` : baseName;
    const ext = format === 'txt' ? '.txt' : '.md';
    return path.join(dir, `${finalBaseName}${ext}`);
  }

  public static fileExists(filePath: string): boolean {
    try {
      return fs.existsSync(filePath);
    } catch {
      return false;
    }
  }

  public static getVersionedFilePath(
    sourcePdfPath: string,
    suffix: string = '',
    format: OutputFileFormat = 'md'
  ): string {
    const dir = path.dirname(sourcePdfPath);
    const baseName = path.basename(sourcePdfPath, path.extname(sourcePdfPath));
    const cleanSuffix = suffix.trim();
    const prefix = cleanSuffix ? `${baseName}${cleanSuffix}` : baseName;
    const ext = format === 'txt' ? '.txt' : '.md';

    let version = 1;
    let candidate = path.join(dir, `${prefix}_${version}${ext}`);
    while (fs.existsSync(candidate)) {
      version++;
      candidate = path.join(dir, `${prefix}_${version}${ext}`);
    }
    return candidate;
  }

  public static async resolveCollision(
    targetPath: string,
    sourcePath: string,
    batchMode: boolean = false,
    currentBatchChoice?: FileCollisionAction,
    format: OutputFileFormat = 'md'
  ): Promise<CollisionDecision> {
    if (!fs.existsSync(targetPath)) {
      return { action: 'overwrite', targetFilePath: targetPath };
    }

    if (currentBatchChoice === 'overwriteAll') {
      return { action: 'overwrite', targetFilePath: targetPath };
    }
    if (currentBatchChoice === 'skipAll') {
      return { action: 'skip', targetFilePath: targetPath };
    }

    const fileName = path.basename(targetPath);
    const options: string[] = ['Overwrite', 'Skip', 'Create Versioned Copy'];
    if (batchMode) {
      options.push('Overwrite All', 'Skip All');
    }

    this.logger.info(
      `File collision detected for target: ${targetPath}. Prompting user choice.`,
      'FileResolver'
    );

    const selection = await vscode.window.showWarningMessage(
      `File "${fileName}" already exists. How would you like to proceed?`,
      { modal: true },
      ...options
    );

    switch (selection) {
      case 'Overwrite':
        return { action: 'overwrite', targetFilePath: targetPath };
      case 'Skip':
        return { action: 'skip', targetFilePath: targetPath };
      case 'Create Versioned Copy': {
        const versioned = this.getVersionedFilePath(sourcePath, '', format);
        return { action: 'version', targetFilePath: versioned };
      }
      case 'Overwrite All':
        return { action: 'overwriteAll', targetFilePath: targetPath };
      case 'Skip All':
        return { action: 'skipAll', targetFilePath: targetPath };
      default:
        // Dismissed or cancelled dialog
        return { action: 'skip', targetFilePath: targetPath };
    }
  }
}
