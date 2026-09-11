import { MergedPageResult } from './types';

export class MarkdownFormatter {
  /**
   * Formats the document into clean, high-fidelity Markdown while preserving
   * exact line breaks, formula structure, and page boundaries without
   * destructive regex transformations.
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
        pageParts.push(`--- Page ${page.pageNumber} ---`);
      }

      const text = page.mergedText ? page.mergedText.trim() : '';
      if (text.length > 0) {
        pageParts.push(text);
      }

      if (pageParts.length > 0) {
        formattedPages.push(pageParts.join('\n\n'));
      }
    }

    return formattedPages.join('\n\n\n') + '\n';
  }
}
