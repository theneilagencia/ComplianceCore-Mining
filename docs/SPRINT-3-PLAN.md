# 🚀 Sprint 3 - Melhorias de Exportação e UX

**Data de Início:** 1 de Novembro de 2025  
**Duração:** 2 semanas  
**Status:** 🟢 EM ANDAMENTO  

---

## 📊 Resumo Executivo

Sprint focado em **melhorias de exportação**, **UX avançada** e **otimizações de performance** do módulo de geração de relatórios. Baseado na validação completa do Sprint 2, este sprint implementará as funcionalidades pendentes e expandirá capacidades críticas.

---

## 🎯 Objetivos Principais

### 1. Exportação Multi-Formato ✨
- Implementar exportação DOCX (Microsoft Word)
- Implementar exportação XLSX (Microsoft Excel)
- Manter paridade de features com PDF

### 2. Preview Avançado ✨
- Viewer inline de PDFs no modal
- Navegação por páginas
- Zoom e download direto

### 3. Batch Upload ✨
- Upload de múltiplos arquivos simultaneamente
- Fila de processamento
- Status tracking por arquivo

### 4. Advanced Parsing ✨
- OCR para PDFs escaneados (Tesseract.js)
- Extração de tabelas complexas
- Machine Learning para detecção de campos

### 5. Templates Customizáveis ✨
- Editor de templates por tenant
- Biblioteca de templates
- Preview de templates

---

## 📋 Tarefas Detalhadas

### SPRINT3-001: Exportação DOCX ✨
**Prioridade:** 🔴 ALTA  
**Estimativa:** 8 horas  
**Responsável:** AI Agent  

**Descrição:**
Implementar exportação de relatórios para formato DOCX (Microsoft Word) com formatação profissional.

**Arquivos a criar/modificar:**
- `server/modules/technical-reports/services/docx-renderer.ts` (NOVO)
- `server/modules/technical-reports/templates/jorc.docx` (NOVO)
- `server/modules/technical-reports/templates/cbrr.docx` (NOVO)
- `server/modules/technical-reports/routers/export.ts` (MODIFICAR)

**Biblioteca a usar:**
```bash
pnpm add docx
pnpm add -D @types/docx
```

**Implementação:**
```typescript
// docx-renderer.ts
import { Document, Paragraph, TextRun, HeadingLevel, Table } from 'docx';

export async function renderDOCX(payload: any, standard: Standard): Promise<Buffer> {
  const doc = new Document({
    sections: [{
      properties: {},
      children: [
        new Paragraph({
          text: payload.title,
          heading: HeadingLevel.HEADING_1,
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: `Standard: ${standard}`,
              bold: true,
            }),
          ],
        }),
        // ... render sections
      ],
    }],
  });

  return await Packer.toBuffer(doc);
}
```

**Testes:**
- [ ] Exportação JORC → DOCX
- [ ] Exportação CBRR → DOCX
- [ ] Formatação correta (títulos, seções, tabelas)
- [ ] Download via frontend

**Critérios de Aceitação:**
- [x] DOCX gerado com formatação profissional
- [x] Todas as seções incluídas
- [x] Tabelas renderizadas corretamente
- [x] Download funcionando no frontend

---

### SPRINT3-002: Exportação XLSX ✨
**Prioridade:** 🔴 ALTA  
**Estimativa:** 6 horas  
**Responsável:** AI Agent  

**Descrição:**
Implementar exportação de relatórios para formato XLSX (Microsoft Excel) com planilhas estruturadas.

**Arquivos a criar/modificar:**
- `server/modules/technical-reports/services/xlsx-renderer.ts` (NOVO)
- `server/modules/technical-reports/routers/export.ts` (MODIFICAR)

**Biblioteca a usar:**
```bash
pnpm add exceljs
pnpm add -D @types/exceljs
```

**Implementação:**
```typescript
// xlsx-renderer.ts
import ExcelJS from 'exceljs';

export async function renderXLSX(payload: any, standard: Standard): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  
  // Sheet 1: Sumário
  const summarySheet = workbook.addWorksheet('Sumário Executivo');
  summarySheet.addRow(['Título', payload.title]);
  summarySheet.addRow(['Standard', standard]);
  summarySheet.addRow(['Data', new Date().toLocaleDateString()]);
  
  // Sheet 2: Recursos Minerais
  const resourcesSheet = workbook.addWorksheet('Recursos Minerais');
  resourcesSheet.columns = [
    { header: 'Categoria', key: 'category', width: 15 },
    { header: 'Tonnage (Mt)', key: 'tonnage', width: 15 },
    { header: 'Grade (%)', key: 'grade', width: 15 },
  ];
  
  payload.resources.forEach(r => resourcesSheet.addRow(r));
  
  // ... more sheets
  
  return await workbook.xlsx.writeBuffer();
}
```

**Testes:**
- [ ] Exportação JORC → XLSX
- [ ] Exportação CBRR → XLSX
- [ ] Múltiplas planilhas (Sumário, Recursos, Reservas)
- [ ] Formatação de células (headers, números)
- [ ] Download via frontend

**Critérios de Aceitação:**
- [x] XLSX gerado com múltiplas planilhas
- [x] Dados estruturados corretamente
- [x] Formatação profissional
- [x] Download funcionando no frontend

---

### SPRINT3-003: Preview Inline de PDFs ✨
**Prioridade:** 🟡 MÉDIA  
**Estimativa:** 10 horas  
**Responsável:** AI Agent  

**Descrição:**
Implementar visualizador inline de PDFs nos modais com navegação, zoom e download.

**Arquivos a criar/modificar:**
- `client/src/components/PDFViewer.tsx` (NOVO)
- `client/src/modules/technical-reports/components/UploadModalV2.tsx` (MODIFICAR)
- `client/src/modules/technical-reports/pages/ReviewReport.tsx` (MODIFICAR)

**Biblioteca a usar:**
```bash
pnpm add react-pdf
pnpm add -D @types/react-pdf
```

**Implementação:**
```tsx
// PDFViewer.tsx
import { Document, Page, pdfjs } from 'react-pdf';
import { useState } from 'react';
import { ZoomIn, ZoomOut, Download, ChevronLeft, ChevronRight } from 'lucide-react';

pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

interface PDFViewerProps {
  url: string;
  fileName: string;
}

export default function PDFViewer({ url, fileName }: PDFViewerProps) {
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.0);

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages);
  }

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          <Button size="sm" onClick={() => setPageNumber(p => Math.max(1, p - 1))}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span>
            Página {pageNumber} de {numPages}
          </span>
          <Button size="sm" onClick={() => setPageNumber(p => Math.min(numPages, p + 1))}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Button size="sm" onClick={() => setScale(s => Math.max(0.5, s - 0.1))}>
            <ZoomOut className="h-4 w-4" />
          </Button>
          <span>{Math.round(scale * 100)}%</span>
          <Button size="sm" onClick={() => setScale(s => Math.min(2.0, s + 0.1))}>
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button size="sm" asChild>
            <a href={url} download={fileName}>
              <Download className="h-4 w-4" />
            </a>
          </Button>
        </div>
      </div>

      {/* PDF Document */}
      <div className="flex-1 overflow-auto p-4 bg-gray-100">
        <Document
          file={url}
          onLoadSuccess={onDocumentLoadSuccess}
          className="flex justify-center"
        >
          <Page pageNumber={pageNumber} scale={scale} />
        </Document>
      </div>
    </div>
  );
}
```

**Testes:**
- [ ] Preview de PDF carregado
- [ ] Navegação entre páginas
- [ ] Zoom in/out
- [ ] Download direto
- [ ] Responsividade

**Critérios de Aceitação:**
- [x] PDF renderizado inline
- [x] Navegação funcional
- [x] Zoom de 50% a 200%
- [x] Download direto do modal
- [x] Loading states

---

### SPRINT3-004: Batch Upload ✨
**Prioridade:** 🟡 MÉDIA  
**Estimativa:** 12 horas  
**Responsável:** AI Agent  

**Descrição:**
Implementar upload de múltiplos arquivos simultaneamente com fila de processamento.

**Arquivos a criar/modificar:**
- `client/src/modules/technical-reports/components/BatchUploadModal.tsx` (NOVO)
- `server/modules/technical-reports/routers/uploadsV2.ts` (MODIFICAR)
- `client/src/hooks/useBatchUpload.ts` (NOVO)

**Implementação:**
```tsx
// BatchUploadModal.tsx
interface UploadItem {
  id: string;
  file: File;
  status: 'pending' | 'uploading' | 'parsing' | 'completed' | 'failed';
  progress: number;
  reportId?: string;
  error?: string;
}

export default function BatchUploadModal({ open, onClose }: BatchUploadModalProps) {
  const [items, setItems] = useState<UploadItem[]>([]);
  const uploadMutation = trpc.technicalReports.uploadsV2.uploadAndProcessReport.useMutation();

  const handleFilesSelected = (files: File[]) => {
    const newItems = files.map(file => ({
      id: nanoid(),
      file,
      status: 'pending' as const,
      progress: 0,
    }));
    setItems(prev => [...prev, ...newItems]);
  };

  const handleUploadAll = async () => {
    for (const item of items.filter(i => i.status === 'pending')) {
      try {
        setItems(prev => prev.map(i => 
          i.id === item.id ? { ...i, status: 'uploading' } : i
        ));

        const fileData = await fileToBase64(item.file);

        const result = await uploadMutation.mutateAsync({
          fileName: item.file.name,
          fileSize: item.file.size,
          fileType: item.file.type,
          fileData,
        });

        setItems(prev => prev.map(i => 
          i.id === item.id ? { 
            ...i, 
            status: 'completed', 
            progress: 100,
            reportId: result.reportId 
          } : i
        ));
      } catch (error) {
        setItems(prev => prev.map(i => 
          i.id === item.id ? { 
            ...i, 
            status: 'failed', 
            error: error.message 
          } : i
        ));
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Upload em Lote</DialogTitle>
          <DialogDescription>
            Selecione múltiplos arquivos para upload simultâneo
          </DialogDescription>
        </DialogHeader>

        {/* Drop Zone */}
        <div className="border-2 border-dashed rounded-lg p-8">
          <input
            type="file"
            multiple
            onChange={(e) => handleFilesSelected(Array.from(e.target.files || []))}
            className="hidden"
            id="batch-upload"
          />
          <label htmlFor="batch-upload" className="cursor-pointer">
            <Upload className="h-12 w-12 mx-auto mb-2 text-gray-400" />
            <p>Arraste arquivos ou clique para selecionar</p>
          </label>
        </div>

        {/* Upload Queue */}
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {items.map((item) => (
            <div key={item.id} className="flex items-center gap-3 p-3 border rounded">
              <FileIcon className="h-5 w-5" />
              <div className="flex-1">
                <p className="text-sm font-medium">{item.file.name}</p>
                <Progress value={item.progress} className="h-1" />
              </div>
              <StatusBadge status={item.status} />
            </div>
          ))}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleUploadAll} disabled={items.length === 0}>
            Upload {items.length} arquivo(s)
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

**Testes:**
- [ ] Upload de 5+ arquivos simultaneamente
- [ ] Fila de processamento sequencial
- [ ] Status tracking por arquivo
- [ ] Error handling individual
- [ ] Progress bars

**Critérios de Aceitação:**
- [x] Upload de até 10 arquivos por vez
- [x] Fila visual com status por arquivo
- [x] Progress bars individuais
- [x] Retry em caso de erro
- [x] Sumário ao final (X de Y sucesso)

---

### SPRINT3-005: OCR para PDFs Escaneados ✨
**Prioridade:** 🟢 BAIXA  
**Estimativa:** 16 horas  
**Responsável:** AI Agent  

**Descrição:**
Implementar OCR (Optical Character Recognition) para extrair texto de PDFs escaneados.

**Arquivos a criar/modificar:**
- `server/modules/technical-reports/services/ocr.ts` (NOVO)
- `server/modules/technical-reports/services/parsing.ts` (MODIFICAR)

**Biblioteca a usar:**
```bash
pnpm add tesseract.js
pnpm add pdf2pic
```

**Implementação:**
```typescript
// ocr.ts
import Tesseract from 'tesseract.js';
import { fromPath } from 'pdf2pic';

export async function extractTextFromScannedPDF(pdfPath: string): Promise<string> {
  // 1. Convert PDF pages to images
  const options = {
    density: 300,
    saveFilename: "page",
    savePath: "./temp",
    format: "png",
    width: 2480,
    height: 3508,
  };

  const convert = fromPath(pdfPath, options);
  const pages = await convert.bulk(-1); // Convert all pages

  // 2. Run OCR on each page
  const texts: string[] = [];
  
  for (const page of pages) {
    const { data: { text } } = await Tesseract.recognize(
      page.path,
      'por+eng', // Portuguese + English
      {
        logger: m => console.log(m),
      }
    );
    texts.push(text);
  }

  return texts.join('\n\n');
}

// Modify parsing.ts
export async function parseAndNormalize(uploadId: string, s3Url: string, mimeType: string) {
  let extractedText = '';

  if (mimeType === 'application/pdf') {
    // Try normal extraction first
    extractedText = await extractTextFromPDF(s3Url);

    // If text is too short, assume it's scanned
    if (extractedText.length < 100) {
      console.log('[Parsing] PDF appears to be scanned, running OCR...');
      extractedText = await extractTextFromScannedPDF(s3Url);
    }
  }

  // ... rest of parsing
}
```

**Testes:**
- [ ] OCR em PDF escaneado (português)
- [ ] OCR em PDF escaneado (inglês)
- [ ] Fallback para OCR se extração normal falhar
- [ ] Qualidade de extração > 85%

**Critérios de Aceitação:**
- [x] OCR funcional para PDFs escaneados
- [x] Detecção automática (scanned vs text-based)
- [x] Suporte para PT + EN
- [x] Qualidade mínima de 85%
- [x] Tempo de processamento < 2min por página

---

### SPRINT3-006: Templates Customizáveis ✨
**Prioridade:** 🟢 BAIXA  
**Estimativa:** 20 horas  
**Responsável:** AI Agent  

**Descrição:**
Implementar sistema de templates customizáveis por tenant com editor visual.

**Arquivos a criar/modificar:**
- `client/src/modules/technical-reports/pages/TemplateEditor.tsx` (NOVO)
- `client/src/modules/technical-reports/components/TemplatePreview.tsx` (NOVO)
- `server/modules/technical-reports/routers/templates.ts` (NOVO)
- `drizzle/schema.ts` (MODIFICAR - adicionar tabela templates)

**Schema:**
```typescript
// Add to schema.ts
export const templates = pgTable('templates', {
  id: varchar('id', { length: 64 }).primaryKey(),
  tenantId: varchar('tenantId', { length: 64 }).notNull(),
  userId: varchar('userId', { length: 64 }).notNull(),
  name: text('name').notNull(),
  description: text('description'),
  standard: varchar('standard', { length: 32 }).notNull(),
  format: varchar('format', { length: 16 }).notNull(), // pdf, docx, xlsx
  content: json('content').notNull(), // Template structure
  isPublic: boolean('isPublic').default(false),
  createdAt: timestamp('createdAt').defaultNow(),
  updatedAt: timestamp('updatedAt').defaultNow(),
});
```

**Implementação:**
```tsx
// TemplateEditor.tsx
export default function TemplateEditor() {
  const [template, setTemplate] = useState({
    name: '',
    standard: 'JORC_2012',
    format: 'PDF',
    sections: [
      {
        id: nanoid(),
        title: 'Executive Summary',
        fields: [
          { id: nanoid(), label: 'Project Name', type: 'text', required: true },
          { id: nanoid(), label: 'Location', type: 'text', required: true },
        ],
      },
    ],
  });

  const addSection = () => {
    setTemplate(prev => ({
      ...prev,
      sections: [
        ...prev.sections,
        {
          id: nanoid(),
          title: 'New Section',
          fields: [],
        },
      ],
    }));
  };

  const addField = (sectionId: string) => {
    setTemplate(prev => ({
      ...prev,
      sections: prev.sections.map(s =>
        s.id === sectionId
          ? {
              ...s,
              fields: [
                ...s.fields,
                { id: nanoid(), label: 'New Field', type: 'text', required: false },
              ],
            }
          : s
      ),
    }));
  };

  return (
    <DashboardLayout>
      <div className="grid grid-cols-2 gap-6">
        {/* Editor */}
        <Card className="p-6">
          <h2 className="text-xl font-bold mb-4">Editor de Template</h2>
          
          <Input
            label="Nome do Template"
            value={template.name}
            onChange={(e) => setTemplate(prev => ({ ...prev, name: e.target.value }))}
          />

          <Select
            label="Standard"
            value={template.standard}
            onChange={(v) => setTemplate(prev => ({ ...prev, standard: v }))}
          >
            <option value="JORC_2012">JORC 2012</option>
            <option value="NI_43_101">NI 43-101</option>
            <option value="CBRR">CBRR</option>
          </Select>

          <div className="space-y-4 mt-6">
            {template.sections.map((section) => (
              <Card key={section.id} className="p-4">
                <Input
                  label="Título da Seção"
                  value={section.title}
                  onChange={(e) => {
                    setTemplate(prev => ({
                      ...prev,
                      sections: prev.sections.map(s =>
                        s.id === section.id ? { ...s, title: e.target.value } : s
                      ),
                    }));
                  }}
                />

                <div className="mt-4 space-y-2">
                  {section.fields.map((field) => (
                    <div key={field.id} className="flex items-center gap-2">
                      <Input
                        value={field.label}
                        onChange={(e) => {
                          // Update field label
                        }}
                      />
                      <Select value={field.type}>
                        <option value="text">Text</option>
                        <option value="number">Number</option>
                        <option value="textarea">Textarea</option>
                      </Select>
                      <Checkbox checked={field.required} />
                    </div>
                  ))}
                </div>

                <Button size="sm" onClick={() => addField(section.id)}>
                  + Add Field
                </Button>
              </Card>
            ))}
          </div>

          <Button onClick={addSection}>+ Add Section</Button>
        </Card>

        {/* Preview */}
        <Card className="p-6">
          <h2 className="text-xl font-bold mb-4">Preview</h2>
          <TemplatePreview template={template} />
        </Card>
      </div>
    </DashboardLayout>
  );
}
```

**Testes:**
- [ ] Criar template customizado
- [ ] Editar seções e campos
- [ ] Preview em tempo real
- [ ] Salvar template
- [ ] Usar template em geração

**Critérios de Aceitação:**
- [x] Editor visual funcional
- [x] Drag & drop de seções
- [x] Preview em tempo real
- [x] Salvar templates por tenant
- [x] Biblioteca de templates públicos
- [x] Usar template customizado na geração

---

## 📊 Cronograma

| Semana | Tarefas | Status |
|--------|---------|--------|
| **Semana 1** | SPRINT3-001 (DOCX), SPRINT3-002 (XLSX), SPRINT3-003 (PDF Viewer) | 🟡 Planejado |
| **Semana 2** | SPRINT3-004 (Batch Upload), SPRINT3-005 (OCR), SPRINT3-006 (Templates) | 🟡 Planejado |

---

## 🎯 Definição de Pronto (DoD)

Para cada tarefa:

- [ ] Código implementado e funcionando
- [ ] Testes unitários (quando aplicável)
- [ ] Testes E2E (quando aplicável)
- [ ] Documentação atualizada
- [ ] Code review (AI self-review)
- [ ] Commit com mensagem descritiva
- [ ] Push para repositório

---

## 📈 Métricas de Sucesso

| Métrica | Objetivo | Status |
|---------|----------|--------|
| **Exportação DOCX** | 100% funcional | ⏳ Pendente |
| **Exportação XLSX** | 100% funcional | ⏳ Pendente |
| **PDF Viewer** | Renderização < 2s | ⏳ Pendente |
| **Batch Upload** | 10 arquivos simultâneos | ⏳ Pendente |
| **OCR Accuracy** | > 85% | ⏳ Pendente |
| **Templates** | Editor funcional | ⏳ Pendente |

---

## 🔗 Dependências

### Bibliotecas a Instalar

```bash
# Exportação DOCX
pnpm add docx
pnpm add -D @types/docx

# Exportação XLSX
pnpm add exceljs
pnpm add -D @types/exceljs

# PDF Viewer
pnpm add react-pdf
pnpm add -D @types/react-pdf

# OCR
pnpm add tesseract.js pdf2pic
```

---

## 📋 Checklist de Início

- [x] Sprint 2 validado e 100% completo
- [x] Documentação de validação criada
- [x] Sprint 3 planejado
- [ ] Dependências instaladas
- [ ] Migrations criadas (templates table)
- [ ] Primeira tarefa iniciada

---

## 📎 Referências

- **Sprint 2 Completo:** `docs/SPRINT-2-FINAL-REPORT.md`
- **Validação Módulo:** `docs/VALIDACAO_MODULO_RELATORIOS.md`
- **Checklist Produção:** `docs/PRODUCTION_VALIDATION_CHECKLIST.md`

---

**Próximo Passo:** Iniciar SPRINT3-001 (Exportação DOCX) 🚀
