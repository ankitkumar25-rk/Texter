import { PdfTextItem } from './types';

export interface ColumnRegion {
  left: number;
  right: number;
  items: PdfTextItem[];
}

export interface TableRow {
  y: number;
  cells: string[];
}

export class LayoutDetector {
  /**
   * Detects whether text items on a page suggest a multi-column layout (e.g. 2-column paper).
   */
  public static detectMultiColumn(items: PdfTextItem[], pageWidth: number): boolean {
    if (items.length < 20) {
      return false;
    }

    const midpoint = pageWidth / 2;
    let leftCount = 0;
    let rightCount = 0;

    for (const item of items) {
      const x = item.transform[4] || 0;
      if (x < midpoint - 20) {
        leftCount++;
      } else if (x > midpoint + 20) {
        rightCount++;
      }
    }

    const total = leftCount + rightCount;
    if (total === 0) {
      return false;
    }

    const leftRatio = leftCount / total;
    const rightRatio = rightCount / total;

    // Both columns have significant balance
    return leftRatio > 0.25 && rightRatio > 0.25;
  }

  /**
   * Groups text items into aligned table rows when tabular grid properties are identified.
   */
  public static extractTableRows(items: PdfTextItem[]): TableRow[] {
    const yBuckets = new Map<number, PdfTextItem[]>();
    const Y_TOLERANCE = 4;

    for (const item of items) {
      const y = item.transform[5] || 0;
      let matchedY: number | null = null;

      for (const bucketY of yBuckets.keys()) {
        if (Math.abs(bucketY - y) <= Y_TOLERANCE) {
          matchedY = bucketY;
          break;
        }
      }

      if (matchedY !== null) {
        yBuckets.get(matchedY)!.push(item);
      } else {
        yBuckets.set(y, [item]);
      }
    }

    const sortedYs = Array.from(yBuckets.keys()).sort((a, b) => b - a); // Top to bottom
    const rows: TableRow[] = [];

    for (const y of sortedYs) {
      const rowItems = yBuckets.get(y)!;
      rowItems.sort((a, b) => (a.transform[4] || 0) - (b.transform[4] || 0)); // Left to right
      const cells = rowItems.map((it) => it.str.trim()).filter((s) => s.length > 0);
      if (cells.length > 1) {
        rows.push({ y, cells });
      }
    }

    return rows;
  }
}
