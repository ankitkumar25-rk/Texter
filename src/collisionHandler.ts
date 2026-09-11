import * as vscode from 'vscode';
import { FileCollisionAction } from './types';
import { OutputLogger } from './outputChannel';

export class CollisionHandler {
  private static logger = OutputLogger.getInstance();

  /**
   * Prompts the user with a choice when an output text file already exists.
   */
  public static async promptForAction(
    targetFileName: string,
    isBatch: boolean = false
  ): Promise<FileCollisionAction> {
    const items: string[] = ['Overwrite', 'Skip', 'Create Versioned Copy'];
    if (isBatch) {
      items.push('Overwrite All', 'Skip All');
    }

    this.logger.debug(`Showing collision prompt for: ${targetFileName}`, 'CollisionHandler');

    const choice = await vscode.window.showInformationMessage(
      `The file "${targetFileName}" already exists. How do you want to handle it?`,
      { modal: true },
      ...items
    );

    switch (choice) {
      case 'Overwrite':
        return 'overwrite';
      case 'Skip':
        return 'skip';
      case 'Create Versioned Copy':
        return 'version';
      case 'Overwrite All':
        return 'overwriteAll';
      case 'Skip All':
        return 'skipAll';
      default:
        return 'skip';
    }
  }
}
