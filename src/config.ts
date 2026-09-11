import * as vscode from 'vscode';
import { ExtensionConfig } from './types';

export const CONFIG_SECTION = 'pdfToText';

export const DEFAULT_CONFIG: ExtensionConfig = {
  ocrAllPages: true,
  ocrConfidenceThreshold: 60,
  outputSuffix: '',
  preservePageMarkers: true,
};

export class ConfigManager {
  private static instance: ConfigManager;
  private overrides: Partial<ExtensionConfig> = {};

  private constructor() {}

  public static getInstance(): ConfigManager {
    if (!ConfigManager.instance) {
      ConfigManager.instance = new ConfigManager();
    }
    return ConfigManager.instance;
  }

  public getConfig(): ExtensionConfig {
    try {
      const vsConfig = vscode.workspace.getConfiguration(CONFIG_SECTION);
      return {
        ocrAllPages: this.getVal(vsConfig, 'ocrAllPages', DEFAULT_CONFIG.ocrAllPages),
        ocrConfidenceThreshold: this.getNumericVal(
          vsConfig,
          'ocrConfidenceThreshold',
          DEFAULT_CONFIG.ocrConfidenceThreshold,
          0,
          100
        ),
        outputSuffix: this.getVal(vsConfig, 'outputSuffix', DEFAULT_CONFIG.outputSuffix),
        preservePageMarkers: this.getVal(
          vsConfig,
          'preservePageMarkers',
          DEFAULT_CONFIG.preservePageMarkers
        ),
      };
    } catch {
      return {
        ...DEFAULT_CONFIG,
        ...this.overrides,
      };
    }
  }

  public setOverrides(overrides: Partial<ExtensionConfig>): void {
    this.overrides = { ...this.overrides, ...overrides };
  }

  public clearOverrides(): void {
    this.overrides = {};
  }

  private getVal<T>(config: vscode.WorkspaceConfiguration, key: string, fallback: T): T {
    if (this.overrides[key as keyof ExtensionConfig] !== undefined) {
      return this.overrides[key as keyof ExtensionConfig] as unknown as T;
    }
    const val = config.get<T>(key);
    return val !== undefined && val !== null ? val : fallback;
  }

  private getNumericVal(
    config: vscode.WorkspaceConfiguration,
    key: string,
    fallback: number,
    min: number,
    max: number
  ): number {
    const raw = this.getVal(config, key, fallback);
    const num = Number(raw);
    if (isNaN(num)) {
      return fallback;
    }
    return Math.max(min, Math.min(max, num));
  }
}
