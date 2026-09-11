export type PageMarkerStyle = 'standard' | 'markdown' | 'bracket' | 'double_line';

export class MarkerFormatter {
  /**
   * Generates a page marker based on a chosen style.
   */
  public static formatMarker(pageNumber: number, style: PageMarkerStyle = 'standard'): string {
    switch (style) {
      case 'markdown':
        return `# Page ${pageNumber}`;
      case 'bracket':
        return `[PAGE ${pageNumber}]`;
      case 'double_line':
        return `==================== Page ${pageNumber} ====================`;
      case 'standard':
      default:
        return `--- Page ${pageNumber} ---`;
    }
  }

  /**
   * Checks whether a line corresponds to any recognized page marker.
   */
  public static isPageMarker(line: string): boolean {
    const trimmed = line.trim();
    return (
      /^---\s*Page\s+\d+\s*---$/i.test(trimmed) ||
      /^#\s*Page\s+\d+$/i.test(trimmed) ||
      /^\[PAGE\s+\d+\]$/i.test(trimmed) ||
      /^={3,}\s*Page\s+\d+\s*={3,}$/i.test(trimmed)
    );
  }

  /**
   * Extracts the page number from a recognized page marker line.
   */
  public static extractPageNumber(line: string): number | null {
    const match = line.match(/\bPage\s+(\d+)\b/i);
    return match ? parseInt(match[1], 10) : null;
  }
}
