# Test Fixtures

Esta pasta contém arquivos de teste usados pelos testes E2E do Playwright.

## Arquivos

### invalid-file.txt
- **Propósito**: Validação negativa de upload de arquivos
- **Uso**: Testar se o sistema rejeita arquivos que não são PDF
- **Testes**: `upload.spec.ts` - "should validate file type (PDF only)"

### test-report.pdf (TBD)
- **Propósito**: Upload válido de documento PDF
- **Uso**: Testar fluxo completo de upload e processamento
- **Testes**: 
  - `upload.spec.ts` - "should upload PDF file successfully"
  - `upload.spec.ts` - "should show upload progress"
  - `download.spec.ts` - "should download report as PDF"

### test-report-2.pdf (TBD)
- **Propósito**: Segundo arquivo PDF para testes de múltiplos uploads
- **Uso**: Testar upload de múltiplos documentos simultaneamente
- **Testes**: `upload.spec.ts` - "should allow multiple file uploads"

## Como Adicionar PDFs de Teste

Os PDFs de teste não estão incluídos no repositório. Para executar os testes E2E completos, você precisa:

### Opção 1: Usar PDFs existentes do projeto
```bash
# Copie um relatório de exemplo do projeto
cp docs/examples/sample-report.pdf tests/fixtures/test-report.pdf
cp docs/examples/sample-report.pdf tests/fixtures/test-report-2.pdf
```

### Opção 2: Gerar PDFs de teste programaticamente
```javascript
// No script de setup dos testes, você pode gerar PDFs simples:
import PDFDocument from 'pdfkit';
import fs from 'fs';

const doc = new PDFDocument();
doc.pipe(fs.createWriteStream('tests/fixtures/test-report.pdf'));
doc.fontSize(25).text('Test Mining Report', 100, 100);
doc.end();
```

### Opção 3: Download de PDFs públicos
```bash
# Baixe um relatório técnico público de mineração
curl -o tests/fixtures/test-report.pdf "https://example.com/sample-mining-report.pdf"
```

## Estrutura Esperada

Após configurar os fixtures, a estrutura deve ser:

```
tests/fixtures/
├── README.md
├── invalid-file.txt
├── test-report.pdf
└── test-report-2.pdf
```

## Validação

Para verificar se os fixtures estão configurados corretamente:

```bash
# Verifique se os arquivos existem
ls -lh tests/fixtures/

# Execute apenas os testes de upload
pnpm exec playwright test upload
```

## Notas de Segurança

- ❌ **NÃO** commite PDFs reais com dados sensíveis
- ✅ Use apenas PDFs de exemplo ou gerados para testes
- ✅ Adicione `*.pdf` ao `.gitignore` se necessário
- ✅ Documente claramente como reproduzir os fixtures

## Referências

- [Playwright File Uploads](https://playwright.dev/docs/input#upload-files)
- [PDFKit Documentation](https://pdfkit.org/)
