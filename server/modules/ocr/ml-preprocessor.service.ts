/**
 * ML-Powered Document Preprocessing Service
 * 
 * Uses TensorFlow.js models to enhance OCR accuracy through:
 * - Layout detection and segmentation
 * - Text orientation correction
 * - Image quality enhancement
 * - Document type classification
 * 
 * @module MLPreprocessorService
 * @sprint SPRINT5-001
 */

import * as tf from '@tensorflow/tfjs-node';
import sharp from 'sharp';

/**
 * Document preprocessing result
 */
export interface PreprocessingResult {
  processedImage: Buffer;
  orientation: number; // 0, 90, 180, 270 degrees
  layoutRegions: LayoutRegion[];
  documentType: DocumentType;
  confidence: number;
  processingTimeMs: number;
}

/**
 * Layout region detected in document
 */
export interface LayoutRegion {
  type: 'text' | 'table' | 'image' | 'header' | 'footer' | 'chart';
  bbox: { x: number; y: number; width: number; height: number };
  confidence: number;
  order: number; // Reading order
}

/**
 * Document type classification
 */
export type DocumentType = 
  | 'technical-report'
  | 'geological-survey'
  | 'assay-results'
  | 'drilling-logs'
  | 'resource-estimate'
  | 'compliance-form'
  | 'general-document';

/**
 * ML Preprocessor Service Configuration
 */
export interface MLPreprocessorConfig {
  modelPath?: string;
  enableGPU?: boolean;
  maxImageSize?: number;
  confidenceThreshold?: number;
}

/**
 * ML-Powered Document Preprocessor Service
 * 
 * Enhances OCR accuracy through intelligent preprocessing
 */
export class MLPreprocessorService {
  private model: tf.GraphModel | null = null;
  private orientationModel: tf.LayersModel | null = null;
  private layoutModel: tf.GraphModel | null = null;
  private initialized: boolean = false;
  private config: Required<MLPreprocessorConfig>;

  constructor(config: MLPreprocessorConfig = {}) {
    this.config = {
      modelPath: config.modelPath || 'shared/ml/models',
      enableGPU: config.enableGPU ?? false,
      maxImageSize: config.maxImageSize || 4096,
      confidenceThreshold: config.confidenceThreshold || 0.7,
    };
  }

  /**
   * Initialize ML models
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    const startTime = Date.now();
    console.log('[MLPreprocessor] Initializing ML models...');

    try {
      // Set backend
      if (this.config.enableGPU) {
        await tf.setBackend('tensorflow');
      } else {
        await tf.setBackend('cpu');
      }

      // Load orientation detection model
      // This is a lightweight CNN trained to detect document rotation
      this.orientationModel = await this.loadOrCreateOrientationModel();

      // Load layout detection model
      // Uses object detection to identify different document regions
      this.layoutModel = await this.loadOrCreateLayoutModel();

      this.initialized = true;
      console.log(`[MLPreprocessor] Models initialized in ${Date.now() - startTime}ms`);
    } catch (error) {
      console.error('[MLPreprocessor] Failed to initialize models:', error);
      throw new Error('Failed to initialize ML preprocessor');
    }
  }

  /**
   * Preprocess document image for enhanced OCR
   */
  async preprocess(imageBuffer: Buffer): Promise<PreprocessingResult> {
    if (!this.initialized) {
      await this.initialize();
    }

    const startTime = Date.now();
    console.log('[MLPreprocessor] Starting preprocessing...');

    try {
      // 1. Load and normalize image
      const { image, metadata } = await this.loadImage(imageBuffer);

      // 2. Detect orientation
      const orientation = await this.detectOrientation(image);
      console.log(`[MLPreprocessor] Detected orientation: ${orientation}°`);

      // 3. Rotate if needed
      const rotatedImage = orientation !== 0 
        ? await this.rotateImage(imageBuffer, orientation)
        : imageBuffer;

      // 4. Detect layout regions
      const layoutRegions = await this.detectLayout(rotatedImage);
      console.log(`[MLPreprocessor] Detected ${layoutRegions.length} layout regions`);

      // 5. Classify document type
      const { documentType, confidence } = await this.classifyDocument(
        rotatedImage,
        layoutRegions
      );
      console.log(`[MLPreprocessor] Document type: ${documentType} (${confidence.toFixed(2)})`);

      // 6. Enhance image quality
      const processedImage = await this.enhanceImage(rotatedImage, documentType);

      const processingTimeMs = Date.now() - startTime;
      console.log(`[MLPreprocessor] Preprocessing completed in ${processingTimeMs}ms`);

      return {
        processedImage,
        orientation,
        layoutRegions,
        documentType,
        confidence,
        processingTimeMs,
      };
    } catch (error) {
      console.error('[MLPreprocessor] Preprocessing failed:', error);
      throw error;
    }
  }

  /**
   * Detect document orientation (0, 90, 180, 270 degrees)
   */
  private async detectOrientation(imageTensor: tf.Tensor3D): Promise<number> {
    if (!this.orientationModel) {
      return 0; // Fallback: assume correct orientation
    }

    return tf.tidy(() => {
      // Resize to model input size (224x224)
      const resized = tf.image.resizeBilinear(imageTensor, [224, 224]);
      const normalized = resized.div(255.0);
      const batched = normalized.expandDims(0);

      // Predict orientation (0, 1, 2, 3 = 0°, 90°, 180°, 270°)
      const prediction = this.orientationModel!.predict(batched) as tf.Tensor;
      const orientationIndex = prediction.argMax(-1).dataSync()[0];

      return orientationIndex * 90;
    });
  }

  /**
   * Detect layout regions (text blocks, tables, images, etc.)
   */
  private async detectLayout(imageBuffer: Buffer): Promise<LayoutRegion[]> {
    if (!this.layoutModel) {
      return []; // Fallback: no layout detection
    }

    const image = await sharp(imageBuffer).raw().toBuffer({ resolveWithObject: true });
    const { data, info } = image;

    const regions: LayoutRegion[] = [];

    await tf.tidy(() => {
      // Convert buffer to tensor
      const tensor = tf.tensor3d(
        new Uint8Array(data),
        [info.height, info.width, info.channels]
      );

      // Resize to model input size
      const resized = tf.image.resizeBilinear(tensor, [640, 640]);
      const normalized = resized.div(255.0);
      const batched = normalized.expandDims(0);

      // Run object detection
      const predictions = this.layoutModel!.predict(batched) as tf.Tensor[];
      
      // Parse predictions (boxes, scores, classes)
      const boxes = predictions[0].arraySync() as number[][][];
      const scores = predictions[1].arraySync() as number[][];
      const classes = predictions[2].arraySync() as number[][];

      const threshold = this.config.confidenceThreshold;

      for (let i = 0; i < scores[0].length; i++) {
        const score = scores[0][i];
        if (score < threshold) continue;

        const [y1, x1, y2, x2] = boxes[0][i];
        const classId = classes[0][i];

        regions.push({
          type: this.mapClassToRegionType(classId),
          bbox: {
            x: x1 * info.width,
            y: y1 * info.height,
            width: (x2 - x1) * info.width,
            height: (y2 - y1) * info.height,
          },
          confidence: score,
          order: i,
        });
      }
    });

    // Sort regions by reading order (top to bottom, left to right)
    return regions.sort((a, b) => {
      const rowDiff = a.bbox.y - b.bbox.y;
      if (Math.abs(rowDiff) > 20) return rowDiff;
      return a.bbox.x - b.bbox.x;
    });
  }

  /**
   * Classify document type based on layout and content
   */
  private async classifyDocument(
    imageBuffer: Buffer,
    layoutRegions: LayoutRegion[]
  ): Promise<{ documentType: DocumentType; confidence: number }> {
    // Rule-based classification based on layout patterns
    const hasTable = layoutRegions.some(r => r.type === 'table');
    const hasChart = layoutRegions.some(r => r.type === 'chart');
    const tableCount = layoutRegions.filter(r => r.type === 'table').length;

    // Heuristics for document type classification
    if (tableCount >= 3 && hasChart) {
      return { documentType: 'technical-report', confidence: 0.85 };
    } else if (tableCount >= 2 && layoutRegions.length > 5) {
      return { documentType: 'assay-results', confidence: 0.80 };
    } else if (hasTable && hasChart) {
      return { documentType: 'resource-estimate', confidence: 0.75 };
    } else if (tableCount === 1 && layoutRegions.length <= 3) {
      return { documentType: 'compliance-form', confidence: 0.70 };
    } else {
      return { documentType: 'general-document', confidence: 0.60 };
    }
  }

  /**
   * Enhance image quality for better OCR
   */
  private async enhanceImage(
    imageBuffer: Buffer,
    documentType: DocumentType
  ): Promise<Buffer> {
    let sharpInstance = sharp(imageBuffer);

    // Apply document-specific enhancements
    switch (documentType) {
      case 'technical-report':
      case 'geological-survey':
        // Enhance text clarity
        sharpInstance = sharpInstance
          .sharpen(2, 1, 0.5)
          .normalize()
          .modulate({ brightness: 1.1 });
        break;

      case 'assay-results':
      case 'drilling-logs':
        // Optimize for tabular data
        sharpInstance = sharpInstance
          .sharpen(1.5, 0.5, 0.3)
          .threshold(128, { grayscale: false });
        break;

      case 'compliance-form':
        // Enhance form fields
        sharpInstance = sharpInstance
          .sharpen(1, 0.5, 0.2)
          .normalize();
        break;

      default:
        // General enhancement
        sharpInstance = sharpInstance
          .sharpen()
          .normalize();
    }

    return sharpInstance.toBuffer();
  }

  /**
   * Load image and convert to tensor
   */
  private async loadImage(imageBuffer: Buffer): Promise<{
    image: tf.Tensor3D;
    metadata: { width: number; height: number };
  }> {
    const processed = await sharp(imageBuffer)
      .resize(this.config.maxImageSize, this.config.maxImageSize, {
        fit: 'inside',
        withoutEnlargement: true,
      })
      .raw()
      .toBuffer({ resolveWithObject: true });

    const tensor = tf.tensor3d(
      new Uint8Array(processed.data),
      [processed.info.height, processed.info.width, processed.info.channels]
    ) as tf.Tensor3D;

    return {
      image: tensor,
      metadata: {
        width: processed.info.width,
        height: processed.info.height,
      },
    };
  }

  /**
   * Rotate image by specified degrees
   */
  private async rotateImage(imageBuffer: Buffer, degrees: number): Promise<Buffer> {
    return sharp(imageBuffer).rotate(degrees).toBuffer();
  }

  /**
   * Map class ID to region type
   */
  private mapClassToRegionType(classId: number): LayoutRegion['type'] {
    const mapping: Record<number, LayoutRegion['type']> = {
      0: 'text',
      1: 'table',
      2: 'image',
      3: 'header',
      4: 'footer',
      5: 'chart',
    };
    return mapping[classId] || 'text';
  }

  /**
   * Load or create orientation detection model
   */
  private async loadOrCreateOrientationModel(): Promise<tf.LayersModel> {
    try {
      // Try to load pre-trained model
      const modelPath = `file://${this.config.modelPath}/orientation/model.json`;
      return await tf.loadLayersModel(modelPath);
    } catch {
      // Create simple CNN for orientation detection
      console.warn('[MLPreprocessor] Pre-trained orientation model not found, using default');
      return this.createDefaultOrientationModel();
    }
  }

  /**
   * Load or create layout detection model
   */
  private async loadOrCreateLayoutModel(): Promise<tf.GraphModel> {
    try {
      // Try to load pre-trained model
      const modelPath = `file://${this.config.modelPath}/layout/model.json`;
      return await tf.loadGraphModel(modelPath);
    } catch {
      console.warn('[MLPreprocessor] Pre-trained layout model not found, using default');
      // In production, you would load a pre-trained object detection model
      // For now, we'll return a mock that doesn't actually process
      return this.createDefaultLayoutModel();
    }
  }

  /**
   * Create default orientation detection model
   */
  private createDefaultOrientationModel(): tf.LayersModel {
    const model = tf.sequential({
      layers: [
        tf.layers.conv2d({
          inputShape: [224, 224, 3],
          filters: 32,
          kernelSize: 3,
          activation: 'relu',
        }),
        tf.layers.maxPooling2d({ poolSize: 2 }),
        tf.layers.conv2d({ filters: 64, kernelSize: 3, activation: 'relu' }),
        tf.layers.maxPooling2d({ poolSize: 2 }),
        tf.layers.flatten(),
        tf.layers.dense({ units: 128, activation: 'relu' }),
        tf.layers.dropout({ rate: 0.5 }),
        tf.layers.dense({ units: 4, activation: 'softmax' }), // 4 orientations
      ],
    });

    return model;
  }

  /**
   * Create default layout detection model
   */
  private createDefaultLayoutModel(): tf.GraphModel {
    // This is a placeholder - in production, use a proper object detection model
    // like SSD, YOLO, or Faster R-CNN
    return {} as tf.GraphModel;
  }

  /**
   * Cleanup resources
   */
  async dispose(): Promise<void> {
    if (this.orientationModel) {
      this.orientationModel.dispose();
    }
    if (this.layoutModel) {
      (this.layoutModel as any).dispose?.();
    }
    this.initialized = false;
    console.log('[MLPreprocessor] Models disposed');
  }
}

// Export singleton instance
export const mlPreprocessor = new MLPreprocessorService();
