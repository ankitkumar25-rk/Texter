/**
 * Custom error hierarchy for PDF to Text Converter (Texter)
 */

export class PdfConverterError extends Error {
  public readonly code: string;

  constructor(message: string, code: string = 'CONVERTER_ERROR') {
    super(message);
    this.name = 'PdfConverterError';
    this.code = code;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class PdfParseError extends PdfConverterError {
  constructor(message: string) {
    super(message, 'PDF_PARSE_ERROR');
    this.name = 'PdfParseError';
  }
}

export class OcrEngineError extends PdfConverterError {
  constructor(message: string) {
    super(message, 'OCR_ENGINE_ERROR');
    this.name = 'OcrEngineError';
  }
}

export class FileCollisionError extends PdfConverterError {
  constructor(message: string) {
    super(message, 'FILE_COLLISION_ERROR');
    this.name = 'FileCollisionError';
  }
}

export class CancellationError extends PdfConverterError {
  constructor(message: string = 'Operation was cancelled by user.') {
    super(message, 'OPERATION_CANCELLED');
    this.name = 'CancellationError';
  }
}

export class ErrorHandler {
  public static toUserFriendlyMessage(error: unknown): string {
    if (error instanceof CancellationError) {
      return 'Operation was cancelled.';
    }
    if (error instanceof PdfParseError) {
      return `Failed to parse PDF document structure: ${error.message}`;
    }
    if (error instanceof OcrEngineError) {
      return `OCR processing error: ${error.message}`;
    }
    if (error instanceof Error) {
      return error.message;
    }
    return String(error);
  }
}
