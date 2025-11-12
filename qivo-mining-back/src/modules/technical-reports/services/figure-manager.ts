/**
 * Figure Manager Service
 * Handles upload, validation, and management of maps and figures for technical reports
 */

import { z } from 'zod';
import sharp from 'sharp';
import * as fs from 'fs';
import * as path from 'path';
import { db } from '../../../lib/db';

export enum FigureType {
  LOCATION_MAP = 'location_map',
  PROPERTY_MAP = 'property_map',
  GEOLOGICAL_MAP = 'geological_map',
  DRILL_HOLE_PLAN = 'drill_hole_plan',
  CROSS_SECTION = 'cross_section',
  LONG_SECTION = 'long_section',
  BLOCK_MODEL = 'block_model',
  CHART = 'chart',
  PHOTO = 'photo',
  OTHER = 'other',
}

export interface FigureMetadata {
  id: string;
  reportId: string;
  type: FigureType;
  title: string;
  caption?: string;
  number: number; // Figure 1, Figure 2, etc.
  filePath: string;
  fileSize: number;
  mimeType: string;
  width: number;
  height: number;
  dpi: number;
  scale?: string; // e.g., "1:10,000"
  datum?: string; // e.g., "WGS84"
  projection?: string; // e.g., "UTM Zone 23S"
  createdAt: Date;
  updatedAt: Date;
}

export interface FigureValidation {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  metadata: {
    width: number;
    height: number;
    dpi: number;
    format: string;
    size: number;
  };
}

export class FigureManager {
  
  private readonly ALLOWED_FORMATS = ['image/png', 'image/jpeg', 'image/jpg', 'application/pdf'];
  private readonly MIN_DPI = 150;
  private readonly RECOMMENDED_DPI = 300;
  private readonly MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

  /**
   * Upload and validate figure
   */
  async uploadFigure(
    file: Express.Multer.File,
    reportId: string,
    type: FigureType,
    title: string,
    metadata?: Partial<FigureMetadata>
  ): Promise<FigureMetadata> {
    // Validate file
    const validation = await this.validateFigure(file);
    if (!validation.isValid) {
      throw new Error(`Figure validation failed: ${validation.errors.join(', ')}`);
    }

    // Generate unique filename
    const ext = path.extname(file.originalname);
    const filename = `${reportId}_${type}_${Date.now()}${ext}`;
    const filePath = path.join('/uploads/reports', reportId, 'figures', filename);

    // Ensure directory exists
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // Save file
    fs.writeFileSync(filePath, file.buffer);

    // Get next figure number
    const figureNumber = await this.getNextFigureNumber(reportId);

    // Save metadata to database
    const figure: FigureMetadata = {
      id: `fig_${Date.now()}`,
      reportId,
      type,
      title,
      caption: metadata?.caption,
      number: figureNumber,
      filePath,
      fileSize: file.size,
      mimeType: file.mimetype,
      width: validation.metadata.width,
      height: validation.metadata.height,
      dpi: validation.metadata.dpi,
      scale: metadata?.scale,
      datum: metadata?.datum,
      projection: metadata?.projection,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await this.saveFigureMetadata(figure);

    return figure;
  }

  /**
   * Validate figure file
   */
  async validateFigure(file: Express.Multer.File): Promise<FigureValidation> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check file format
    if (!this.ALLOWED_FORMATS.includes(file.mimetype)) {
      errors.push(`Invalid file format: ${file.mimetype}. Allowed formats: PNG, JPEG, PDF`);
    }

    // Check file size
    if (file.size > this.MAX_FILE_SIZE) {
      errors.push(`File size (${(file.size / 1024 / 1024).toFixed(2)}MB) exceeds maximum (50MB)`);
    }

    let metadata = {
      width: 0,
      height: 0,
      dpi: 0,
      format: '',
      size: file.size,
    };

    // For images, check resolution and DPI
    if (file.mimetype.startsWith('image/')) {
      try {
        const image = sharp(file.buffer);
        const imageMetadata = await image.metadata();

        metadata.width = imageMetadata.width || 0;
        metadata.height = imageMetadata.height || 0;
        metadata.format = imageMetadata.format || '';

        // Calculate DPI (if density is available)
        const dpi = imageMetadata.density || 72;
        metadata.dpi = dpi;

        // Check DPI
        if (dpi < this.MIN_DPI) {
          errors.push(`DPI (${dpi}) is below minimum requirement (${this.MIN_DPI})`);
        } else if (dpi < this.RECOMMENDED_DPI) {
          warnings.push(`DPI (${dpi}) is below recommended (${this.RECOMMENDED_DPI})`);
        }

        // Check resolution
        if (metadata.width < 800 || metadata.height < 600) {
          warnings.push(`Low resolution: ${metadata.width}x${metadata.height}. Recommended minimum: 1200x900`);
        }

      } catch (error) {
        errors.push(`Failed to read image metadata: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    // For PDFs, we can't check DPI easily, so just warn
    if (file.mimetype === 'application/pdf') {
      warnings.push('PDF format: DPI cannot be validated automatically. Ensure figures are high resolution (300 DPI minimum)');
      metadata.format = 'pdf';
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      metadata,
    };
  }

  /**
   * Get all figures for a report
   */
  async getFiguresByReport(reportId: string): Promise<FigureMetadata[]> {
    // TODO: Implement database query
    // For now, return empty array
    return [];
  }

  /**
   * Get figure by ID
   */
  async getFigureById(figureId: string): Promise<FigureMetadata | null> {
    // TODO: Implement database query
    return null;
  }

  /**
   * Update figure metadata
   */
  async updateFigure(
    figureId: string,
    updates: Partial<FigureMetadata>
  ): Promise<FigureMetadata> {
    // TODO: Implement database update
    throw new Error('Not implemented');
  }

  /**
   * Delete figure
   */
  async deleteFigure(figureId: string): Promise<void> {
    const figure = await this.getFigureById(figureId);
    if (!figure) {
      throw new Error('Figure not found');
    }

    // Delete file
    if (fs.existsSync(figure.filePath)) {
      fs.unlinkSync(figure.filePath);
    }

    // Delete from database
    // TODO: Implement database deletion
  }

  /**
   * Reorder figures
   */
  async reorderFigures(reportId: string, figureIds: string[]): Promise<void> {
    // Update figure numbers based on new order
    for (let i = 0; i < figureIds.length; i++) {
      await this.updateFigure(figureIds[i], { number: i + 1 });
    }
  }

  /**
   * Get next figure number for report
   */
  private async getNextFigureNumber(reportId: string): Promise<number> {
    const figures = await this.getFiguresByReport(reportId);
    if (figures.length === 0) {
      return 1;
    }
    const maxNumber = Math.max(...figures.map(f => f.number));
    return maxNumber + 1;
  }

  /**
   * Save figure metadata to database
   */
  private async saveFigureMetadata(figure: FigureMetadata): Promise<void> {
    // TODO: Implement database save
    // await db.reportFigures.create({ data: figure });
  }

  /**
   * Generate list of figures for report
   */
  async generateListOfFigures(reportId: string): Promise<string> {
    const figures = await this.getFiguresByReport(reportId);
    
    let listOfFigures = '# LIST OF FIGURES\n\n';
    
    figures
      .sort((a, b) => a.number - b.number)
      .forEach(figure => {
        listOfFigures += `Figure ${figure.number}: ${figure.title}\n`;
      });

    return listOfFigures;
  }

  /**
   * Get required figures by standard
   */
  getRequiredFigures(standard: string): { type: FigureType; title: string; description: string }[] {
    const requiredFigures = [
      {
        type: FigureType.LOCATION_MAP,
        title: 'Location Map',
        description: 'Regional location map showing project location, major cities, infrastructure (1:250,000 to 1:1,000,000)',
      },
      {
        type: FigureType.PROPERTY_MAP,
        title: 'Property Map',
        description: 'Local property map showing tenement boundaries, access, topography (1:10,000 to 1:50,000)',
      },
      {
        type: FigureType.GEOLOGICAL_MAP,
        title: 'Geological Map',
        description: 'Geological map showing lithology, structure, mineralization (1:1,000 to 1:10,000)',
      },
      {
        type: FigureType.DRILL_HOLE_PLAN,
        title: 'Drill Hole Location Plan',
        description: 'Plan showing all drill hole locations with collar coordinates',
      },
      {
        type: FigureType.CROSS_SECTION,
        title: 'Cross Sections',
        description: 'Geological cross sections showing mineralization, drill holes, resources (minimum 2-5 sections)',
      },
      {
        type: FigureType.LONG_SECTION,
        title: 'Long Section',
        description: 'Longitudinal section showing mineralization along strike',
      },
    ];

    // Add standard-specific requirements
    if (standard === 'JORC_2012' || standard === 'CBRR') {
      requiredFigures.push({
        type: FigureType.BLOCK_MODEL,
        title: 'Block Model Sections',
        description: 'Sections showing grade distribution and resource classification',
      });
    }

    return requiredFigures;
  }

  /**
   * Check if all required figures are uploaded
   */
  async checkRequiredFigures(reportId: string, standard: string): Promise<{
    complete: boolean;
    missing: string[];
    uploaded: string[];
  }> {
    const required = this.getRequiredFigures(standard);
    const uploaded = await this.getFiguresByReport(reportId);

    const uploadedTypes = new Set(uploaded.map(f => f.type));
    const missing: string[] = [];

    required.forEach(req => {
      if (!uploadedTypes.has(req.type)) {
        missing.push(req.title);
      }
    });

    return {
      complete: missing.length === 0,
      missing,
      uploaded: uploaded.map(f => f.title),
    };
  }
}

export default new FigureManager();
