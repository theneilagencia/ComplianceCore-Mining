/**
 * Table Structure Detection Service
 * 
 * Uses computer vision and ML to detect and extract table structures from documents.
 * Identifies:
 * - Table boundaries
 * - Row and column structure
 * - Cell boundaries and content
 * - Header rows
 * - Merged cells
 * 
 * @module TableDetectorService
 * @sprint SPRINT5-001
 */

import * as tf from '@tensorflow/tfjs-node';
import sharp from 'sharp';

/**
 * Detected table structure
 */
export interface TableStructure {
  bbox: { x: number; y: number; width: number; height: number };
  rows: TableRow[];
  columns: TableColumn[];
  cells: TableCell[];
  confidence: number;
  headerRowCount: number;
}

/**
 * Table row information
 */
export interface TableRow {
  index: number;
  y: number;
  height: number;
  isHeader: boolean;
}

/**
 * Table column information
 */
export interface TableColumn {
  index: number;
  x: number;
  width: number;
}

/**
 * Table cell information
 */
export interface TableCell {
  rowIndex: number;
  columnIndex: number;
  rowSpan: number;
  colSpan: number;
  bbox: { x: number; y: number; width: number; height: number };
  text?: string;
  confidence: number;
}

/**
 * Table detection result
 */
export interface TableDetectionResult {
  tables: TableStructure[];
  totalTablesFound: number;
  processingTimeMs: number;
}

/**
 * Table Detector Service Configuration
 */
export interface TableDetectorConfig {
  minConfidence?: number;
  minTableSize?: { width: number; height: number };
  detectMergedCells?: boolean;
  enableML?: boolean;
}

/**
 * Table Structure Detection Service
 * 
 * Detects and extracts table structures from document images
 */
export class TableDetectorService {
  private model: tf.GraphModel | null = null;
  private initialized: boolean = false;
  private config: Required<TableDetectorConfig>;

  constructor(config: TableDetectorConfig = {}) {
    this.config = {
      minConfidence: config.minConfidence || 0.75,
      minTableSize: config.minTableSize || { width: 100, height: 50 },
      detectMergedCells: config.detectMergedCells ?? true,
      enableML: config.enableML ?? true,
    };
  }

  /**
   * Initialize ML model for table detection
   */
  async initialize(): Promise<void> {
    if (this.initialized || !this.config.enableML) {
      return;
    }

    const startTime = Date.now();
    console.log('[TableDetector] Initializing table detection model...');

    try {
      await tf.setBackend('cpu');
      
      // In production, load pre-trained table detection model
      // For now, we'll use rule-based detection
      this.initialized = true;
      console.log(`[TableDetector] Initialized in ${Date.now() - startTime}ms`);
    } catch (error) {
      console.error('[TableDetector] Failed to initialize:', error);
      throw new Error('Failed to initialize table detector');
    }
  }

  /**
   * Detect tables in document image
   */
  async detectTables(imageBuffer: Buffer): Promise<TableDetectionResult> {
    if (!this.initialized && this.config.enableML) {
      await this.initialize();
    }

    const startTime = Date.now();
    console.log('[TableDetector] Starting table detection...');

    try {
      // Convert to grayscale for better line detection
      const processed = await sharp(imageBuffer)
        .grayscale()
        .normalize()
        .toBuffer({ resolveWithObject: true });

      const { data, info } = processed;

      // Detect table boundaries using rule-based approach
      const tables = await this.detectTableBoundaries(data, info);

      // For each table, detect structure
      for (const table of tables) {
        await this.detectTableStructure(imageBuffer, table);
      }

      const processingTimeMs = Date.now() - startTime;
      console.log(`[TableDetector] Found ${tables.length} tables in ${processingTimeMs}ms`);

      return {
        tables,
        totalTablesFound: tables.length,
        processingTimeMs,
      };
    } catch (error) {
      console.error('[TableDetector] Detection failed:', error);
      throw error;
    }
  }

  /**
   * Detect table boundaries in image
   */
  private async detectTableBoundaries(
    data: Buffer,
    info: { width: number; height: number; channels: number }
  ): Promise<TableStructure[]> {
    // Simple rule-based table detection
    // In production, use ML model or advanced CV algorithms

    const tables: TableStructure[] = [];

    // Detect horizontal and vertical lines using edge detection
    const lines = this.detectLines(data, info);
    
    // Find intersections that form table grids
    const grids = this.findTableGrids(lines, info);

    for (const grid of grids) {
      if (
        grid.width >= this.config.minTableSize.width &&
        grid.height >= this.config.minTableSize.height
      ) {
        tables.push({
          bbox: grid,
          rows: [],
          columns: [],
          cells: [],
          confidence: 0.8, // Placeholder confidence
          headerRowCount: 1, // Assume first row is header
        });
      }
    }

    return tables;
  }

  /**
   * Detect horizontal and vertical lines
   */
  private detectLines(
    data: Buffer,
    info: { width: number; height: number; channels: number }
  ): { horizontal: number[]; vertical: number[] } {
    const horizontal: number[] = [];
    const vertical: number[] = [];
    const threshold = 200; // Pixel intensity threshold

    // Scan for horizontal lines (many consecutive light pixels in a row)
    for (let y = 0; y < info.height; y++) {
      let whitePixelCount = 0;
      for (let x = 0; x < info.width; x++) {
        const pixelIndex = (y * info.width + x) * info.channels;
        const intensity = data[pixelIndex];
        
        if (intensity > threshold) {
          whitePixelCount++;
        }
      }

      // If >80% of row is light colored, it's likely a line
      if (whitePixelCount > info.width * 0.8) {
        horizontal.push(y);
      }
    }

    // Scan for vertical lines
    for (let x = 0; x < info.width; x++) {
      let whitePixelCount = 0;
      for (let y = 0; y < info.height; y++) {
        const pixelIndex = (y * info.width + x) * info.channels;
        const intensity = data[pixelIndex];
        
        if (intensity > threshold) {
          whitePixelCount++;
        }
      }

      if (whitePixelCount > info.height * 0.8) {
        vertical.push(x);
      }
    }

    return { horizontal, vertical };
  }

  /**
   * Find table grids from detected lines
   */
  private findTableGrids(
    lines: { horizontal: number[]; vertical: number[] },
    info: { width: number; height: number }
  ): Array<{ x: number; y: number; width: number; height: number }> {
    const grids: Array<{ x: number; y: number; width: number; height: number }> = [];

    // Group consecutive horizontal lines
    const horizontalGroups = this.groupConsecutiveLines(lines.horizontal);
    
    // Group consecutive vertical lines
    const verticalGroups = this.groupConsecutiveLines(lines.vertical);

    // Find rectangles formed by line intersections
    for (let i = 0; i < horizontalGroups.length - 1; i++) {
      for (let j = 0; j < verticalGroups.length - 1; j++) {
        const y1 = horizontalGroups[i];
        const y2 = horizontalGroups[i + 1];
        const x1 = verticalGroups[j];
        const x2 = verticalGroups[j + 1];

        // Check if this forms a reasonable table
        const width = x2 - x1;
        const height = y2 - y1;

        if (
          width >= this.config.minTableSize.width &&
          height >= this.config.minTableSize.height &&
          width <= info.width * 0.95 &&
          height <= info.height * 0.95
        ) {
          grids.push({ x: x1, y: y1, width, height });
        }
      }
    }

    return grids;
  }

  /**
   * Group consecutive line positions
   */
  private groupConsecutiveLines(lines: number[]): number[] {
    if (lines.length === 0) return [];

    const groups: number[] = [lines[0]];
    const tolerance = 5; // pixels

    for (let i = 1; i < lines.length; i++) {
      const lastGroup = groups[groups.length - 1];
      
      if (lines[i] - lastGroup > tolerance) {
        groups.push(lines[i]);
      }
    }

    return groups;
  }

  /**
   * Detect internal structure of a table (rows, columns, cells)
   */
  private async detectTableStructure(
    imageBuffer: Buffer,
    table: TableStructure
  ): Promise<void> {
    // Extract table region
    const tableImage = await sharp(imageBuffer)
      .extract({
        left: Math.floor(table.bbox.x),
        top: Math.floor(table.bbox.y),
        width: Math.floor(table.bbox.width),
        height: Math.floor(table.bbox.height),
      })
      .grayscale()
      .normalize()
      .toBuffer({ resolveWithObject: true });

    const { data, info } = tableImage;

    // Detect lines within the table
    const lines = this.detectLines(data, info);

    // Convert line positions to row/column definitions
    const rows = this.linesToRows(lines.horizontal, table.bbox.y);
    const columns = this.linesToColumns(lines.vertical, table.bbox.x);

    table.rows = rows;
    table.columns = columns;

    // Generate cells from row/column intersections
    table.cells = this.generateCells(rows, columns);

    // Detect merged cells if enabled
    if (this.config.detectMergedCells) {
      this.detectMergedCells(table, data, info);
    }

    console.log(
      `[TableDetector] Table structure: ${rows.length} rows x ${columns.length} columns = ${table.cells.length} cells`
    );
  }

  /**
   * Convert line positions to row definitions
   */
  private linesToRows(horizontalLines: number[], offsetY: number): TableRow[] {
    const groups = this.groupConsecutiveLines(horizontalLines);
    const rows: TableRow[] = [];

    for (let i = 0; i < groups.length - 1; i++) {
      rows.push({
        index: i,
        y: groups[i] + offsetY,
        height: groups[i + 1] - groups[i],
        isHeader: i === 0, // Assume first row is header
      });
    }

    return rows;
  }

  /**
   * Convert line positions to column definitions
   */
  private linesToColumns(verticalLines: number[], offsetX: number): TableColumn[] {
    const groups = this.groupConsecutiveLines(verticalLines);
    const columns: TableColumn[] = [];

    for (let i = 0; i < groups.length - 1; i++) {
      columns.push({
        index: i,
        x: groups[i] + offsetX,
        width: groups[i + 1] - groups[i],
      });
    }

    return columns;
  }

  /**
   * Generate cells from row/column intersections
   */
  private generateCells(rows: TableRow[], columns: TableColumn[]): TableCell[] {
    const cells: TableCell[] = [];

    for (const row of rows) {
      for (const column of columns) {
        cells.push({
          rowIndex: row.index,
          columnIndex: column.index,
          rowSpan: 1,
          colSpan: 1,
          bbox: {
            x: column.x,
            y: row.y,
            width: column.width,
            height: row.height,
          },
          confidence: 0.85,
        });
      }
    }

    return cells;
  }

  /**
   * Detect merged cells (cells spanning multiple rows/columns)
   */
  private detectMergedCells(
    table: TableStructure,
    data: Buffer,
    info: { width: number; height: number; channels: number }
  ): void {
    // Simple heuristic: if a cell has very few line pixels inside,
    // it might be merged with adjacent cells
    // This is a placeholder for more sophisticated detection

    for (const cell of table.cells) {
      const linePixels = this.countLinePixelsInCell(cell, data, info);
      
      // If cell has very few internal lines, it might be merged
      if (linePixels < 10) {
        // Check if we should extend rowSpan or colSpan
        // (In production, use more sophisticated logic)
        if (cell.bbox.width > cell.bbox.height * 2) {
          cell.colSpan = 2;
        } else if (cell.bbox.height > cell.bbox.width * 2) {
          cell.rowSpan = 2;
        }
      }
    }
  }

  /**
   * Count line pixels within a cell boundary
   */
  private countLinePixelsInCell(
    cell: TableCell,
    data: Buffer,
    info: { width: number; height: number; channels: number }
  ): number {
    let linePixelCount = 0;
    const threshold = 200;

    const x1 = Math.floor(cell.bbox.x);
    const y1 = Math.floor(cell.bbox.y);
    const x2 = Math.min(x1 + Math.floor(cell.bbox.width), info.width - 1);
    const y2 = Math.min(y1 + Math.floor(cell.bbox.height), info.height - 1);

    for (let y = y1; y <= y2; y++) {
      for (let x = x1; x <= x2; x++) {
        const pixelIndex = (y * info.width + x) * info.channels;
        if (pixelIndex < data.length && data[pixelIndex] > threshold) {
          linePixelCount++;
        }
      }
    }

    return linePixelCount;
  }

  /**
   * Cleanup resources
   */
  async dispose(): Promise<void> {
    if (this.model) {
      (this.model as any).dispose?.();
    }
    this.initialized = false;
    console.log('[TableDetector] Disposed');
  }
}

// Export singleton instance
export const tableDetector = new TableDetectorService();
