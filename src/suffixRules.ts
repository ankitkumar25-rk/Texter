/**
 * Dynamic suffix generator and filename sanitizer.
 */

export class SuffixRules {
  /**
   * Sanitizes a filename string, removing characters forbidden on Windows/Linux/macOS.
   */
  public static sanitizeFilename(name: string): string {
    return name.replace(/[<>:"/\\|?*\x00-\x1F]/g, '_');
  }

  /**
   * Expands suffix templates such as {date}, {timestamp}, {pageCount}.
   */
  public static resolveSuffix(template: string, pageCount?: number): string {
    if (!template) {
      return '';
    }

    const now = new Date();
    const dateStr = now.toISOString().split('T')[0]; // YYYY-MM-DD
    const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, '-'); // HH-MM-SS

    let resolved = template
      .replace(/\{date\}/gi, dateStr)
      .replace(/\{timestamp\}/gi, `${dateStr}_${timeStr}`)
      .replace(/\{pageCount\}/gi, String(pageCount || 1));

    return this.sanitizeFilename(resolved);
  }
}
