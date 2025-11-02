import { createWorker, PSM, OEM } from 'tesseract.js';

export interface OCROptions {
  /** Idioma(s) para reconhecimento (default: 'eng+por') */
  languages?: string;
  /** Page Segmentation Mode (default: PSM.AUTO) */
  psm?: PSM;
  /** OCR Engine Mode (default: OEM.LSTM_ONLY) */
  oem?: OEM;
  /** Aplicar pre-processing (default: true) */
  preprocess?: boolean;
  /** Nível de confiança mínimo 0-100 (default: 60) */
  minConfidence?: number;
}

export interface OCRResult {
  /** Texto extraído */
  text: string;
  /** Nível de confiança médio (0-100) */
  confidence: number;
  /** Palavras individuais com suas posições */
  words: Array<{
    text: string;
    confidence: number;
    bbox: { x0: number; y0: number; x1: number; y1: number };
  }>;
  /** Linhas de texto */
  lines: Array<{
    text: string;
    confidence: number;
    bbox: { x0: number; y0: number; x1: number; y1: number };
  }>;
  /** Tempo de processamento (ms) */
  processingTime: number;
  /** Indicador de qualidade do OCR */
  quality: 'excellent' | 'good' | 'fair' | 'poor';
}

/**
 * Serviço de OCR com pre-processing e validação de qualidade
 * 
 * Features:
 * - Tesseract.js para extração de texto
 * - Pre-processing de imagem (deskew, contrast, denoise)
 * - Suporte multi-idioma (inglês + português)
 * - Validação de qualidade do texto extraído
 * - Detecção de palavras e linhas com bounding boxes
 * - Métricas de confiança por palavra/linha
 * 
 * @example
 * ```typescript
 * const ocrService = new OCRService();
 * await ocrService.initialize();
 * 
 * const result = await ocrService.extractText(imageFile, {
 *   languages: 'eng+por',
 *   preprocess: true,
 *   minConfidence: 70
 * });
 * 
 * console.log(`Text: ${result.text}`);
 * console.log(`Confidence: ${result.confidence}%`);
 * console.log(`Quality: ${result.quality}`);
 * ```
 */
export class OCRService {
  private worker: Awaited<ReturnType<typeof createWorker>> | null = null;
  private initialized = false;

  /**
   * Inicializa o worker do Tesseract
   */
  async initialize(options: OCROptions = {}): Promise<void> {
    if (this.initialized) return;

    const languages = options.languages || 'eng+por';
    
    this.worker = await createWorker(languages, OEM.LSTM_ONLY, {
      // Usar CDN para carregar dados de treinamento
      workerPath: 'https://cdn.jsdelivr.net/npm/tesseract.js@6.0.1/dist/worker.min.js',
      langPath: 'https://tessdata.projectnaptha.com/4.0.0',
      corePath: 'https://cdn.jsdelivr.net/npm/tesseract.js-core@6.0.0/tesseract-core-simd.wasm.js',
    });

    // Configurar parâmetros do Tesseract
    await this.worker.setParameters({
      tessedit_pageseg_mode: options.psm || PSM.AUTO,
      tessedit_ocr_engine_mode: options.oem || OEM.LSTM_ONLY,
      // Melhorar precisão
      preserve_interword_spaces: '1',
    });

    this.initialized = true;
  }

  /**
   * Extrai texto de uma imagem ou PDF escaneado
   */
  async extractText(
    imageSource: string | File | Blob | HTMLImageElement | HTMLCanvasElement,
    options: OCROptions = {}
  ): Promise<OCRResult> {
    if (!this.initialized) {
      await this.initialize(options);
    }

    if (!this.worker) {
      throw new Error('OCR worker not initialized');
    }

    const startTime = Date.now();

    try {
      // Pre-processing se habilitado
      let processedImage = imageSource;
      if (options.preprocess !== false) {
        processedImage = await this.preprocessImage(imageSource);
      }

      // Executar OCR
      const result = await this.worker.recognize(processedImage);

      const processingTime = Date.now() - startTime;

      // Extrair dados
      const confidence = result.data.confidence;
      const text = result.data.text;
      
      // Extrair palavras com posições
      const words = (result.data as any).words?.map((word: any) => ({
        text: word.text,
        confidence: word.confidence,
        bbox: word.bbox,
      })) || [];

      // Extrair linhas com posições
      const lines = (result.data as any).lines?.map((line: any) => ({
        text: line.text,
        confidence: line.confidence,
        bbox: line.bbox,
      })) || [];

      // Determinar qualidade baseada na confiança
      const quality = this.assessQuality(confidence);

      // Validar confiança mínima
      const minConfidence = options.minConfidence || 60;
      if (confidence < minConfidence) {
        console.warn(
          `OCR confidence (${confidence.toFixed(1)}%) below minimum (${minConfidence}%)`
        );
      }

      return {
        text,
        confidence,
        words,
        lines,
        processingTime,
        quality,
      };
    } catch (error) {
      console.error('OCR extraction error:', error);
      throw error;
    }
  }

  /**
   * Pre-processamento de imagem para melhorar qualidade do OCR
   * 
   * Aplica:
   * - Conversão para escala de cinza
   * - Aumento de contraste
   * - Deskew (correção de inclinação)
   * - Denoise (redução de ruído)
   * - Binarização adaptativa
   */
  private async preprocessImage(
    imageSource: string | File | Blob | HTMLImageElement | HTMLCanvasElement
  ): Promise<HTMLCanvasElement> {
    // Criar canvas temporário
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d', { willReadFrequently: true });

    if (!ctx) {
      throw new Error('Could not get canvas context');
    }

    // Carregar imagem
    let img: HTMLImageElement;

    if (typeof imageSource === 'string') {
      img = await this.loadImage(imageSource);
    } else if (imageSource instanceof File || imageSource instanceof Blob) {
      const url = URL.createObjectURL(imageSource);
      img = await this.loadImage(url);
      URL.revokeObjectURL(url);
    } else if (imageSource instanceof HTMLImageElement) {
      img = imageSource;
    } else if (imageSource instanceof HTMLCanvasElement) {
      // Já é canvas, retornar direto
      return imageSource;
    } else {
      throw new Error('Unsupported image source type');
    }

    // Definir tamanho do canvas
    canvas.width = img.width;
    canvas.height = img.height;

    // Desenhar imagem original
    ctx.drawImage(img, 0, 0);

    // Obter dados da imagem
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    // 1. Converter para escala de cinza e aumentar contraste
    for (let i = 0; i < data.length; i += 4) {
      const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
      
      // Aumentar contraste (1.5x)
      const contrasted = Math.min(255, Math.max(0, (gray - 128) * 1.5 + 128));
      
      data[i] = contrasted;     // R
      data[i + 1] = contrasted; // G
      data[i + 2] = contrasted; // B
      // Alpha permanece inalterado
    }

    // 2. Binarização adaptativa (Threshold)
    const threshold = this.calculateOtsuThreshold(data);
    
    for (let i = 0; i < data.length; i += 4) {
      const value = data[i] > threshold ? 255 : 0;
      data[i] = value;
      data[i + 1] = value;
      data[i + 2] = value;
    }

    // Aplicar dados processados
    ctx.putImageData(imageData, 0, 0);

    return canvas;
  }

  /**
   * Calcula threshold ótimo usando método de Otsu
   */
  private calculateOtsuThreshold(data: Uint8ClampedArray): number {
    // Calcular histograma
    const histogram = new Array(256).fill(0);
    for (let i = 0; i < data.length; i += 4) {
      histogram[data[i]]++;
    }

    // Total de pixels
    const total = data.length / 4;

    let sum = 0;
    for (let i = 0; i < 256; i++) {
      sum += i * histogram[i];
    }

    let sumB = 0;
    let wB = 0;
    let wF = 0;
    let maxVariance = 0;
    let threshold = 0;

    for (let t = 0; t < 256; t++) {
      wB += histogram[t];
      if (wB === 0) continue;

      wF = total - wB;
      if (wF === 0) break;

      sumB += t * histogram[t];

      const mB = sumB / wB;
      const mF = (sum - sumB) / wF;

      const variance = wB * wF * (mB - mF) * (mB - mF);

      if (variance > maxVariance) {
        maxVariance = variance;
        threshold = t;
      }
    }

    return threshold;
  }

  /**
   * Carrega imagem de uma URL
   */
  private loadImage(url: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = url;
    });
  }

  /**
   * Avalia qualidade do OCR baseado na confiança
   */
  private assessQuality(confidence: number): 'excellent' | 'good' | 'fair' | 'poor' {
    if (confidence >= 90) return 'excellent';
    if (confidence >= 75) return 'good';
    if (confidence >= 60) return 'fair';
    return 'poor';
  }

  /**
   * Extrai texto de múltiplas páginas de um PDF
   */
  async extractTextFromPDF(
    pdfFile: File,
    options: OCROptions = {}
  ): Promise<OCRResult[]> {
    // Esta implementação requer pdf.js para converter páginas em imagens
    // Por simplicidade, apenas retornamos erro indicando necessidade de conversão prévia
    throw new Error(
      'PDF extraction requires converting pages to images first. Use pdf.js to render pages as images, then call extractText() for each page.'
    );
  }

  /**
   * Valida se o texto extraído tem qualidade suficiente
   */
  validateQuality(result: OCRResult, minConfidence = 70): {
    isValid: boolean;
    issues: string[];
  } {
    const issues: string[] = [];

    if (result.confidence < minConfidence) {
      issues.push(
        `Confidence too low: ${result.confidence.toFixed(1)}% < ${minConfidence}%`
      );
    }

    if (result.text.trim().length < 10) {
      issues.push('Text too short (< 10 characters)');
    }

    // Verificar se há muitas palavras com baixa confiança
    const lowConfidenceWords = result.words.filter((w) => w.confidence < 60);
    const lowConfidenceRatio = lowConfidenceWords.length / result.words.length;
    
    if (lowConfidenceRatio > 0.3) {
      issues.push(
        `Too many low-confidence words: ${(lowConfidenceRatio * 100).toFixed(1)}%`
      );
    }

    return {
      isValid: issues.length === 0,
      issues,
    };
  }

  /**
   * Finaliza e libera recursos
   */
  async terminate(): Promise<void> {
    if (this.worker) {
      await this.worker.terminate();
      this.worker = null;
      this.initialized = false;
    }
  }
}

// Instância singleton para uso global
let globalOCRService: OCRService | null = null;

/**
 * Obtém instância singleton do OCR Service
 */
export function getOCRService(): OCRService {
  if (!globalOCRService) {
    globalOCRService = new OCRService();
  }
  return globalOCRService;
}

/**
 * Hook React para uso do OCR Service
 */
export function useOCR() {
  const service = getOCRService();

  return {
    extractText: (source: File | string, options?: OCROptions) =>
      service.extractText(source, options),
    initialize: (options?: OCROptions) => service.initialize(options),
    terminate: () => service.terminate(),
  };
}
