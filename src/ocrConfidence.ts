import { OcrLine, OcrBlock } from './types';

export const OCR_LOW_CONF_START = '[OCR-LOW-CONFIDENCE]';
export const OCR_LOW_CONF_END = '[/OCR-LOW-CONFIDENCE]';

export class OcrConfidenceHelper {
  /**
   * Wraps text in low-confidence markers.
   */
  public static wrapLowConfidence(text: string): string {
    const trimmed = text.trim();
    if (!trimmed) {
      return '';
    }
    return `${OCR_LOW_CONF_START} ${trimmed} ${OCR_LOW_CONF_END}`;
  }

  /**
   * Processes an OCR line and wraps it in markers if confidence is below threshold.
   */
  public static processLine(
    line: OcrLine,
    threshold: number
  ): { text: string; isLowConfidence: boolean } {
    const isLow = line.confidence < threshold;
    const text = isLow ? this.wrapLowConfidence(line.text) : line.text;
    return {
      text,
      isLowConfidence: isLow,
    };
  }

  /**
   * Processes an entire OCR block, preserving line breaks.
   */
  public static processBlock(
    block: OcrBlock,
    threshold: number
  ): { text: string; lowConfidenceCount: number } {
    let lowConfidenceCount = 0;
    const processedLines: string[] = [];

    if (block.lines && block.lines.length > 0) {
      for (const line of block.lines) {
        if (!line.text.trim()) {
          continue;
        }
        const { text, isLowConfidence } = this.processLine(line, threshold);
        processedLines.push(text);
        if (isLowConfidence) {
          lowConfidenceCount++;
        }
      }
    } else {
      const isLow = block.confidence < threshold;
      const text = isLow ? this.wrapLowConfidence(block.text) : block.text;
      processedLines.push(text);
      if (isLow) {
        lowConfidenceCount++;
      }
    }

    return {
      text: processedLines.join('\n'),
      lowConfidenceCount,
    };
  }
}
