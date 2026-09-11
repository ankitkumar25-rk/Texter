import { ContentAligner } from './aligner';
import { MathDetector } from './mathDetector';
import { OcrConfidenceHelper } from './ocrConfidence';
import { MergedPageResult, OcrPageResult, PdfPageContent } from './types';

export class HybridMerger {
  /**
   * Merges the high-fidelity text layer with the OCR recognition output for a single page.
   */
  public static mergePage(
    pdfPage: PdfPageContent,
    ocrResult: OcrPageResult | null,
    confidenceThreshold: number
  ): MergedPageResult {
    let lowConfidenceCount = 0;
    let detectedMathFormulas = 0;
    let usedOcrFallback = false;
    let mergedText = '';

    const textLayerEmpty = !pdfPage.hasSelectableText || pdfPage.text.trim().length === 0;
    const isGarbled = ContentAligner.isTextGarbled(pdfPage.text);

    if (ocrResult) {
      const decision = ContentAligner.evaluatePage(pdfPage, ocrResult);
      detectedMathFormulas += decision.detectedFormulas;

      // Case 1: Text layer is absent or garbled -> full OCR fallback
      if (textLayerEmpty || isGarbled) {
        usedOcrFallback = true;
        const processedBlocks: string[] = [];

        if (ocrResult.blocks && ocrResult.blocks.length > 0) {
          for (const block of ocrResult.blocks) {
            const { text, lowConfidenceCount: blockLowConf } =
              OcrConfidenceHelper.processBlock(block, confidenceThreshold);
            processedBlocks.push(text);
            lowConfidenceCount += blockLowConf;
          }
          mergedText = processedBlocks.join('\n\n');
        } else {
          // Fallback to raw OCR text if no block data
          if (ocrResult.confidence < confidenceThreshold) {
            mergedText = OcrConfidenceHelper.wrapLowConfidence(ocrResult.rawText);
            lowConfidenceCount++;
          } else {
            mergedText = ocrResult.rawText;
          }
        }
      }
      // Case 2: Clean text layer exists with missing equations/diagrams from OCR
      else {
        mergedText = pdfPage.text.trim();

        // Check text layer for math
        const textLayerMath = MathDetector.analyze(pdfPage.text);
        if (textLayerMath.hasMath) {
          detectedMathFormulas++;
        }

        // If additional formula/diagram blocks were identified in OCR
        if (decision.missingOcrBlocks.length > 0) {
          usedOcrFallback = true;
          const supplementarySections: string[] = [];

          for (const blockText of decision.missingOcrBlocks) {
            // Locate the block in OCR results for confidence checking
            const matchingBlock = ocrResult.blocks.find(
              (b) => b.text.trim() === blockText || blockText.includes(b.text.trim())
            );

            if (matchingBlock) {
              const { text, lowConfidenceCount: bLowConf } =
                OcrConfidenceHelper.processBlock(matchingBlock, confidenceThreshold);
              supplementarySections.push(text);
              lowConfidenceCount += bLowConf;
            } else {
              supplementarySections.push(blockText);
            }
          }

          if (supplementarySections.length > 0) {
            mergedText += '\n\n' + supplementarySections.join('\n\n');
          }
        }
      }
    } else {
      // No OCR result available -> use text layer directly
      mergedText = pdfPage.text.trim();
      const textMath = MathDetector.analyze(pdfPage.text);
      if (textMath.hasMath) {
        detectedMathFormulas++;
      }
    }

    return {
      pageNumber: pdfPage.pageNumber,
      mergedText: mergedText.trim(),
      usedOcrFallback,
      lowConfidenceFlagged: lowConfidenceCount > 0,
      lowConfidenceCount,
      detectedMathFormulas,
    };
  }
}
