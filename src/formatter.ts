import { MergedPageResult } from './types';

export class DocumentFormatter {
  /**
   * Generates a page header marker string.
   */
  public static getPageMarker(pageNumber: number): string {
    return `--- Page ${pageNumber} ---`;
  }

  /**
   * Combines an array of merged page results into a single cohesive plain text document.
   */
  public static formatDocument(
    pages: MergedPageResult[],
    preservePageMarkers: boolean = true
  ): string {
    if (!pages || pages.length === 0) {
      return '';
    }

    const formattedPages: string[] = [];

    for (const page of pages) {
      const pageParts: string[] = [];

      if (preservePageMarkers) {
        pageParts.push(this.getPageMarker(page.pageNumber));
      }

      if (page.mergedText && page.mergedText.trim().length > 0) {
        pageParts.push(page.mergedText.trim());
      }

      if (pageParts.length > 0) {
        formattedPages.push(pageParts.join('\n\n'));
      }
    }

    return formattedPages.join('\n\n\n') + '\n';
  }
}
