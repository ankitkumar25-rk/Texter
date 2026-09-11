import * as fs from 'fs';
import * as vscode from 'vscode';
import { ConfigManager } from './config';
import { DocumentFormatter } from './formatter';
import { HybridMerger } from './merger';
import { OcrEngine } from './ocrEngine';
import { OutputLogger } from './outputChannel';
import { PdfParser } from './pdfParser';
import { PdfPageRenderer } from './renderer';
import { ConversionResult, MergedPageResult, ProgressCallback } from './types';

export class SinglePdfConverter {
  private logger = OutputLogger.getInstance();
  private configManager = ConfigManager.getInstance();

  /**
   * Converts a single PDF file into plain text.
   */
  public async convertFile(
    sourcePdfPath: string,
    targetTxtPath: string,
    progressCallback?: ProgressCallback,
    token?: vscode.CancellationToken
  ): Promise<ConversionResult> {
    const startTime = Date.now();
    const config = this.configManager.getConfig();
    this.logger.info(`Starting conversion for: ${sourcePdfPath}`, 'SinglePdfConverter');

    try {
      if (token?.isCancellationRequested) {
        throw new Error('Conversion cancelled by user.');
      }

      // Step 1: Extract text layer
      progressCallback?.({
        message: 'Parsing PDF text layer...',
        currentFile: sourcePdfPath,
      });

      const pdfPages = await PdfParser.parsePdf(sourcePdfPath);
      const totalPages = pdfPages.length;

      const mergedPages: MergedPageResult[] = [];
      let ocrFallbackPages = 0;
      let lowConfidenceFlags = 0;
      let mathFormulasFound = 0;

      const ocrEngine = OcrEngine.getInstance();

      // Step 2: Iterate over each page and run hybrid processing
      for (let i = 0; i < totalPages; i++) {
        if (token?.isCancellationRequested) {
          throw new Error('Conversion cancelled by user.');
        }

        const page = pdfPages[i];
        const pageNum = page.pageNumber;

        progressCallback?.({
          message: `Processing page ${pageNum} of ${totalPages}...`,
          currentPage: pageNum,
          totalPages,
          currentFile: sourcePdfPath,
        });

        const shouldRunOcr = config.ocrAllPages || !page.hasSelectableText;
        let ocrResult = null;

        if (shouldRunOcr) {
          try {
            const pageImageBuffer = await PdfPageRenderer.renderPageToBuffer(
              sourcePdfPath,
              pageNum
            );

            if (pageImageBuffer) {
              ocrResult = await ocrEngine.recognizeBuffer(pageImageBuffer, pageNum);
            }
          } catch (ocrErr) {
            this.logger.warn(
              `OCR failed on page ${pageNum} for ${sourcePdfPath}: ${ocrErr}`,
              'SinglePdfConverter'
            );
          }
        }

        const merged = HybridMerger.mergePage(
          page,
          ocrResult,
          config.ocrConfidenceThreshold
        );

        if (merged.usedOcrFallback) {
          ocrFallbackPages++;
        }
        if (merged.lowConfidenceFlagged) {
          lowConfidenceFlags += merged.lowConfidenceCount;
        }
        mathFormulasFound += merged.detectedMathFormulas;

        mergedPages.push(merged);
      }

      // Step 3: Format the complete document
      const fullText = DocumentFormatter.formatDocument(
        mergedPages,
        config.preservePageMarkers
      );

      // Step 4: Write to output file
      await fs.promises.writeFile(targetTxtPath, fullText, 'utf8');

      const durationMs = Date.now() - startTime;
      this.logger.info(
        `Successfully converted ${sourcePdfPath} -> ${targetTxtPath} in ${durationMs}ms. Pages: ${totalPages}, OCR fallbacks: ${ocrFallbackPages}, Low-conf: ${lowConfidenceFlags}`,
        'SinglePdfConverter'
      );

      return {
        sourceFilePath: sourcePdfPath,
        targetFilePath: targetTxtPath,
        success: true,
        pageCount: totalPages,
        ocrFallbackPages,
        lowConfidenceFlags,
        mathFormulasFound,
        mergedPages,
        fullText,
        durationMs,
      };
    } catch (err) {
      const durationMs = Date.now() - startTime;
      const errorMsg = err instanceof Error ? err.message : String(err);
      this.logger.error(`Conversion failed for ${sourcePdfPath}`, err, 'SinglePdfConverter');

      return {
        sourceFilePath: sourcePdfPath,
        targetFilePath: targetTxtPath,
        success: false,
        pageCount: 0,
        ocrFallbackPages: 0,
        lowConfidenceFlags: 0,
        mathFormulasFound: 0,
        mergedPages: [],
        fullText: '',
        errorMessage: errorMsg,
        durationMs,
      };
    }
  }
}
