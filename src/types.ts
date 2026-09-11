/**
 * Core type definitions for PDF to Text Converter (Texter)
 */

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface PdfTextItem {
  str: string;
  dir?: string;
  width: number;
  height: number;
  transform: number[];
  fontName?: string;
  hasEOL?: boolean;
}

export interface PdfPageContent {
  pageNumber: number;
  totalPageCount: number;
  text: string;
  lines: string[];
  items: PdfTextItem[];
  hasSelectableText: boolean;
  width: number;
  height: number;
}

export interface OcrSymbol {
  text: string;
  confidence: number;
  bbox?: BoundingBox;
}

export interface OcrLine {
  text: string;
  confidence: number;
  bbox?: BoundingBox;
  symbols?: OcrSymbol[];
}

export interface OcrBlock {
  text: string;
  confidence: number;
  bbox?: BoundingBox;
  lines: OcrLine[];
  isMathFormula?: boolean;
  isDiagramOrTable?: boolean;
}

export interface OcrPageResult {
  pageNumber: number;
  rawText: string;
  confidence: number;
  blocks: OcrBlock[];
  lowConfidenceCount: number;
}

export interface MergedPageResult {
  pageNumber: number;
  mergedText: string;
  usedOcrFallback: boolean;
  lowConfidenceFlagged: boolean;
  lowConfidenceCount: number;
  detectedMathFormulas: number;
}

export interface ConversionResult {
  sourceFilePath: string;
  targetFilePath: string;
  success: boolean;
  pageCount: number;
  ocrFallbackPages: number;
  lowConfidenceFlags: number;
  mathFormulasFound: number;
  mergedPages: MergedPageResult[];
  fullText: string;
  errorMessage?: string;
  durationMs: number;
}

export type FileCollisionAction = 'overwrite' | 'skip' | 'version' | 'overwriteAll' | 'skipAll' | 'cancel';

export type OutputFileFormat = 'md' | 'txt';

export interface ExtensionConfig {
  outputFormat: OutputFileFormat;
  ocrAllPages: boolean;
  ocrConfidenceThreshold: number;
  outputSuffix: string;
  preservePageMarkers: boolean;
}

export interface BatchSummary {
  totalDiscovered: number;
  convertedCount: number;
  skippedCount: number;
  failedCount: number;
  ocrFallbackPagesTotal: number;
  lowConfidenceSectionsTotal: number;
  failedFiles: Array<{ filePath: string; reason: string }>;
  durationMs: number;
}

export interface ProgressCallback {
  (progress: {
    message: string;
    increment?: number;
    currentFile?: string;
    currentPage?: number;
    totalPages?: number;
  }): void;
}
