import * as fs from 'fs';
import { PdfPageContent, PdfTextItem } from './types';
import { OutputLogger } from './outputChannel';

function getPdfJs() {
  let pdfjs: any;
  try {
    pdfjs = require('pdfjs-dist/legacy/build/pdf.js');
  } catch {
    pdfjs = require('pdfjs-dist');
  }

  // Preload worker onto globalThis so pdfjs uses the in-process main thread worker handler
  // rather than attempting browser-style document script tag creation in Node / Electron
  try {
    const pdfjsWorker = require('pdfjs-dist/legacy/build/pdf.worker.js');
    (globalThis as any).pdfjsWorker = pdfjsWorker;
  } catch {
    try {
      const pdfjsWorker = require('pdfjs-dist/build/pdf.worker.js');
      (globalThis as any).pdfjsWorker = pdfjsWorker;
    } catch {
      // ignore
    }
  }

  return pdfjs;
}

export class PdfParser {
  private static logger = OutputLogger.getInstance();

  /**
   * Loads and parses the text layer for each page in the provided PDF file.
   */
  public static async parsePdf(filePath: string): Promise<PdfPageContent[]> {
    this.logger.info(`Parsing text layer for: ${filePath}`, 'PdfParser');

    const fileBuffer = await fs.promises.readFile(filePath);
    const uint8Array = new Uint8Array(fileBuffer);
    const pdfjs = getPdfJs();

    const loadingTask = pdfjs.getDocument({
      data: uint8Array,
      useSystemFonts: true,
      disableFontFace: true,
      isEvalSupported: false,
      useWorkerFetch: false,
    });

    const pdfDoc = await loadingTask.promise;
    const numPages: number = pdfDoc.numPages;
    const pages: PdfPageContent[] = [];

    this.logger.debug(`Document has ${numPages} pages`, 'PdfParser');

    for (let pageNum = 1; pageNum <= numPages; pageNum++) {
      const page = await pdfDoc.getPage(pageNum);
      const viewport = page.getViewport({ scale: 1.0 });
      const textContent = await page.getTextContent();

      const items: PdfTextItem[] = [];
      const lines: string[] = [];
      let currentLine = '';
      let lastY: number | null = null;

      for (const item of textContent.items as any[]) {
        if (!item.str && item.str !== '') {
          continue;
        }

        const textItem: PdfTextItem = {
          str: item.str,
          dir: item.dir,
          width: item.width || 0,
          height: item.height || 0,
          transform: item.transform || [1, 0, 1, 1, 0, 0],
          fontName: item.fontName,
          hasEOL: item.hasEOL,
        };
        items.push(textItem);

        const currentY = item.transform ? item.transform[5] : 0;

        // Group items by vertical position to reconstruct lines
        if (lastY !== null && Math.abs(currentY - lastY) > 5) {
          if (currentLine.trim().length > 0) {
            lines.push(currentLine.trim());
          }
          currentLine = item.str;
        } else {
          currentLine += (currentLine.length > 0 && !currentLine.endsWith(' ') && !item.str.startsWith(' ') ? ' ' : '') + item.str;
        }

        lastY = currentY;

        if (item.hasEOL && currentLine.trim().length > 0) {
          lines.push(currentLine.trim());
          currentLine = '';
          lastY = null;
        }
      }

      if (currentLine.trim().length > 0) {
        lines.push(currentLine.trim());
      }

      const fullPageText = lines.join('\n');
      const hasSelectableText = fullPageText.trim().length > 0;

      pages.push({
        pageNumber: pageNum,
        totalPageCount: numPages,
        text: fullPageText,
        lines,
        items,
        hasSelectableText,
        width: viewport.width,
        height: viewport.height,
      });

      this.logger.debug(
        `Page ${pageNum}/${numPages}: ${lines.length} lines extracted, hasSelectableText=${hasSelectableText}`,
        'PdfParser'
      );
    }

    return pages;
  }
}
