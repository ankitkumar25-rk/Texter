import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';
import { OutputLogger } from './outputChannel';

export class WorkspaceScanner {
  private static logger = OutputLogger.getInstance();
  private static readonly IGNORED_DIRS = new Set([
    'node_modules',
    '.git',
    '.vscode',
    'dist',
    'out',
    'build',
    '.next',
    'target',
  ]);

  /**
   * Discovers all PDF files within all active workspace folders.
   */
  public static async scanWorkspace(): Promise<string[]> {
    const folders = vscode.workspace.workspaceFolders;
    if (!folders || folders.length === 0) {
      this.logger.warn('No active workspace folder found.', 'WorkspaceScanner');
      return [];
    }

    const discoveredPdfs: string[] = [];

    // Use vscode.workspace.findFiles for optimal workspace indexing if available
    try {
      const uris = await vscode.workspace.findFiles('**/*.{pdf,PDF}', '**/node_modules/**');
      for (const uri of uris) {
        discoveredPdfs.push(uri.fsPath);
      }
      this.logger.info(`Discovered ${discoveredPdfs.length} PDF files via workspace search.`, 'WorkspaceScanner');
      return discoveredPdfs;
    } catch {
      // Fallback manual recursive scan
      for (const folder of folders) {
        const results = await this.scanDirectory(folder.uri.fsPath);
        discoveredPdfs.push(...results);
      }
      return discoveredPdfs;
    }
  }

  /**
   * Recursively scans a specific directory path for PDF files.
   */
  public static async scanDirectory(dirPath: string): Promise<string[]> {
    const results: string[] = [];

    try {
      const entries = await fs.promises.readdir(dirPath, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);

        if (entry.isDirectory()) {
          if (!this.IGNORED_DIRS.has(entry.name)) {
            const subResults = await this.scanDirectory(fullPath);
            results.push(...subResults);
          }
        } else if (entry.isFile()) {
          const ext = path.extname(entry.name).toLowerCase();
          if (ext === '.pdf') {
            results.push(fullPath);
          }
        }
      }
    } catch (err) {
      this.logger.error(`Error scanning directory: ${dirPath}`, err, 'WorkspaceScanner');
    }

    return results;
  }
}
