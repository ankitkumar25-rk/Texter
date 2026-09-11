import * as vscode from 'vscode';

export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
}

export class OutputLogger {
  private static instance: OutputLogger;
  private channel: vscode.OutputChannel | null = null;
  private readonly channelName = 'PDF to Text';

  private constructor() {}

  public static getInstance(): OutputLogger {
    if (!OutputLogger.instance) {
      OutputLogger.instance = new OutputLogger();
    }
    return OutputLogger.instance;
  }

  public getChannel(): vscode.OutputChannel {
    if (!this.channel) {
      try {
        this.channel = vscode.window.createOutputChannel(this.channelName);
      } catch {
        // Fallback for non-vscode test environments
        this.channel = {
          name: this.channelName,
          append: (val: string) => process.stdout.write(val),
          appendLine: (val: string) => console.log(val),
          clear: () => {},
          show: () => {},
          hide: () => {},
          dispose: () => {},
          replace: () => {},
        } as unknown as vscode.OutputChannel;
      }
    }
    return this.channel;
  }

  public log(level: LogLevel, message: string, context?: string): void {
    const timestamp = new Date().toISOString();
    const ctx = context ? ` [${context}]` : '';
    const formatted = `[${timestamp}] [${level}]${ctx} ${message}`;
    this.getChannel().appendLine(formatted);
  }

  public info(message: string, context?: string): void {
    this.log(LogLevel.INFO, message, context);
  }

  public warn(message: string, context?: string): void {
    this.log(LogLevel.WARN, message, context);
  }

  public error(message: string, error?: unknown, context?: string): void {
    let errDetail = '';
    if (error instanceof Error) {
      errDetail = ` - ${error.message}${error.stack ? `\n${error.stack}` : ''}`;
    } else if (error) {
      errDetail = ` - ${String(error)}`;
    }
    this.log(LogLevel.ERROR, `${message}${errDetail}`, context);
  }

  public debug(message: string, context?: string): void {
    this.log(LogLevel.DEBUG, message, context);
  }

  public show(preserveFocus = true): void {
    this.getChannel().show(preserveFocus);
  }

  public clear(): void {
    this.getChannel().clear();
  }

  public dispose(): void {
    if (this.channel) {
      this.channel.dispose();
      this.channel = null;
    }
  }
}
