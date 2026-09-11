import { MergedPageResult } from './types';
import { MathDetector } from './mathDetector';
import { NotationNormalizer } from './notationNormalizer';

export class MarkdownFormatter {
  /**
   * Converts plain/merged text into clean, structured GitHub Flavored Markdown.
   */
  public static formatPageToMarkdown(page: MergedPageResult): string {
    const rawText = page.mergedText;
    if (!rawText || rawText.trim().length === 0) {
      return '';
    }

    const lines = rawText.split('\n');
    const mdLines: string[] = [];

    for (let i = 0; i < lines.length; i++) {
      let line = lines[i].trim();
      if (!line) {
        mdLines.push('');
        continue;
      }

      // Detect Headings (e.g. "1 Random Variables", "2.1 Probability mass function")
      if (/^\d+\s+[A-Z][a-zA-Z\s,–-]+$/.test(line)) {
        mdLines.push(`\n## ${line}\n`);
        continue;
      }
      if (/^\d+\.\d+\s+[A-Z][a-zA-Z\s,–-]+$/.test(line)) {
        mdLines.push(`\n### ${line}\n`);
        continue;
      }

      // Detect Theorems, Definitions, Propositions, Examples, Problems
      if (/^(?:Definition|Theorem|Proposition|Corollary|Lemma|Example|Problem)\s+\d+(?:\.\d+)?/i.test(line)) {
        mdLines.push(`\n**${line}**\n`);
        continue;
      }

      // Detect Solution / Proof keywords
      if (/^(?:Proof|Solution)\.\s*/i.test(line)) {
        mdLines.push(`\n*${line}*\n`);
        continue;
      }

      // Normalize Math Notation
      const mathAnalysis = MathDetector.analyze(line);
      if (mathAnalysis.hasMath) {
        line = NotationNormalizer.normalize(line);

        // If isolated mathematical equation, format as display LaTeX
        if (mathAnalysis.isIsolatedEquation && !line.startsWith('[OCR-LOW-CONFIDENCE]')) {
          mdLines.push(`\n$$${line}$$\n`);
          continue;
        }
      }

      mdLines.push(line);
    }

    return mdLines.join('\n');
  }

  /**
   * Formats the entire document into Markdown with page boundary markers.
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
        pageParts.push(`---\n\n### Page ${page.pageNumber}`);
      }

      const pageMd = this.formatPageToMarkdown(page);
      if (pageMd.trim().length > 0) {
        pageParts.push(pageMd);
      }

      if (pageParts.length > 0) {
        formattedPages.push(pageParts.join('\n\n'));
      }
    }

    return formattedPages.join('\n\n\n') + '\n';
  }
}
