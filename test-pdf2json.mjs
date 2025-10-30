import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const PDFParser = require('pdf2json');
import fs from 'fs';

// Create a simple PDF for testing
const simplePDF = Buffer.from(`%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> >> >> >>
endobj
4 0 obj
<< /Length 55 >>
stream
BT
/F1 12 Tf
100 700 Td
(Hello World from PDF) Tj
ET
endstream
endobj
xref
0 5
0000000000 65535 f
0000000009 00000 n
0000000058 00000 n
0000000115 00000 n
0000000323 00000 n
trailer
<< /Size 5 /Root 1 0 R >>
startxref
428
%%EOF`);

const pdfParser = new PDFParser();

pdfParser.on('pdfParser_dataError', (errData) => {
  console.error('❌ PDF parsing error:', errData.parserError);
});

pdfParser.on('pdfParser_dataReady', (pdfData) => {
  console.log('✅ PDF parsed successfully!');
  console.log('Pages:', pdfData.Pages ? pdfData.Pages.length : 0);
  
  let fullText = '';
  if (pdfData.Pages && Array.isArray(pdfData.Pages)) {
    for (const page of pdfData.Pages) {
      if (page.Texts && Array.isArray(page.Texts)) {
        for (const text of page.Texts) {
          if (text.R && Array.isArray(text.R)) {
            for (const run of text.R) {
              if (run.T) {
                fullText += decodeURIComponent(run.T) + ' ';
              }
            }
          }
        }
      }
      fullText += '\n';
    }
  }
  
  console.log('Extracted text:', fullText.trim());
});

console.log('Parsing PDF...');
pdfParser.parseBuffer(simplePDF);
