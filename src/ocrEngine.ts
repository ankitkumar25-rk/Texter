import { createWorker, Worker } from 'tesseract.js';
import { OcrBlock, OcrLine, OcrPageResult, OcrSymbol } from './types';
import { OutputLogger } from './outputChannel';

export class OcrEngine {
  private static instance: OcrEngine;
  private worker: Worker | null = null;
  private isInitializing = false;
  private logger = OutputLogger.getInstance();

  private constructor() {}

  public static getInstance(): OcrEngine {
    if (!OcrEngine.instance) {
      OcrEngine.instance = new OcrEngine();
    }
    return OcrEngine.instance;
  }

  public async initializeWorker(): Promise<void> {
    if (this.worker || this.isInitializing) {
      return;
    }

    this.isInitializing = true;
    try {
      this.logger.info('Initializing Tesseract OCR worker...', 'OcrEngine');
      const worker = await createWorker('eng');
      this.worker = worker;
      this.logger.info('Tesseract OCR worker initialized successfully.', 'OcrEngine');
    } catch (err) {
      this.logger.error('Failed to initialize Tesseract OCR worker', err, 'OcrEngine');
      this.worker = null;
    } finally {
      this.isInitializing = false;
    }
  }

  public async recognizeBuffer(
    imageBuffer: Buffer,
    pageNumber: number
  ): Promise<OcrPageResult | null> {
    try {
      if (!this.worker) {
        await this.initializeWorker();
      }

      if (!this.worker) {
        this.logger.warn('OCR worker unavailable, skipping OCR pass.', 'OcrEngine');
        return null;
      }

      this.logger.debug(`Running OCR on page ${pageNumber}...`, 'OcrEngine');
      const result = await this.worker.recognize(imageBuffer);
      const data = result.data;

      const blocks: OcrBlock[] = [];
      let lowConfidenceCount = 0;

      if (data.blocks && data.blocks.length > 0) {
        for (const b of data.blocks) {
          const lines: OcrLine[] = [];
          if (b.lines) {
            for (const l of b.lines) {
              const symbols: OcrSymbol[] = [];
              if (l.words) {
                for (const w of l.words) {
                  if (w.symbols) {
                    for (const s of w.symbols) {
                      symbols.push({
                        text: s.text,
                        confidence: s.confidence,
                        bbox: s.bbox ? {
                          x: s.bbox.x0,
                          y: s.bbox.y0,
                          width: s.bbox.x1 - s.bbox.x0,
                          height: s.bbox.y1 - s.bbox.y0,
                        } : undefined,
                      });
                    }
                  }
                }
              }

              lines.push({
                text: l.text.trim(),
                confidence: l.confidence,
                bbox: l.bbox ? {
                  x: l.bbox.x0,
                  y: l.bbox.y0,
                  width: l.bbox.x1 - l.bbox.x0,
                  height: l.bbox.y1 - l.bbox.y0,
                } : undefined,
                symbols,
              });

              if (l.confidence < 60) {
                lowConfidenceCount++;
              }
            }
          }

          blocks.push({
            text: b.text.trim(),
            confidence: b.confidence,
            lines,
            bbox: b.bbox ? {
              x: b.bbox.x0,
              y: b.bbox.y0,
              width: b.bbox.x1 - b.bbox.x0,
              height: b.bbox.y1 - b.bbox.y0,
            } : undefined,
          });
        }
      }

      return {
        pageNumber,
        rawText: data.text || '',
        confidence: data.confidence || 0,
        blocks,
        lowConfidenceCount,
      };
    } catch (err) {
      this.logger.error(`OCR failed on page ${pageNumber}`, err, 'OcrEngine');
      return null;
    }
  }

  public async terminate(): Promise<void> {
    if (this.worker) {
      try {
        await this.worker.terminate();
      } catch (err) {
        this.logger.error('Error terminating OCR worker', err, 'OcrEngine');
      } finally {
        this.worker = null;
      }
    }
  }
}
