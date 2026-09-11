import { MathDetector } from './mathDetector';
import { OcrPageResult, PdfPageContent } from './types';

export interface AlignmentDecision {
  useOcrFallback: boolean;
  missingOcrBlocks: string[];
  detectedFormulas: number;
}

export class ContentAligner {
  /**
   * Evaluates whether the PDF text layer is garbled, empty, or missing equations/diagrams
   * that were discovered in the OCR pass.
   */
  public static evaluatePage(
    pdfPage: PdfPageContent,
    ocrResult: OcrPageResult | null
  ): AlignmentDecision {
    const textLayerEmpty = !pdfPage.hasSelectableText || pdfPage.text.trim().length === 0;

    if (!ocrResult) {
      return {
        useOcrFallback: false,
        missingOcrBlocks: [],
        detectedFormulas: 0,
      };
    }

    // If text layer is completely empty, full fallback to OCR is needed
    if (textLayerEmpty) {
      return {
        useOcrFallback: true,
        missingOcrBlocks: [ocrResult.rawText],
        detectedFormulas: MathDetector.containsMath(ocrResult.rawText) ? 1 : 0,
      };
    }

    // Check if text layer contains garbled or placeholder glyphs
    const isGarbled = this.isTextGarbled(pdfPage.text);
    if (isGarbled) {
      return {
        useOcrFallback: true,
        missingOcrBlocks: [ocrResult.rawText],
        detectedFormulas: MathDetector.containsMath(ocrResult.rawText) ? 1 : 0,
      };
    }

    // Check for OCR blocks that contain equations or content missing from the text layer
    const missingOcrBlocks: string[] = [];
    let detectedFormulas = 0;

    for (const block of ocrResult.blocks) {
      const blockText = block.text.trim();
      if (!blockText) {
        continue;
      }

      const mathAnalysis = MathDetector.analyze(blockText);
      if (mathAnalysis.hasMath) {
        detectedFormulas++;
      }

      // If block contains math or is not represented in the PDF text layer
      if (mathAnalysis.hasMath || !this.isSubtextPresent(pdfPage.text, blockText)) {
        missingOcrBlocks.push(blockText);
      }
    }

    const useOcrFallback = missingOcrBlocks.length > 0;

    return {
      useOcrFallback,
      missingOcrBlocks,
      detectedFormulas,
    };
  }

  /**
   * Checks if text appears corrupted or contains high density of unmapped glyphs.
   */
  public static isTextGarbled(text: string): boolean {
    if (!text || text.length === 0) {
      return true;
    }
    const replacementCharCount = (text.match(/\uFFFD/g) || []).length;
    const nullCharCount = (text.match(/\0/g) || []).length;
    const totalChars = text.length;

    if (replacementCharCount / totalChars > 0.05 || nullCharCount > 0) {
      return true;
    }

    return false;
  }

  /**
   * Checks if a significant portion of an OCR snippet is already in the text layer.
   */
  private static isSubtextPresent(haystack: string, needle: string): boolean {
    const cleanHaystack = haystack.replace(/\s+/g, ' ').toLowerCase();
    const cleanNeedle = needle.replace(/\s+/g, ' ').toLowerCase();

    if (cleanNeedle.length < 8) {
      return cleanHaystack.includes(cleanNeedle);
    }

    // Match sample fragments
    const sample = cleanNeedle.slice(0, Math.min(30, cleanNeedle.length));
    return cleanHaystack.includes(sample);
  }
}
