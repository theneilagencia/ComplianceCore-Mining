/**
 * Text Correction Service
 * 
 * Enhances OCR output quality through:
 * - Spelling correction
 * - Context-aware text correction
 * - Domain-specific terminology validation
 * - Confidence-based correction strategies
 * 
 * @module TextCorrectorService
 * @sprint SPRINT5-001
 */

/**
 * Text correction result
 */
export interface CorrectionResult {
  originalText: string;
  correctedText: string;
  corrections: TextCorrection[];
  confidenceScore: number;
  processingTimeMs: number;
}

/**
 * Individual text correction
 */
export interface TextCorrection {
  position: { start: number; end: number };
  originalWord: string;
  correctedWord: string;
  reason: CorrectionReason;
  confidence: number;
}

/**
 * Correction reason categories
 */
export type CorrectionReason =
  | 'spelling'
  | 'context'
  | 'domain-terminology'
  | 'common-ocr-error'
  | 'case-correction'
  | 'number-format';

/**
 * Mining domain terminology dictionary
 */
const MINING_TERMINOLOGY: Record<string, string> = {
  // Common OCR errors in mining documents
  jorc: 'JORC',
  'ni43-i01': 'NI43-101',
  'ni43-101': 'NI43-101',
  'ni 43-101': 'NI43-101',
  samrec: 'SAMREC',
  'sam rec': 'SAMREC',
  perc: 'PERC',
  crirsco: 'CRIRSCO',
  // Metals and minerals
  au: 'Au', // Gold
  ag: 'Ag', // Silver
  cu: 'Cu', // Copper
  fe: 'Fe', // Iron
  ni: 'Ni', // Nickel
  zn: 'Zn', // Zinc
  pb: 'Pb', // Lead
  pt: 'Pt', // Platinum
  pd: 'Pd', // Palladium
  // Units
  'g/t': 'g/t',
  'oz/t': 'oz/t',
  ppm: 'ppm',
  ppb: 'ppb',
  // Resource categories
  measured: 'Measured',
  indicated: 'Indicated',
  inferred: 'Inferred',
  proven: 'Proven',
  probable: 'Probable',
  // Common terms
  assay: 'assay',
  ore: 'ore',
  grade: 'grade',
  tonnage: 'tonnage',
  reserve: 'reserve',
  resource: 'resource',
  drilling: 'drilling',
  exploration: 'exploration',
  geologist: 'geologist',
  metallurgy: 'metallurgy',
};

/**
 * Common OCR confusion pairs
 */
const OCR_CONFUSIONS: Array<[RegExp, string]> = [
  // Number confusions
  [/\b0\b/g, 'O'], // Zero vs. O (context-dependent)
  [/\bO\b/g, '0'], // O vs. Zero (context-dependent)
  [/\b1\b/g, 'l'], // 1 vs. l (context-dependent)
  [/\bl\b/g, '1'], // l vs. 1 (context-dependent)
  [/\bS\b/g, '5'], // S vs. 5 (in numbers)
  
  // Letter confusions
  [/rn/g, 'm'], // rn often misread as m
  [/vv/g, 'w'], // vv often misread as w
  [/cl/g, 'd'], // cl often misread as d
  
  // Special characters
  [/\|/g, 'l'], // Pipe vs. lowercase L
  [/\[/g, 'I'], // Bracket vs. uppercase i
];

/**
 * Text Correction Service Configuration
 */
export interface TextCorrectorConfig {
  minConfidence?: number;
  enableDomainCorrection?: boolean;
  enableOCRErrorCorrection?: boolean;
  enableSpellCheck?: boolean;
  aggressiveness?: 'conservative' | 'moderate' | 'aggressive';
}

/**
 * Text Correction Service
 * 
 * Corrects and enhances OCR output quality
 */
export class TextCorrectorService {
  private config: Required<TextCorrectorConfig>;
  private customDictionary: Map<string, string>;

  constructor(config: TextCorrectorConfig = {}) {
    this.config = {
      minConfidence: config.minConfidence || 0.7,
      enableDomainCorrection: config.enableDomainCorrection ?? true,
      enableOCRErrorCorrection: config.enableOCRErrorCorrection ?? true,
      enableSpellCheck: config.enableSpellCheck ?? true,
      aggressiveness: config.aggressiveness || 'moderate',
    };

    this.customDictionary = new Map(Object.entries(MINING_TERMINOLOGY));
  }

  /**
   * Correct OCR text output
   */
  async correct(text: string, confidence?: number): Promise<CorrectionResult> {
    const startTime = Date.now();
    console.log('[TextCorrector] Starting text correction...');

    const corrections: TextCorrection[] = [];
    let correctedText = text;

    // 1. Domain-specific terminology correction
    if (this.config.enableDomainCorrection) {
      const domainCorrections = this.correctDomainTerminology(correctedText);
      corrections.push(...domainCorrections);
      correctedText = this.applyCorrections(correctedText, domainCorrections);
    }

    // 2. Common OCR error correction
    if (this.config.enableOCRErrorCorrection) {
      const ocrCorrections = this.correctOCRErrors(correctedText, confidence);
      corrections.push(...ocrCorrections);
      correctedText = this.applyCorrections(correctedText, ocrCorrections);
    }

    // 3. Case corrections
    const caseCorrections = this.correctCasing(correctedText);
    corrections.push(...caseCorrections);
    correctedText = this.applyCorrections(correctedText, caseCorrections);

    // 4. Number format corrections
    const numberCorrections = this.correctNumberFormats(correctedText);
    corrections.push(...numberCorrections);
    correctedText = this.applyCorrections(correctedText, numberCorrections);

    const processingTimeMs = Date.now() - startTime;
    const confidenceScore = this.calculateConfidence(corrections, confidence);

    console.log(
      `[TextCorrector] Applied ${corrections.length} corrections in ${processingTimeMs}ms (confidence: ${confidenceScore.toFixed(2)})`
    );

    return {
      originalText: text,
      correctedText,
      corrections,
      confidenceScore,
      processingTimeMs,
    };
  }

  /**
   * Correct domain-specific terminology
   */
  private correctDomainTerminology(text: string): TextCorrection[] {
    const corrections: TextCorrection[] = [];
    const words = text.split(/\b/);
    let position = 0;

    for (const word of words) {
      const lowerWord = word.toLowerCase();
      const correctForm = this.customDictionary.get(lowerWord);

      if (correctForm && word !== correctForm) {
        corrections.push({
          position: { start: position, end: position + word.length },
          originalWord: word,
          correctedWord: correctForm,
          reason: 'domain-terminology',
          confidence: 0.95,
        });
      }

      position += word.length;
    }

    return corrections;
  }

  /**
   * Correct common OCR errors
   */
  private correctOCRErrors(text: string, confidence?: number): TextCorrection[] {
    const corrections: TextCorrection[] = [];

    // Only apply aggressive OCR corrections if confidence is low
    const shouldCorrect = !confidence || confidence < 0.8;
    if (!shouldCorrect) {
      return corrections;
    }

    // Apply context-aware OCR confusion corrections
    // This is a simplified version - in production, use more sophisticated NLP

    // Example: Correct "rn" to "m" in common words
    const rnToM = ['infonnation', 'fonnation', 'confinn'];
    for (const word of rnToM) {
      const regex = new RegExp(word, 'gi');
      let match;
      while ((match = regex.exec(text)) !== null) {
        const correctedWord = word.replace(/rn/gi, 'm');
        corrections.push({
          position: { start: match.index, end: match.index + word.length },
          originalWord: word,
          correctedWord,
          reason: 'common-ocr-error',
          confidence: 0.85,
        });
      }
    }

    return corrections;
  }

  /**
   * Correct casing errors
   */
  private correctCasing(text: string): TextCorrection[] {
    const corrections: TextCorrection[] = [];

    // Correct all-caps words that should be title case
    const words = text.split(/\b/);
    let position = 0;

    for (const word of words) {
      // Skip short words and already properly cased words
      if (word.length <= 2 || word === word.toLowerCase() || word === word.toUpperCase()) {
        position += word.length;
        continue;
      }

      // Check if it's a proper noun or acronym
      const isAcronym = /^[A-Z]{2,}$/.test(word);
      const startsWithCap = /^[A-Z][a-z]/.test(word);

      if (!isAcronym && !startsWithCap && /[A-Z]/.test(word)) {
        // Mixed case that looks wrong - correct to title case
        const correctedWord = word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
        
        if (word !== correctedWord) {
          corrections.push({
            position: { start: position, end: position + word.length },
            originalWord: word,
            correctedWord,
            reason: 'case-correction',
            confidence: 0.75,
          });
        }
      }

      position += word.length;
    }

    return corrections;
  }

  /**
   * Correct number formatting
   */
  private correctNumberFormats(text: string): TextCorrection[] {
    const corrections: TextCorrection[] = [];

    // Correct common number format issues
    // Example: "1 234.56" → "1,234.56" or "1234.56"
    const numberPattern = /(\d+)\s+(\d{3})/g;
    let match;

    while ((match = numberPattern.exec(text)) !== null) {
      const original = match[0];
      const corrected = original.replace(/\s+/g, ',');
      
      corrections.push({
        position: { start: match.index, end: match.index + original.length },
        originalWord: original,
        correctedWord: corrected,
        reason: 'number-format',
        confidence: 0.90,
      });
    }

    return corrections;
  }

  /**
   * Apply corrections to text
   */
  private applyCorrections(text: string, corrections: TextCorrection[]): string {
    // Sort corrections by position (reverse order to maintain indices)
    const sorted = [...corrections].sort((a, b) => b.position.start - a.position.start);

    let result = text;
    for (const correction of sorted) {
      result =
        result.substring(0, correction.position.start) +
        correction.correctedWord +
        result.substring(correction.position.end);
    }

    return result;
  }

  /**
   * Calculate overall confidence score
   */
  private calculateConfidence(corrections: TextCorrection[], ocrConfidence?: number): number {
    if (corrections.length === 0) {
      return ocrConfidence || 1.0;
    }

    // Average correction confidence
    const avgCorrectionConfidence =
      corrections.reduce((sum, c) => sum + c.confidence, 0) / corrections.length;

    // Combine with OCR confidence if available
    if (ocrConfidence) {
      return (ocrConfidence + avgCorrectionConfidence) / 2;
    }

    return avgCorrectionConfidence;
  }

  /**
   * Add custom dictionary entry
   */
  addToDictionary(term: string, correctForm: string): void {
    this.customDictionary.set(term.toLowerCase(), correctForm);
  }

  /**
   * Bulk add dictionary entries
   */
  addBulkDictionary(entries: Record<string, string>): void {
    for (const [term, correctForm] of Object.entries(entries)) {
      this.customDictionary.set(term.toLowerCase(), correctForm);
    }
  }

  /**
   * Get current dictionary size
   */
  getDictionarySize(): number {
    return this.customDictionary.size;
  }
}

// Export singleton instance
export const textCorrector = new TextCorrectorService();
