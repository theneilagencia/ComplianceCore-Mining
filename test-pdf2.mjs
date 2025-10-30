import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const pdfParse = require('pdf-parse/dist/pdf-parse/cjs/index.cjs');

console.log('pdfParse type:', typeof pdfParse);
console.log('pdfParse:', pdfParse);

if (typeof pdfParse === 'function') {
  const testPDF = Buffer.from('%PDF-1.4\n1 0 obj\n<<\n/Type /Catalog\n/Pages 2 0 R\n>>\nendobj\ntrailer\n<<\n/Size 2\n/Root 1 0 R\n>>\nstartxref\n0\n%%EOF');
  
  pdfParse(testPDF).then(data => {
    console.log('✅ PDF parsed!');
    console.log('Text:', data.text);
  }).catch(err => {
    console.error('❌ Error:', err.message);
  });
} else {
  console.error('pdfParse is not a function!');
}
