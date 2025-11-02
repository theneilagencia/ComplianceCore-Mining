# Test Fixtures

This directory contains test fixture files used by E2E tests.

## Required Files

### Export System Tests
- `sample-report.pdf` - Basic PDF report for export testing
- `complete-report.pdf` - Full report with all sections
- `jorc-report.pdf` - JORC standard report
- `ni43-101-report.pdf` - NI 43-101 standard report
- `large-report.pdf` - Large PDF for performance testing
- `report-with-tables.pdf` - Report with table formatting
- `report-with-numbers.pdf` - Report with numerical data
- `report-long-text.pdf` - Report with long text content

### Upload System Tests
- `report-1.pdf` - Test file for batch upload
- `report-2.pdf` - Test file for batch upload
- `report-3.pdf` - Test file for batch upload
- `invalid-file.txt` - Invalid file type for validation
- `oversized-report.pdf` - File exceeding 50MB limit (for validation)
- `invalid@name#file.pdf` - File with invalid characters in name

### OCR System Tests
- `scanned-report.pdf` - Scanned document for OCR testing
- `poor-quality.pdf` - Low-quality scan (confidence < 70%)
- `portuguese-report.pdf` - Portuguese language document
- `jorc-scanned.pdf` - Scanned JORC report
- `large-scanned-report.pdf` - Multi-page scanned document
- `corrupted-scan.pdf` - Corrupted scan for error handling
- `bilingual-report.pdf` - Document with multiple languages
- `low-quality-scan.pdf` - Low-quality scan for pre-processing

## Creating Test Fixtures

To create mock PDF files for testing:

```javascript
// Using pdf-lib or similar library
import { PDFDocument } from 'pdf-lib';

async function createTestPDF(filename, pages = 1) {
  const pdfDoc = await PDFDocument.create();
  for (let i = 0; i < pages; i++) {
    pdfDoc.addPage();
  }
  const pdfBytes = await pdfDoc.save();
  await fs.writeFile(filename, pdfBytes);
}
```

## Notes

- All PDF files should be valid and readable
- File sizes should be realistic (10KB - 50MB range)
- Include various quality levels for OCR testing
- Mock files can be generated programmatically if needed
