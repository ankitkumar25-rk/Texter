import * as fs from 'fs';
import { OutputLogger } from './outputChannel';

let pdfjsLib: any = null;

async function getPdfJs() {
  if (!pdfjsLib) {
    try {
      pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.js');
    } catch {
      try {
        pdfjsLib = require('pdfjs-dist/legacy/build/pdf.js');
      } catch {
        pdfjsLib = require('pdfjs-dist');
      }
    }
  }
  return pdfjsLib;
}

export interface RenderPageOptions {
  scale?: number;
}

export class PdfPageRenderer {
  private static logger = OutputLogger.getInstance();

  /**
   * Renders a specific page of a PDF document to an image Buffer for OCR processing.
   */
  public static async renderPageToBuffer(
    pdfPath: string,
    pageNumber: number,
    options: RenderPageOptions = { scale: 2.0 }
  ): Promise<Buffer | null> {
    try {
      this.logger.debug(`Rendering page ${pageNumber} of ${pdfPath} for OCR`, 'PdfPageRenderer');

      const fileBuffer = await fs.promises.readFile(pdfPath);
      const pdfjs = await getPdfJs();
      const loadingTask = pdfjs.getDocument({
        data: new Uint8Array(fileBuffer),
        useSystemFonts: true,
        disableFontFace: true,
      });

      const pdfDoc = await loadingTask.promise;
      const page = await pdfDoc.getPage(pageNumber);
      const scale = options.scale || 2.0;
      const viewport = page.getViewport({ scale });

      // Attempt to use canvas if available (node-canvas or @napi-rs/canvas)
      let createCanvas: any = null;
      try {
        const canvasModule = require('@napi-rs/canvas');
        createCanvas = canvasModule.createCanvas;
      } catch {
        try {
          const canvasModule = require('canvas');
          createCanvas = canvasModule.createCanvas;
        } catch {
          createCanvas = null;
        }
      }

      if (createCanvas) {
        const canvas = createCanvas(Math.floor(viewport.width), Math.floor(viewport.height));
        const ctx = canvas.getContext('2d');

        const renderContext = {
          canvasContext: ctx,
          viewport: viewport,
        };

        await page.render(renderContext).promise;
        const imageBuffer = typeof canvas.toBuffer === 'function' 
          ? canvas.toBuffer('image/png') 
          : Buffer.from(canvas.toDataURL().split(',')[1], 'base64');

        return imageBuffer;
      }

      // Fallback: If no native canvas binary is available in current environment,
      // return null so OCR engine can fallback gracefully or use SVG stream
      this.logger.warn(
        `Canvas rendering module not loaded, page ${pageNumber} will rely on text-layer extraction.`,
        'PdfPageRenderer'
      );
      return null;
    } catch (err) {
      this.logger.error(`Failed to render page ${pageNumber} to buffer`, err, 'PdfPageRenderer');
      return null;
    }
  }
}
