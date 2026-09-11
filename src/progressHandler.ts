import * as vscode from 'vscode';
import { OutputLogger } from './outputChannel';

export interface ProgressTaskContext {
  report(message: string, increment?: number): void;
  isCancelled(): boolean;
  token: vscode.CancellationToken;
}

export class ProgressHandler {
  private static logger = OutputLogger.getInstance();

  /**
   * Executes an async task inside a VS Code progress notification with cancel support.
   */
  public static async runWithProgress<T>(
    title: string,
    task: (context: ProgressTaskContext) => Promise<T>
  ): Promise<T> {
    return vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title,
        cancellable: true,
      },
      async (progress, token) => {
        let lastReportedPercentage = 0;

        const context: ProgressTaskContext = {
          report: (message: string, increment?: number) => {
            if (increment !== undefined) {
              lastReportedPercentage += increment;
            }
            progress.report({ message, increment });
            this.logger.debug(`[Progress] ${message}`, 'ProgressHandler');
          },
          isCancelled: () => token.isCancellationRequested,
          token,
        };

        return await task(context);
      }
    );
  }
}
